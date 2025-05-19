import type { CurrentSession, Guest, User } from '@prisma/client';
import { prisma } from '../config.js';
import { InvalidParameterError } from '../errors/services.js';
import { generateRandomSessionId, generateRandomString } from '../utility/fileUtils.js';
import { DatabaseOperationError, NotFoundError, ValueAlreadyExistsError } from '../errors/database.js';
import logger from '../logger/logger.js';

/**
 * Creates a new session for a user identified by username or email.
 *
 * @param username - The username of the user (optional if email is provided).
 * @param email - The email of the user (optional if username is provided).
 *
 * @throws {InvalidParameterError} If neither username nor email is provided, or both are empty/null/undefined.
 * @throws {NotFoundError} If the user does not exist.
 * @throws {ValueAlreadyExistsError} If the user already has an active session.
 * @throws {DatabaseOperationError} If a database operation fails.
 */
export async function createNewSession(username: string, email: string): Promise<string> {
    // Validate input
    if (
        (username === undefined && email === undefined) ||
        (username === null && email === null) ||
        (username === '' && email === '')
    ) {
        throw new InvalidParameterError('Username or email is required');
    }

    // Check if the user exists
    let userDBEntry: User | null;
    try {
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
    } catch (error) {
        logger.error(error, 'Could not load the user that wants to create a new session');
        throw new DatabaseOperationError('Could not load the user that wants to create a new session');
    }
    if (userDBEntry === null) {
        throw new NotFoundError('User not found');
    }

    // Check if the user already has a session
    let existingSession: CurrentSession | null;
    try {
        existingSession = await prisma.currentSession.findUnique({
            where: {
                adminId: userDBEntry?.id,
            },
        });
    } catch (error) {
        logger.error(error, 'Could not check if the user is already hosting a session');
        throw new DatabaseOperationError('Could not check if the user is already hosting a session');
    }

    if (existingSession !== null) {
        throw new ValueAlreadyExistsError('User already has a session');
    }

    // Create a new session
    // TODO: Let the admin decide how long the session should stay open
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
        logger.error(error, 'Failed to create new session');
        throw new DatabaseOperationError('Failed to create new session');
    }

    return sessionId;
}

/**
 * Stops the current session for a user identified by username or email.
 *
 * @param username - The username of the user (optional if email is provided).
 * @param email - The email of the user (optional if username is provided).
 *
 * @throws {InvalidParameterError} If neither username nor email is provided, or both are empty/null/undefined.
 * @throws {NotFoundError} If the user does not exist or has no active session.
 * @throws {DatabaseOperationError} If a database operation fails.
 */
export async function stopCurrentSession(username: string, email: string): Promise<void> {
    // Validate input
    if (
        (username === undefined && email === undefined) ||
        (username === null && email === null) ||
        (username === '' && email === '')
    ) {
        throw new InvalidParameterError('Username or email is required');
    }

    // Check if the user exists
    let userDBEntry: User | null;
    try {
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
    } catch (error) {
        logger.error(error, 'Could not load the user that wants to create a new session');
        throw new DatabaseOperationError('Could not load the user that wants to create a new session');
    }
    if (userDBEntry === null) {
        throw new NotFoundError('User not found');
    }

    // Check if the user already has a session
    let existingSession: CurrentSession | null;
    try {
        existingSession = await prisma.currentSession.findUnique({
            where: {
                adminId: userDBEntry?.id,
            },
        });

        if (existingSession !== null) {
            await prisma.guest.deleteMany({
                where: {
                    sessionId: existingSession.id,
                },
            });
        }
    } catch (error) {
        logger.error(error, 'Failed to check existing session');
        throw new DatabaseOperationError('Failed to check existing session');
    }
    if (existingSession === null) {
        throw new NotFoundError('User has currently no session');
    }

    // Stop the new session
    try {
        await prisma.currentSession.delete({
            where: {
                adminId: userDBEntry.id,
            },
        });
    } catch (error) {
        logger.error(error, 'Failed to stop current session');
        throw new DatabaseOperationError('Failed to stop current session');
    }
}

/**
 * Allows a guest to join an existing session by session ID and guest name.
 *
 * @param sessionId - The unique identifier of the session to join.
 * @param guestName - The name of the guest joining the session.
 * @returns A promise that resolves to a unique guest token string for the session.
 *
 * @throws {InvalidParameterError} If the sessionId or guestName is empty, null, or undefined.
 * @throws {NotFoundError} If the session with the given sessionId does not exist.
 * @throws {ValueAlreadyExistsError} If a guest with the same name is already in the session.
 * @throws {DatabaseOperationError} If a database operation fails.
 */
export async function joinSession(guestname: string, sessionId: string): Promise<string> {
    // Validate input
    if (sessionId === undefined || sessionId === null || sessionId.trim() === '') {
        throw new InvalidParameterError('Empty sessionId');
    }
    if (guestname === undefined || guestname === null || guestname.trim() === '') {
        throw new InvalidParameterError('Empty guestName');
    }

    // Check if the session exists
    let currentSession: CurrentSession | null;
    try {
        currentSession = await prisma.currentSession.findUnique({
            where: {
                sessionId,
            },
        });
    } catch (error) {
        logger.error(error, 'Failed to check if session exists');
        throw new DatabaseOperationError('Failed to check if session exists');
    }
    if (currentSession === null) {
        throw new NotFoundError('Session not found');
    }

    // Check if the guest is already in the session
    let existingGuest: Guest | null;
    try {
        existingGuest = await prisma.guest.findUnique({
            where: {
                name: guestname,
            },
        });
    } catch (error) {
        logger.error(error, 'Failed to check if guest is already in session');
        throw new DatabaseOperationError('Failed to check if guest is already in session');
    }
    if (existingGuest !== null) {
        throw new ValueAlreadyExistsError('Guest already in session');
    }

    // Join the guest to the session
    const guestToken = generateRandomString(16);
    try {
        await prisma.guest.create({
            data: {
                name: guestname,
                sessionId: currentSession.id,
                guestToken,
            },
        });
    } catch (error) {
        logger.error(error, 'Failed to join session');
        throw new DatabaseOperationError('Failed to join session');
    }

    return guestToken;
}

/**
 * Allows a guest to leave a session by removing their entry from the database.
 *
 * @param guestname - The name of the guest leaving the session.
 * @param sessionId - The unique identifier of the session to leave.
 * @returns A promise that resolves when the guest has been removed from the session.
 *
 * @throws {DatabaseOperationError} If the guest could not be removed from the database or if a database operation fails.
 */
export async function leaveSession(guestname: string, sessionId: string): Promise<void> {
    try {
        const guest = await prisma.guest.delete({
            where: {
                name: guestname,
                sessionId,
            },
        });

        if (guest === null || guest === undefined) {
            throw new DatabaseOperationError('The guest was not removed from the database');
        }
    } catch (error) {
        logger.error(error, 'Failed to leave session');
        throw new DatabaseOperationError('Failed to leave session');
    }
}
