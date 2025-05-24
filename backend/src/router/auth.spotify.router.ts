import express from 'express';
import * as querystring from 'querystring';
import { generateOAuthQuerystring, logout, oAuthAuthorization, validateState } from '../api/index.js';
import logger from '../logger/logger.js';
import { validateJWTToken } from '../auth/auth.middleware.js';
import {
    NotFoundError,
    InvalidParameterError,
    ExpiredTokenError,
    NotVerifiedError,
    SpotifyStateError,
} from '../errors/index.js';
import { ENV_VARIABLES } from '../config.js';
import { CookieList } from '../shared/cookies.js';

const router = express.Router();

router.get('/login', async (req, res) => {
    logger.info({ endpoint: '/spotify/login' }, 'A user is trying to connect their Spotify account');
    const token = req.cookies[CookieList.ADMIN_TOKEN];
    if (token === undefined || token === null || token.trim() === '') {
        logger.warn({ endpoint: '/spotify/logout' }, 'No token provided for logout');
        res.status(400).json({ error: 'No token provided' });
        return;
    }

    try {
        logger.info('A user is trying to connect their Spotify account.');
        await validateJWTToken(token);

        const url = 'https://accounts.spotify.com/authorize?';
        const spotifyQueryString = (await generateOAuthQuerystring(token)) + '&show_dialog=true';
        res.redirect(url + spotifyQueryString);
        logger.info('Redirected user to the Spotify login page.');
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn('Invalid parameters received');
            res.status(400).json({ error: 'Invalid parameters' });
            return;
        } else if (error instanceof ExpiredTokenError) {
            logger.warn({ error, endpoint: '/spotify/login' }, 'Token is expired');
            res.status(403).json({ error: error.message });
        } else if (error instanceof NotVerifiedError) {
            logger.warn({ error, endpoint: '/spotify/login' }, 'User is not verified');
            res.status(403).json({ error: 'User is not verified' });
        } else if (error instanceof NotFoundError) {
            logger.warn({ error, endpoint: '/spotify/login' }, 'User not found in the database');
            res.status(404).json({ error: 'User not found in the database' });
        } else {
            logger.error({ error, endpoint: '/spotify/login' }, 'Failed to validate JWT token');
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.get('/callback', async (req, res) => {
    logger.info({ endpoint: '/spotify/callback' }, 'User login callback');
    const code = req.query.code as string;
    const state = req.query.state as string;

    try {
        await validateState(state);
    } catch (error) {
        logger.debug('Error catched here: 1! Testing purpose.');
        if (error instanceof SpotifyStateError) {
            logger.warn({ error, endpoint: '/spotify/callback' }, 'Invalid state received');
            return res.redirect('/#' + querystring.stringify({ error: 'invalid_state' }));
        } else {
            logger.error({ error, endpoint: '/spotify/callback' }, 'Failed to validate state');
            return res.redirect('/#' + querystring.stringify({ error: 'state_validation_failed' }));
        }
    }

    try {
        await oAuthAuthorization(code, state);
        if (ENV_VARIABLES.IS_PRODUCTION) {
            res.redirect(`https://${ENV_VARIABLES.DOMAIN}/static/html/admin.html`);
        } else {
            res.redirect(`http://${ENV_VARIABLES.LOCAL_HOST}/static/html/admin.html`);
        }
        logger.info({ endpoint: '/spotify/callback' }, 'Redirected user back to admin.html');
    } catch (error) {
        logger.debug('Error catched here: 2! Testing purpose.'); // User stopped
        logger.error({ error, endpoint: '/spotify/callback' }, 'OAuth authorization failed during callback');
        return res.redirect('/#' + querystring.stringify({ error: 'oauth_authorization_failed' }));
    }
});

// TODO: Implement with new structure and multi user support
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
