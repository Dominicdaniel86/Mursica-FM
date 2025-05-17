import { InvalidParameterError } from '../errors/services.js';

export function register(userName: string, email: string, password: string): void {
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

    // Does the user already exist?

    // Has the password been hashed?

    // Save the user to the database

    // Send a confirmation email

    // Return success message

    // Note: One time an hour it should check if the user has confirmed their email. If not, delete the user from the database.
}
