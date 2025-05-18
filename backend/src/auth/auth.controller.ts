import { prisma, transporter } from '../config.js';
import {
    InvalidParameterError,
    ExistingUserError,
    InternalServerError,
    NotVerifiedError,
    NotFoundError,
    InvalidPasswordError,
    AlreadyVerifiedError,
} from '../errors/index.js';
import dotenv from 'dotenv';
import { generateRandomString } from '../utility/fileUtils.js';
import { checkRegistrationInput, comparePassword, hashPassword } from './auth.middleware.js';
import { generateJWTToken } from '../utility/jwtUtils.js';
import type { User, Jwt } from '@prisma/client';
import logger from '../logger/logger.js';

dotenv.config();

/**
 * Logs in a user.
 * @param password - The password of the user.
 * @param email - The email address of the user (optional).
 * @param user - The username of the user (optional).
 * @returns A JWT token if the login is successful.
 *
 * @throws {InvalidParameterError} If any of the parameters are invalid.
 * @throws {NotFoundError} If the user is not found.
 * @throws {NotVerifiedError} If the user's email is not verified.
 * @throws {InternalServerError} If there is an error during login.
 */
export async function login(password: string, email?: string, user?: string): Promise<string> {
    // Check if the parameters are valid
    if (password === undefined || password === null || password === '') {
        throw new InvalidParameterError('Password is required');
    }
    if (
        (email === undefined && user === undefined) ||
        (email === null && user === null) ||
        (email === '' && user === '')
    ) {
        throw new InvalidParameterError('Email or username is required');
    }

    let userDBEntry: User | null;

    // Check if the user exists
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
        throw new InternalServerError('Reading userDBEntry during login failed!');
    }

    if (userDBEntry === null || userDBEntry === undefined) {
        throw new NotFoundError('Invalid credentials');
    }

    // Check if the password is valid
    const isPasswordValid = await comparePassword(password, userDBEntry.password);
    if (!isPasswordValid) {
        throw new InvalidPasswordError('Invalid credentials');
    }

    // Check if the user is verified
    if (userDBEntry.verified === false) {
        throw new NotVerifiedError('Email not verified');
    }

    // Delete all old JWT tokens
    await prisma.jwt.deleteMany({
        where: {
            userId: userDBEntry.id,
        },
    });

    const jwtToken = generateJWTToken();

    // Create a new JWT token
    try {
        await prisma.jwt.create({
            data: {
                token: jwtToken,
                validUntil: new Date(Date.now() + 60 * 60 * 1000 * 24 * 7), // 1 week from now
                userId: userDBEntry.id,
            },
        });
        return jwtToken;
    } catch (error) {
        console.error(error, 'Error while creating JWT token');
        throw new InternalServerError('Error while creating JWT token');
    }
}

/**
 * Registers a new user.
 * @param username - The username of the user.
 * @param email - The email address of the user.
 * @param password - The password of the user.
 *
 * @throws {InvalidParameterError} If any of the parameters are invalid.
 * @throws {ExistingUserError} If the email or username is already taken.
 * @throws {InternalServerError} If there is an error creating the user.
 */
