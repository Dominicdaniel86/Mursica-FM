import type { Response, Request } from 'express';
import logger from '../logger/logger.js';
import { validateGuestToken, validateJWTToken } from '../auth/auth.middleware.js';
import { InvalidParameterError } from '../errors/services.js';
import { NotFoundError } from '../errors/database.js';
import { AuthenticationError, ExpiredTokenError, NotVerifiedError } from '../errors/authentication.js';
import { CookieList } from '../shared/cookies.js';
import { ENV_VARIABLES } from '../config.js';

export async function newGeneralPurposeValidation(req: Request, res: Response): Promise<string> {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1] ?? ''; // Get token part of Bearer token
    if (token === undefined || token === null || token.trim() === '') {
        logger.warn({ endpoint: '/logout' }, 'No token provided for logout');
        res.status(400).json({ error: 'No token provided' });
        throw new InvalidParameterError('No token provided');
    }

    try {
        await validateJWTToken(token);
    } catch (error) {
        // Handle validation error
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message);
            res.status(400).json({ error: error.message });
        } else if (error instanceof ExpiredTokenError) {
            logger.warn(error.message);
            res.status(401).json({ error: error.message });
        } else if (error instanceof NotVerifiedError) {
            logger.warn(error.message);
            res.status(403).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn(error.message);
            res.status(404).json({ error: error.message });
        } else {
            logger.error(error, 'Failed to validate token');
            res.status(500).json({ error: 'Internal server error' });
        }
        throw error; // Rethrow the error to be handled by the calling function
    }

    return token; // Return the token if validation is successful
}

// ! Deprecated. Use new function.
export async function generalPurposeValidation(req: Request, res: Response): Promise<void> {
    const { token, username, email } = req.body;
    try {
        await validateJWTToken(token); // ! Check if this still works
    } catch (error) {
        // Handle validation error
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message, { token, username, email });
            res.status(400).json({ error: error.message });
        } else if (error instanceof ExpiredTokenError) {
            logger.warn(error.message, { token, username, email });
            res.status(401).json({ error: error.message });
        } else if (error instanceof AuthenticationError || error instanceof NotVerifiedError) {
            logger.warn(error.message, { token, username, email });
            res.status(403).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn(error.message, { token, username, email });
            res.status(404).json({ error: error.message });
        } else {
            logger.error(error, 'Failed to validate token', { token, username, email });
            res.status(500).json({ error: 'Internal server error' });
        }
        throw error; // Rethrow the error to be handled by the calling function
    }
}

export async function generalPurposeGETValidation(req: Request, res: Response): Promise<void> {
    // TODO: Use auth middleware
    const token = (req.headers['x-token'] ?? req.headers['authorization']) as string;
    const email = req.headers['x-email'] as string;
    const username = req.headers['x-username'] as string;

    try {
        await validateJWTToken(token); // ! Check if this still works
    } catch (error) {
        // Handle validation error
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message, { token, username, email });
            res.status(400).json({ error: error.message });
        } else if (error instanceof ExpiredTokenError) {
            logger.warn(error.message, { token, username, email });
            res.status(401).json({ error: error.message });
        } else if (error instanceof AuthenticationError || error instanceof NotVerifiedError) {
            logger.warn(error.message, { token, username, email });
            res.status(403).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn(error.message, { token, username, email });
            res.status(404).json({ error: error.message });
        } else {
            logger.error(error, 'Failed to validate token', { token, username, email });
            res.status(500).json({ error: 'Internal server error' });
        }
        throw error; // Rethrow the error to be handled by the calling function
    }
}

export async function generalPurposeGuestValidation(req: Request, res: Response): Promise<void> {
    const { token, username, sessionId } = req.body;
    try {
        await validateGuestToken(username, sessionId, token);
    } catch (error) {
        // Handle validation error
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message, { token, username, sessionId });
            res.status(400).json({ error: error.message });
        } else if (error instanceof AuthenticationError) {
            logger.warn(error.message, { token, username, sessionId });
            res.status(403).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn(error.message, { token, username, sessionId });
            res.status(404).json({ error: error.message });
        } else {
            logger.error(error, 'Failed to validate guest token', { token, username, sessionId });
            res.status(500).json({ error: 'Internal server error' });
        }
        throw error; // Rethrow the error to be handled by the calling function
    }
}

export async function generalPurposeGuestGETValidation(req: Request, res: Response): Promise<void> {
    const token = (req.headers['x-token'] ?? req.headers['authorization']) as string;
    const sessionId = req.headers['x-session-id'] as string;
    const username = req.headers['x-username'] as string;

    try {
        await validateGuestToken(username, sessionId, token);
    } catch (error) {
        // Handle validation error
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message, { token, username, sessionId });
            res.status(400).json({ error: error.message });
        } else if (error instanceof AuthenticationError) {
            logger.warn(error.message, { token, username, sessionId });
            res.status(403).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn(error.message, { token, username, sessionId });
            res.status(404).json({ error: error.message });
        } else {
            logger.error(error, 'Failed to validate guest token', { token, username, sessionId });
            res.status(500).json({ error: 'Internal server error' });
        }
        throw error; // Rethrow the error to be handled by the calling function
    }
}

export async function setSpotifyStateCookie(value: string, res: Response): Promise<void> {
    res.cookie(CookieList.SPOTIFY_AUTH_STATE, value, {
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: false, // TODO: Validate this
        secure: ENV_VARIABLES.IS_PRODUCTION, // Use secure cookies in production
        sameSite: 'strict', // Prevent CSRF attacks
    });
}
