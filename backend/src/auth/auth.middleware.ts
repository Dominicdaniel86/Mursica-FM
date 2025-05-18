import bcrypt from 'bcrypt';
import {
    AuthenticationError,
    DatabaseOperationError,
    ExpiredTokenError,
    InvalidParameterError,
    NotFoundError,
    NotVerifiedError,
} from '../errors/index.js';
import type { Jwt, User } from '@prisma/client';
import { prisma } from '../config.js';
import logger from '../logger/logger.js';

/**
 * Checks the registration input for validity.
 * @param username - The username provided by the user.
 * @param email - The email address provided by the user.
 * @param password - The password provided by the user.
 *
 * @throws {InvalidParameterError} If any of the parameters are invalid.
 */
export function checkRegistrationInput(username: string, email: string, password: string): void {
    if (username === undefined || username === '') {
        throw new InvalidParameterError('Username is required');
    }
    if (email === undefined || email === '') {
        throw new InvalidParameterError('Email is required');
    }
    if (password === undefined || password === '') {
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
    // TODO: Check if the password is in the top 1000 passwords
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

    return await bcrypt.compare(password, hashedPassword);
}
