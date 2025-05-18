import express from 'express';
import * as querystring from 'querystring';
import { generateOAuthQuerystring, logout, oAuthAuthorization } from '../api/index.js';
import { prisma } from '../config.js';
import { NotFoundError } from '../errors/database.js';
import logger from '../logger/logger.js';

const router = express.Router();

// 200: OK
// 500: Internal Server Error
router.get('/auth-check', async (req, res) => {
    try {
        const token = await prisma.oAuthToken.findFirst();
        if (token) {
            logger.info('Authentication check: Admin is logged in');
            res.status(200).json({
                isAuthenticated: true,
                expiresAt: token.validUntil,
            });
        } else {
            logger.info('Authentication check: Admin is not logged in');
            res.status(200).json({
                isAuthenticated: false,
            });
        }
    } catch (error) {
        logger.error(error, 'Could not check if an admin is logged in.');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 200: OK
// 500: Internal Server Error
router.get('/login', async (req, res) => {
    try {
        logger.info('A user is trying to log in.');

        const url = 'https://accounts.spotify.com/authorize?';
        const spotifyQueryString = await generateOAuthQuerystring();

        res.redirect(url + spotifyQueryString);
        logger.info('Redirected user to the Spotify login page.');
    } catch (error) {
        logger.error(error, 'Could not redirect user to Spotify login page.');
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/callback', async (req, res) => {
    logger.info('User login callback');
    const code = req.query.code as string;
    const state = req.query.state as string;

    try {
        const currentState = await prisma.state.findFirst();

        if (state === undefined || state === null || state !== currentState?.state) {
            logger.error('OAuth authentication failed: Received invalid state');
            return res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
        }
    } catch {
        logger.error('Failed to read state from the database');
        return res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
    }

    try {
        await oAuthAuthorization(code);
        res.redirect('http://localhost/static/html/admin.html');
        logger.info('Redirected user back to admin.html');
    } catch (error) {
        logger.error(error, 'OAuth authorization failed during callback');
        return res.redirect('/#' + querystring.stringify({ error: 'oauth_authorization_failed' }));
    }
});

// 200: OK
// 400: Bad Request - No OAuth token found
// 500: Internal Server Error
router.post('/logout', async (req, res) => {
    logger.info('A user is trying to logout.');

    try {
        await logout();
        res.send('Logged out now!');
    } catch (error) {
        if (error instanceof NotFoundError) {
            res.status(400).json({ error: 'No OAuth token found' });
        } else {
            logger.error(error, 'Failed to log out');
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
