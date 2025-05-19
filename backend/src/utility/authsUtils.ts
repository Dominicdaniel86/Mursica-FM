import type { Response, Request } from 'express';
import logger from '../logger/logger.js';
import { validateJWTToken } from '../auth/auth.middleware.js';
import { InvalidParameterError } from '../errors/services.js';
import { NotFoundError } from '../errors/database.js';
import { AuthenticationError, ExpiredTokenError, NotVerifiedError } from '../errors/authentication.js';

export async function generalPurposeValidation(req: Request, res: Response): Promise<void> {
    const { token, username, email } = req.body;
    try {
        await validateJWTToken(token, username, email);
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
        // Error fully handled; no need to rethrow
    }
}
