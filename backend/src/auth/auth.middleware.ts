import bcrypt from 'bcrypt';
import {
    AuthenticationError,
    DatabaseOperationError,
    ExpiredTokenError,
    InvalidParameterError,
    NotFoundError,
    NotVerifiedError,
} from '../errors/index.js';
import type { CurrentSession, Guest, Jwt, User } from '@prisma/client';
import { commonPasswords, prisma } from '../config.js';
import logger from '../logger/logger.js';

/**
 * Checks the registration input for validity.
 * @param username - The username provided by the user.
 * @param email - The email address provided by the user.
 * @param password - The password provided by the user.
 *
 * @throws {InvalidParameterError} If any of the parameters are invalid.
 */
export async function checkRegistrationInput(username: string, email: string, password: string): Promise<void> {
    if (username === undefined || username === null || username === '') {
        throw new InvalidParameterError('Username is required');
    }
    if (email === undefined || email === null || email === '') {
        throw new InvalidParameterError('Email is required');
    }
    if (password === undefined || password === null || password === '') {
        throw new InvalidParameterError('Password is required');
    }

    // Username requirements
    if (username.length < 3) {
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

    // Check if the password is in the top 1000 passwords list
    if (commonPasswords.has(password.toLowerCase())) {
        throw new InvalidParameterError('Password is too common');
    }

    logger.debug(
        { username, email, password, file: '/auth/auth.middleware.ts', function: 'checkRegistrationInput()' },
        'Registration input is valid'
    );
}

/**
 * Validates a JWT token.
 * @param token - The JWT token to validate.
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
// TODO: Let router use cookies instead of body values
export async function validateJWTToken(token: string, username?: string, email?: string): Promise<void> {
    // Validate parameters
    if (token === undefined || token === '') {
        throw new InvalidParameterError('Token is required');
    }
    if (
        (username === undefined && email === undefined) ||
        (username === null && email === null) ||
        (username === '' && email === '')
    ) {
        throw new InvalidParameterError('Username or email is required');
    }

    logger.debug('Validating JWT token:' + token, { token });

    // Read the token from the database
    let tokenResult: Jwt | null;
    try {
        tokenResult = await prisma.jwt.findUnique({
            where: {
                token,
            },
        });
    } catch (error) {
        logger.error(error, 'Error finding JWT token');
        throw new DatabaseOperationError('Error finding JWT token');
    }

    // Check if the token is valid
    if (tokenResult === null || tokenResult === undefined) {
        throw new NotFoundError('Token is invalid');
    }
    if (tokenResult.validUntil < new Date()) {
        throw new ExpiredTokenError('Token is expired');
    }

    // Read the user from the database
    let userResult: User | null;
    try {
        userResult = await prisma.user.findUnique({
            where: {
                id: tokenResult.userId,
            },
        });
    } catch (error) {
        logger.error(error, 'Error finding user');
        throw new DatabaseOperationError('Error finding user');
    }

    // Check if the user is valid
    if (userResult === null || userResult === undefined) {
        throw new AuthenticationError('User is invalid');
    }
    if (userResult.verified === false) {
        throw new NotVerifiedError('User is not verified');
    }
    if (username !== undefined) {
        if (userResult.name !== username) {
            throw new AuthenticationError('Username does not match');
        }
    } else {
        if (userResult.email !== email) {
            throw new AuthenticationError('Email does not match');
        }
    }
}

/**
 * Hashes a password using bcrypt.
 *
 * @param password - The password to hash.
 * @returns The hashed password.
 */
export async function hashPassword(password: string): Promise<string> {
    if (password === undefined || password === '') {
        throw new InvalidParameterError('Password is required');
    }

    const saltRounds = 10; // Higher number = more secure but slower
    const salt = await bcrypt.genSalt(saltRounds);
    logger.debug({ file: '/auth/auth.middleware.ts', function: 'hashPassword()' }, 'Hashing password');
    return await bcrypt.hash(password, salt);
}

/**
 * Compares a password with a hashed password.
 *
 * @param password - The password to compare.
 * @param hashedPassword - The hashed password to compare against.
 * @returns True if the passwords match, false otherwise.
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    if (password === undefined || password === '') {
        throw new InvalidParameterError('Password is required');
    }
    logger.debug({ file: '/auth/auth.middleware.ts', function: 'comparePassword()' }, 'Comparing password');
    return await bcrypt.compare(password, hashedPassword);
}

/**
 * Validates a guest token by checking the provided guest name, session ID, and token against the database.
 *
 * @param guestname - The name of the guest to validate.
 * @param sessionId - The session ID associated with the guest.
 * @param token - The guest token to validate.
 * @returns {Promise<string>} The internal session ID if validation is successful.
 *
 * @throws {InvalidParameterError} If any of the parameters are missing or empty.
 * @throws {NotFoundError} If the guest token is invalid or does not match the guest name.
 * @throws {AuthenticationError} If the session ID does not match the guest's session.
 * @throws {DatabaseOperationError} If there is an error querying the database for the guest.
 */
// TODO: Can be optimized
export async function validateGuestToken(guestname: string, sessionId: string, token: string): Promise<string> {
    if (guestname === null || guestname === undefined || guestname === '') {
        throw new InvalidParameterError('Missing guestname');
    }
    if (sessionId === null || sessionId === undefined || sessionId === '') {
        throw new InvalidParameterError('Missing sessionId');
    }
    if (token === null || token === undefined || token === '') {
        throw new InvalidParameterError('Missing token');
    }

    let guest: Guest | null;

    try {
        guest = await prisma.guest.findUnique({
            where: {
                guestToken: token,
            },
        });
    } catch (error) {
        logger.error(error, 'Error finding guest');
        throw new DatabaseOperationError('Error finding guest');
    }

    if (guest === undefined || guest === null || guest.name !== guestname) {
        throw new AuthenticationError('Token invalid');
    }

    let sessionDBEntry: CurrentSession | null;

    try {
        sessionDBEntry = await prisma.currentSession.findUnique({
            where: {
                id: guest.sessionId, // not the custom format ID, but the internal one
            },
        });
    } catch (error) {
        logger.error(error, 'Error finding session');
        throw new DatabaseOperationError('Error finding session');
    }

    if (sessionDBEntry === null || sessionDBEntry === undefined) {
        throw new AuthenticationError('No matching session found');
    }

    if (sessionId !== sessionDBEntry.sessionId) {
        throw new AuthenticationError('The session ID does not match');
    }

    return sessionDBEntry.id;
}

// TODO: Optimize this...
export async function getAdminUsernameByGuestToken(guestToken: string): Promise<string | null> {
    if (guestToken === null || guestToken === undefined || guestToken === '') {
        throw new InvalidParameterError('Missing guest token');
    }

    try {
        const guest = await prisma.guest.findUnique({
            where: {
                guestToken,
            },
        });
        if (guest === undefined || guest === null) {
            return null;
        }

        const sessionDBEntry = await prisma.currentSession.findUnique({
            where: {
                id: guest.sessionId,
            },
        });

        if (sessionDBEntry === null || sessionDBEntry === undefined) {
            return null;
        }

        const admin = await prisma.user.findUnique({
            where: {
                id: sessionDBEntry.adminId,
            },
        });

        if (admin === null || admin === undefined) {
            return null;
        }
        return admin.name;
    } catch (error) {
        logger.error(error, 'Error finding session or admin');
        throw new DatabaseOperationError('Error finding session or admin');
    }
}
