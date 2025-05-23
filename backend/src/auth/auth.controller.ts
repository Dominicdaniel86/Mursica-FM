import { prisma, transporter } from '../config.js';
import {
    InvalidParameterError,
    ExistingUserError,
    InternalServerError,
    NotVerifiedError,
    NotFoundError,
    InvalidPasswordError,
    AlreadyVerifiedError,
    DatabaseOperationError,
    ExpiredTokenError,
} from '../errors/index.js';
import dotenv from 'dotenv';
import { generateRandomString } from '../utility/fileUtils.js';
import { checkRegistrationInput, comparePassword, hashPassword, validateJWTToken } from './auth.middleware.js';
import { generateJWTToken } from '../utility/jwtUtils.js';
import type { User } from '@prisma/client';
import logger from '../logger/logger.js';
import type { AuthenticationRes } from '../shared/interfaces/res/auth.js';

dotenv.config();

/**
 * Logs in a user.
 * @param password - The password of the user.
 * @param email - The email address of the user (optional).
 * @param username - The username of the user (optional).
 * @returns A promise that resolves to an object containing the JWT token and user information.
 *
 * @throws {InvalidParameterError} If any of the parameters are invalid.
 * @throws {NotFoundError} If the user is not found.
 * @throws {NotVerifiedError} If the user's email is not verified.
 * @throws {InternalServerError} If there is an error during login.
 */
export async function login(password: string, username?: string, email?: string): Promise<AuthenticationRes> {
    // Check if the parameters are valid
    if (password === undefined || password === null || password === '') {
        throw new InvalidParameterError('Password is required');
    }
    if (
        (email === undefined && username === undefined) ||
        (email === null && username === null) ||
        (email === '' && username === '')
    ) {
        throw new InvalidParameterError('Email or username is required');
    }

    let userDBEntry: User | null;

    // Check if the user exists
    try {
        if (email !== undefined && email !== null && email !== '') {
            userDBEntry = await prisma.user.findUnique({
                where: {
                    email,
                },
            });
        } else {
            userDBEntry = await prisma.user.findUnique({
                where: {
                    name: username,
                },
            });
        }
    } catch (error) {
        logger.error(
            { error, file: '/auth/auth.controller.ts', function: 'login()' },
            'Reading userDBEntry during login failed!'
        );
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

    // Create a new JWT token
    try {
        // Delete all old JWT tokens
        await prisma.jwt.deleteMany({
            where: {
                userId: userDBEntry.id,
            },
        });

        const jwtToken = generateJWTToken();

        await prisma.jwt.create({
            data: {
                token: jwtToken,
                validUntil: new Date(Date.now() + 60 * 60 * 1000 * 24 * 7), // 1 week from now
                userId: userDBEntry.id,
            },
        });
        logger.debug({ email, username }, 'JWT token created successfully in the database');
        const result: AuthenticationRes = {
            token: jwtToken,
            message: 'Login successful!',
            code: 200,
            user: {
                username: userDBEntry.name,
                email: userDBEntry.email,
                verified: userDBEntry.verified,
            },
        };
        return result;
    } catch (error) {
        logger.error(
            { error, file: '/auth/auth.controller.ts', function: 'login()' },
            'Error while creating JWT token'
        );
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
    await checkRegistrationInput(username, email, password);

    try {
        // Check if the email is already taken
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { name: username }],
            },
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new ExistingUserError('Email is already in use');
            }
            if (existingUser.name === username) {
                throw new ExistingUserError('Username is already in use');
            }
        }
    } catch (error) {
        if (error instanceof ExistingUserError) {
            throw error;
        } else {
            logger.error(
                { error, file: '/auth/auth.controller.ts', function: 'register()' },
                'Error checking existing user'
            );
            throw new InternalServerError('Error checking existing user');
        }
    }

    try {
        const hashedPassword = await hashPassword(password);

        // Get verification code
        let verificationCode = generateRandomString(32);
        let isUnique = false;

        // Check if the verification code is unique
        while (!isUnique) {
            verificationCode = generateRandomString(32);
            const existing = await prisma.user.findUnique({ where: { verificationCode } });
            if (!existing) {
                isUnique = true;
            }
        }

        await prisma.user.create({
            data: {
                name: username,
                email,
                password: hashedPassword,
                verificationCode,
                verificationCodeExpiresAt: new Date(Date.now() + 60 * 60 * 1000 * 2), // 2 hours from now
            },
        });

        let text = '';

        if (process.env.ENVIRONMENT === 'production') {
            text = `Please confirm your email by clicking on the following link: https://${process.env.DOMAIN}/api/auth/confirm-email?token=${verificationCode}`;
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
        logger.debug(
            { email, file: '/auth/auth.controller.ts', function: 'register()' },
            'Verification email sent successfully'
        );
    } catch (error) {
        logger.error({ error, file: '/auth/auth.controller.ts', function: 'register()' }, 'Error creating user');
        throw new InternalServerError('Error creating user');
    }
}

