import express from 'express';
import { joinSession, leaveSession } from '../services/sessionManagement.js';
import logger from '../logger/logger.js';
import { InvalidParameterError } from '../errors/services.js';
import { NotFoundError, ValueAlreadyExistsError } from '../errors/database.js';
import { validateGuestToken } from '../auth/auth.middleware.js';
import { AuthenticationError } from '../errors/authentication.js';

const router = express.Router();

router.post('/join', async (req, res) => {
    const { sessionId, username } = req.body;
    if (sessionId === undefined || sessionId === null || sessionId.trim() === '') {
        res.status(400).json({ error: 'Empty sessionId' });
        return;
    }
    if (username === undefined || username === null || username.trim() === '') {
        res.status(400).json({ error: 'Empty username' });
        return;
    }

    try {
        const guestToken = await joinSession(username, sessionId);
        res.status(200).json({ message: 'Guest joined successfully!', guestToken, username, sessionId });
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message, { sessionId, username });
            res.status(400).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn(error.message, { sessionId, username });
            res.status(404).json({ error: error.message });
        } else if (error instanceof ValueAlreadyExistsError) {
            logger.warn(error.message, { sessionId, username });
            res.status(409).json({ error: error.message });
        } else {
            logger.error(error, 'Failed to log in', { sessionId, username });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/leave', async (req, res) => {
    const { username, sessionId, guestToken } = req.body;
    logger.info('A username is trying to leave the session', { username, sessionId, guestToken });

    try {
        const internalSessionID = await validateGuestToken(username, sessionId, guestToken);
        await leaveSession(username, internalSessionID);
        res.status(200).json({ message: 'Guest left the session successfully!' });
        // TODO: Error codes 401 and 404 are not 100% correct here
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message, { username, sessionId, guestToken });
            res.status(400).json({ error: error.message });
        } else if (error instanceof AuthenticationError) {
            logger.warn(error.message, { username, sessionId, guestToken });
            res.status(401).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn(error.message, { username, sessionId, guestToken });
            res.status(404).json({ error: error.message });
        } else {
            logger.error(error, 'Failed to leave session', { username, sessionId, guestToken });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
