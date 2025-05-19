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
    AuthenticationError,
} from '../errors/index.js';

const router = express.Router();

// 200: OK
// 500: Internal Server Error
// ! Deprecated: This endpoint is not used anymore
// router.get('/auth-check', async (req, res) => {
//     try {
//         const token = await prisma.oAuthToken.findFirst();
//         if (token) {
//             logger.info('Authentication check: Admin is logged in');
//             res.status(200).json({
//                 isAuthenticated: true,
//                 expiresAt: token.validUntil,
//             });
//         } else {
//             logger.info('Authentication check: Admin is not logged in');
//             res.status(200).json({
//                 isAuthenticated: false,
//             });
//         }
//     } catch (error) {
//         logger.error(error, 'Could not check if an admin is logged in.');
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

router.get('/login', async (req, res) => {
    const { token, user, email } = req.cookies;

    try {
        logger.info('A user is trying to connect their Spotify account.');
        await validateJWTToken(token, user, email);

        const url = 'https://accounts.spotify.com/authorize?';
        const spotifyQueryString = await generateOAuthQuerystring(user, email);
        res.redirect(url + spotifyQueryString);
        logger.info('Redirected user to the Spotify login page.');
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn('Invalid parameters received');
            res.status(400).json({ error: 'Invalid parameters' });
            return;
        } else if (
            error instanceof ExpiredTokenError ||
            error instanceof NotVerifiedError ||
            error instanceof AuthenticationError
        ) {
            logger.warn('User is not verified or token is expired', error);
            res.status(403).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn('User not found in the database', error);
            res.status(404).json({ error: 'User not found in the database' });
        } else {
            logger.error(error, 'Failed to validate JWT token');
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.get('/callback', async (req, res) => {
    logger.info('User login callback');
    const code = req.query.code as string;
    const state = req.query.state as string;

    try {
        await validateState(state);
    } catch (error) {
        if (error instanceof AuthenticationError) {
            logger.warn('Invalid state received');
            return res.redirect('/#' + querystring.stringify({ error: 'invalid_state' }));
        } else {
            logger.error('Failed to validate state', error);
            return res.redirect('/#' + querystring.stringify({ error: 'state_validation_failed' }));
        }
    }

    try {
        await oAuthAuthorization(code, state);
        res.redirect('http://localhost/static/html/admin.html');
        logger.info('Redirected user back to admin.html');
    } catch (error) {
        logger.error(error, 'OAuth authorization failed during callback');
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