/**
 * Confirms the email address of a user.
 * @param token - The token to confirm the email.
 * @returns A promise that resolves when the email is confirmed.
 *
 * @throws {InvalidParameterError} If the token is invalid.
 * @throws {NotFoundError} If the token is not found.
 * @throws {AlreadyVerifiedError} If the email is already verified.
 * @throws {ExpiredTokenError} If the token is expired.
 * @throws {DatabaseOperationError} If there is an error confirming the email.
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
        logger.error(
            { error, token, file: '/auth/auth.controller.ts', function: 'confirmEmail()' },
            'Reading userDBEntry failed!'
        );
        throw new DatabaseOperationError('Reading userDBEntry during confirmEmail failed');
    }

    if (userDBEntry === null || userDBEntry === undefined) {
        throw new NotFoundError('Invalid token');
    }

    if (userDBEntry.verified) {
        throw new AlreadyVerifiedError('Email already verified');
    }

    if (userDBEntry.verificationCodeExpiresAt === null || userDBEntry.verificationCodeExpiresAt < new Date()) {
        throw new NotFoundError('Invalid token');
    }

    // Check if the token is expired
    if (userDBEntry.verificationCodeExpiresAt < new Date()) {
        throw new ExpiredTokenError('Token expired');
    }

    // Update the user's email confirmation status
    try {
        const user = await prisma.user.update({
            where: {
                id: userDBEntry.id,
            },
            data: {
                verified: true,
                verificationCode: null,
                verificationCodeExpiresAt: null,
            },
        });
        logger.info(
            { user, file: '/auth/auth.controller.ts', function: 'confirmEmail()' },
            'User email confirmed successfully'
        );
    } catch (error) {
        logger.error(
            { error, token, file: '/auth/auth.controller.ts', function: 'confirmEmail()' },
            'Error updating userDBEntry during confirmEmail failed!'
        );
        throw new DatabaseOperationError('Error updating userDBEntry during confirmEmail failed');
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
export async function resendValidationToken(password: string, username?: string, email?: string): Promise<void> {
    // Check if the parameters are valid
    if (password === undefined || password === null || password === '') {
        throw new InvalidParameterError('Username is required');
    }
    if (
        (email === undefined && username === undefined) ||
        (email === null && username === null) ||
        (email === '' && username === '')
    ) {
        throw new InvalidParameterError('Email or username is required');
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

    // If user was not found by username, try to find by email
    userDBEntry ??= await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (userDBEntry === null || userDBEntry === undefined) {
        throw new NotFoundError('User not found');
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
                verificationCodeExpiresAt: new Date(Date.now() + 60 * 60 * 1000 * 2), // 2 hours from now
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
 * @throws {InvalidParameterError} If the token, username, or email is invalid.
 * @throws {DatabaseOperationError} If there is an error finding the token or user in the database.
 * @throws {NotFoundError} If the token is invalid or not found.
 * @throws {ExpiredTokenError} If the token is expired.
 * @throws {AuthenticationError} If the user is invalid or not verified.
 * @throws {NotVerifiedError} If the user is not verified.
 */
export async function logout(token: string, username?: string, email?: string): Promise<void> {
    try {
        await validateJWTToken(token, username, email);
    } catch (error) {
        if (!(error instanceof ExpiredTokenError)) {
            throw error;
        } else {
            logger.warn(
                { token, file: '/auth/auth.controller.ts', function: 'logout()' },
                'Token is expired, still deleting it'
            );
        }
    }

    // Remove the token from the database
    try {
        await prisma.jwt.deleteMany({
            where: {
                token,
            },
        });
    } catch (error) {
        logger.error(
            { error, token, file: '/auth/auth.controller.ts', function: 'logout()' },
            'Error deleting JWT token'
        );
        throw new DatabaseOperationError('Error deleting JWT token');
    }
}
