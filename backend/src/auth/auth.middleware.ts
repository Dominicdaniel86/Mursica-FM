import bcrypt from 'bcrypt';
import { InvalidParameterError } from '../errors/index.js';

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
