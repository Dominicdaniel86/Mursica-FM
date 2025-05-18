import type { CurrentSession, User } from '@prisma/client';
import { prisma } from '../config.js';
import { InvalidParameterError } from '../errors/services.js';
import { generateRandomSessionId } from '../utility/fileUtils.js';

// TODO: Better error handling
export async function createNewSession(username: string, email: string): Promise<void> {
    if (
        (username === undefined && email === undefined) ||
        (username === null && email === null) ||
        (username === '' && email === '')
    ) {
        throw new InvalidParameterError('Username or email is required');
    }

    let userDBEntry: User | null;

    // Check if the user exists
    if (username !== undefined) {
        userDBEntry = await prisma.user.findUnique({
            where: {
                name: username,
            },
        });
    } else {
        userDBEntry = await prisma.user.findUnique({
            where: {
                email,
            },
        });
    }

    if (userDBEntry === null) {
        throw new InvalidParameterError('User not found');
    }

    let existingSession: CurrentSession | null;

    // Check if the user already has a session
    try {
        existingSession = await prisma.currentSession.findUnique({
            where: {
                adminId: userDBEntry?.id,
            },
        });
    } catch (error) {
        throw new Error('Failed to check existing session');
    }

    if (existingSession !== null) {
        throw new InvalidParameterError('User already has a session');
    }

    // Create a new session
    const validUntil = new Date(Date.now() + 8 * 60 * 60 * 1000); // Should be valid for 8 hours
    const sessionId = generateRandomSessionId();

    try {
        await prisma.currentSession.create({
            data: {
                adminId: userDBEntry.id,
                validUntil,
                sessionId,
            },
        });
    } catch (error) {
        throw new Error('Failed to create new session');
    }
}

// TODO: Better error handling
export async function stopCurrentSession(username: string, email: string): Promise<void> {
    if (
        (username === undefined && email === undefined) ||
        (username === null && email === null) ||
        (username === '' && email === '')
    ) {
        throw new InvalidParameterError('Username or email is required');
    }

    let userDBEntry: User | null;

    // Check if the user exists
    if (username !== undefined) {
        userDBEntry = await prisma.user.findUnique({
            where: {
                name: username,
            },
        });
    } else {
        userDBEntry = await prisma.user.findUnique({
            where: {
                email,
            },
        });
    }

    if (userDBEntry === null) {
        throw new InvalidParameterError('User not found');
    }

    let existingSession: CurrentSession | null;

    // Check if the user already has a session
    try {
        existingSession = await prisma.currentSession.findUnique({
            where: {
                adminId: userDBEntry?.id,
            },
        });
    } catch (error) {
        throw new Error('Failed to check existing session');
    }

    if (existingSession === null) {
        throw new InvalidParameterError('User has currently no session');
    }

    // Stop the new session
    try {
        await prisma.currentSession.delete({
            where: {
                adminId: userDBEntry.id,
            },
        });
    } catch (error) {
        throw new Error('Failed to stop current session');
    }
}
