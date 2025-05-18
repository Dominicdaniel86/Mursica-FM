import { prisma } from '../config.js';
import { InvalidParameterError, ExistingUserError, RegistrationError, NotVerifiedError } from '../errors/index.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { generateRandomString } from '../utility/fileUtils.js';
import { comparePassword, hashPassword } from './auth.middleware.js';
import { generateJWTToken } from '../utility/jwtUtils.js';
import type { User } from '@prisma/client';
import logger from '../logger/logger.js';

dotenv.config();

export async function register(userName: string, email: string, password: string): Promise<void> {
    if (userName === undefined || userName === '') {
        throw new InvalidParameterError('Username is required');
    }
    if (email === undefined || email === '') {
        throw new InvalidParameterError('Email is required');
    }
    if (password === undefined || password === '') {
        throw new InvalidParameterError('Password is required');
    }

    // Username requirements
    if (userName.length < 3) {
        throw new InvalidParameterError('Username must be at least 3 characters long');
    }

    // Email requirements
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
    if (!isValidEmail) {
        throw new InvalidParameterError('Invalid email format');
    }

    // Password requirements
    if (password.length < 8) {
        throw new InvalidParameterError('Password must be at least 8 characters long');
    }
    if (!/[0-9]/.test(password)) {
        throw new InvalidParameterError('Password must contain at least 1 number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new InvalidParameterError('Password must contain at least 1 special character');
    }
    // TODO: Check if the password is in the top 1000 passwords

    // Check if the username is already taken
    const existingUserEmail = await prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (existingUserEmail) {
        throw new ExistingUserError('Email is already in use');
    }

    const existingUserName = await prisma.user.findFirst({
        where: {
            name: userName,
        },
    });
    if (existingUserName) {
        throw new ExistingUserError('Username is already in use');
    }

    // Get verification code
    const verificationCode = generateRandomString(32);

    try {
        const hashedPassword = await hashPassword(password);
        await prisma.user.create({
            data: {
                name: userName,
                email,
                password: hashedPassword,
                verificationCode,
            },
        });

        // Send a confirmation email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Return success message
        const mailOptions = {
            from: `"Mursica.FM" <${process.env.EMAIL}>`,
            to: email,
            subject: 'Please confirm your email',
            text: `Please confirm your email by clicking on the following link: http://localhost:80/api/auth/confirm-email?token=${verificationCode}`,
            // TODO: Implement validation URL API
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error creating user:', error);
        throw new RegistrationError('Error creating user');
    }

    // TODO: One time an hour it should check if the user has confirmed their email. If not, delete the user from the database.
}

export async function confirmEmail(token: string): Promise<void> {
    if (token === undefined || token === '') {
        throw new InvalidParameterError('Token is required');
    }

    // Check if the token is valid
    const user = await prisma.user.findUnique({
        where: {
            verificationCode: token,
        },
    });
    if (user === null || user === undefined) {
        throw new InvalidParameterError('Invalid token');
    }

    if (user.verified) {
        throw new InvalidParameterError('Email already verified');
    }

    // Update the user's email confirmation status
    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            verified: true,
            verificationCode: null,
        },
    });
}

export async function login(password: string, email?: string, user?: string): Promise<string> {
    if (password === undefined || password === '') {
        throw new InvalidParameterError('Password is required');
    }
    if (email === undefined && user === undefined) {
        throw new InvalidParameterError('Email or username is required');
    }

    let userDBEntry: User | null;

    try {
        if (email !== undefined && email !== null) {
            userDBEntry = await prisma.user.findUnique({
                where: {
                    email,
                },
            });
        } else {
            userDBEntry = await prisma.user.findUnique({
                where: {
                    name: user,
                },
            });
        }
    } catch (error) {
        logger.error(error, 'Reading userDBEntry during login failed!');
        throw error;
    }

    if (userDBEntry === null || userDBEntry === undefined) {
        throw new InvalidParameterError('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, userDBEntry.password);
    if (!isPasswordValid) {
        throw new InvalidParameterError('Invalid credentials');
    }

    if (userDBEntry.verified === false) {
        throw new NotVerifiedError('Email not verified');
    }

    await prisma.jwt.deleteMany({
        where: {
            userId: userDBEntry.id,
        },
    });

    const jwtToken = generateJWTToken();

    try {
        await prisma.jwt.create({
            data: {
                token: jwtToken,
                validUntil: new Date(Date.now() + 60 * 60 * 1000 * 24 * 7), // 1 week from now
                userId: userDBEntry.id,
            },
        });
        logger.info('Logged in new user');
        return jwtToken;
    } catch (error) {
        console.error(error, 'Error while logging in');
        throw error;
    }
}

// TODO: Implement also to use the email
export async function resendValidationToken(userName: string): Promise<void> {
    const userDBEntry = await prisma.user.findUnique({
        where: {
            name: userName,
        },
    });

    if (userDBEntry === null || userDBEntry === undefined) {
        throw new InvalidParameterError('Invalid credentials');
    }
    if (userDBEntry.verified) {
        throw new InvalidParameterError('Email already verified');
    }

    // Get verification code
    const verificationCode = generateRandomString(32);
    try {
        await prisma.user.update({
            where: {
                id: userDBEntry.id,
            },
            data: {
                verificationCode,
            },
        });

        // Send a confirmation email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: `"Mursica.FM" <${process.env.EMAIL}>`,
            to: userDBEntry.email,
            subject: 'Please confirm your email',
            text: `Please confirm your email by clicking on the following link: http://localhost:80/api/auth/confirm-email?token=${verificationCode}`,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        logger.error(error, 'Failed to resend verification email');
        throw error;
    }
}

export async function logout(): Promise<void> {}