export async function register(username: string, email: string, password: string): Promise<void> {
    // Check if the parameters are valid
    // Throws InvalidParameterError if any of the parameters are invalid
    checkRegistrationInput(username, email, password);

    try {
        // Check if the email is already taken
        const existingUserEmail = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (existingUserEmail) {
            throw new ExistingUserError('Email is already in use');
        }

        // Check if the username is already taken
        const existingUserName = await prisma.user.findFirst({
            where: {
                name: username,
            },
        });
        if (existingUserName) {
            throw new ExistingUserError('Username is already in use');
        }
    } catch (error) {
        if (error instanceof ExistingUserError) {
            throw error;
        } else {
            logger.error(error, 'Error checking existing user');
            throw new InternalServerError('Error checking existing user');
        }
    }

    // Get verification code
    const verificationCode = generateRandomString(32);

    try {
        const hashedPassword = await hashPassword(password);
        await prisma.user.create({
            data: {
                name: username,
                email,
                password: hashedPassword,
                verificationCode,
            },
        });

        let text = '';

        if (process.env.ENVIRONMENT === 'production') {
            text = `Please confirm your email by clicking on the following link: https://mursica.fm/api/auth/confirm-email?token=${verificationCode}`;
        } else {
            text = `Please confirm your email by clicking on the following link: http://localhost:80/api/auth/confirm-email?token=${verificationCode}`;
        }

        // Return success message
        const mailOptions = {
            from: `"Mursica.FM" <${process.env.EMAIL}>`,
            to: email,
            subject: 'Please confirm your email',
            text,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        logger.error(error, 'Error creating user');
        throw new InternalServerError('Error creating user');
    }

    // TODO: One time an hour it should check if the user has confirmed their email. If not, delete the user from the database.
}

/**
 * Confirms the email address of a user.
 * @param token - The token to confirm the email.
 * @returns A promise that resolves when the email is confirmed.
 *
 * @throws {InvalidParameterError} If the token is invalid.
 * @throws {NotFoundError} If the token is not found.
 * @throws {AlreadyVerifiedError} If the email is already verified.
 * @throws {InternalServerError} If there is an error confirming the email.
 */
export async function confirmEmail(token: string): Promise<void> {
    if (token === undefined || token === null || token === '') {
        throw new InvalidParameterError('Token is required');
    }

    let userDBEntry: User | null;

    // Check if the token is valid
    try {
        userDBEntry = await prisma.user.findUnique({
            where: {
                verificationCode: token,
            },
        });
    } catch (error) {
        logger.error(error, 'Reading userDBEntry during confirmEmail failed!');
        throw new InternalServerError('Reading userDBEntry during confirmEmail failed');
    }

    if (userDBEntry === null || userDBEntry === undefined) {
        throw new NotFoundError('Invalid token');
    }

    if (userDBEntry.verified) {
        throw new AlreadyVerifiedError('Email already verified');
    }

    // Update the user's email confirmation status
    try {
        await prisma.user.update({
            where: {
                id: userDBEntry.id,
            },
            data: {
                verified: true,
                verificationCode: null,
            },
        });
    } catch (error) {
        logger.error(error, 'Error updating userDBEntry during confirmEmail failed!');
        throw new InternalServerError('Error updating userDBEntry during confirmEmail failed');
    }
}

/**
 * Resends the email verification token to the user.
 * @param userName - The username of the user.
 * @returns A promise that resolves when the email is sent.
 *
 * @throws {InvalidParameterError} If the username is invalid.
 * @throws {NotFoundError} If the user is not found.
 * @throws {AlreadyVerifiedError} If the email is already verified.
 * @throws {InternalServerError} If there is an error sending the email.
 */
// TODO: Implement also to use the email
export async function resendValidationToken(username: string): Promise<void> {
    // Check if the parameters are valid
    if (username === undefined || username === null || username === '') {
        throw new InvalidParameterError('Username is required');
    }

    let userDBEntry: User | null;

    try {
        // Check if the user exists
        userDBEntry = await prisma.user.findUnique({
            where: {
                name: username,
            },
        });
    } catch (error) {
        logger.error(error, 'Reading userDBEntry during resendValidationToken failed!');
        throw new InternalServerError('Reading userDBEntry during resendValidationToken failed');
    }

    if (userDBEntry === null || userDBEntry === undefined) {
        throw new NotFoundError('Invalid credentials');
    }
    if (userDBEntry.verified) {
        throw new AlreadyVerifiedError('Email already verified');
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

        // Send verification email
        const mailOptions = {
            from: `"Mursica.FM" <${process.env.EMAIL}>`,
            to: userDBEntry.email,
            subject: 'Please confirm your email',
            text: `Please confirm your email by clicking on the following link: http://localhost:80/api/auth/confirm-email?token=${verificationCode}`,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        logger.error(error, 'Failed to resend verification email!');
        throw new InternalServerError('Failed to resend verification email');
    }
}

/**
 * Logs out a user by invalidating their JWT token.
 * @param token - The JWT token to invalidate.
 * @param username - The username of the user (optional).
 * @param email - The email address of the user (optional).
 *
 * @throws {InvalidParameterError} If any of the parameters are invalid.
 * @throws {NotFoundError} If the token is not found.
 * @throws {InternalServerError} If there is an error during logout.
 */
export async function logout(token: string, username?: string, email?: string): Promise<void> {
    // Invalidate the user's session or token
    if (token === undefined || token === null || token === '') {
        throw new InvalidParameterError('Token is required');
    }
    if (
        (username === undefined && email === undefined) ||
        (username === null && email === null) ||
        (username === '' && email === '')
    ) {
        throw new InvalidParameterError('Username or email is required');
    }

    // Check if the token exists
    let result: Jwt | null;

    try {
        result = await prisma.jwt.findUnique({
            where: {
                token,
            },
        });
    } catch (error) {
        logger.error(error, 'Error finding JWT token');
        throw new InternalServerError('Error finding JWT token');
    }

    if (result === null || result === undefined) {
        throw new NotFoundError('Invalid token');
    }

    // TODO: Check if the token belongs to the user

    // Remove the token from the database
    try {
        await prisma.jwt.deleteMany({
            where: {
                token,
            },
        });
    } catch (error) {
        logger.error(error, 'Error deleting JWT token');
        throw new InternalServerError('Error deleting JWT token');
    }
}
