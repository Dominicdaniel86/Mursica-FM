import bcrypt from 'bcrypt';
import { InvalidParameterError } from '../errors/index.js';

/**
 * Checks the registration input for validity.
 * @param username - The username provided by the user.
 * @param email - The email address provided by the user.
 * @param password - The password provided by the user.
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

// TODO: Validate the following functions
export async function validateJWTToken(): Promise<void> {}

export async function invalidateJWTToken(): Promise<void> {}

export async function hashPassword(password: string): Promise<string> {
    if (password === undefined || password === '') {
        throw new InvalidParameterError('Password is required');
    }

    const saltRounds = 10; // Higher number = more secure but slower
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    if (password === undefined || password === '') {
        throw new InvalidParameterError('Password is required');
    }

    return await bcrypt.compare(password, hashedPassword);
}
