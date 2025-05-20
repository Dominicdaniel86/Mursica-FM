import express from 'express';
import logger from '../logger/logger.js';
import { refreshAuthToken, searchSong, validateClientToken } from '../api/index.js';
import { generalPurposeGuestValidation, generalPurposeValidation } from '../utility/authsUtils.js';
import { addTrackToWishlist } from '../services/trackManagement.js';
import { InvalidParameterError } from '../errors/services.js';
import { getAdminUsernameByGuestToken } from '../auth/auth.middleware.js';

const router = express.Router();

// TODO: Document this API in the wiki
router.get('/search', async (req, res) => {
    const { token, username, email } = req.body;
    const trackTitle = req.query.trackTitle as string;
    logger.info('A user is searching for tracks', { token, username, email });

    // Check if the token is valid
    try {
        if (token.length === 250) {
            // token is an admin token
            await generalPurposeValidation(req, res);
        } else {
            // token is a guest token (or invalid)
            await generalPurposeGuestValidation(req, res);
        }
    } catch {
        // Error handled in generalPurposeValidation functions
        return;
    }

    try {
        await validateClientToken();

        const tracks = await searchSong(trackTitle);

        if (tracks.length === 0 || tracks === undefined || tracks === null) {
            logger.warn(trackTitle, 'No tracks found for the given title');
            res.status(404).json({ error: 'No tracks found' });
            return;
        }

        res.status(200).json({ tracks });
        logger.info(`Successfully sent ${tracks.length} track results to the user.`, { username, email });
    } catch (error) {
        logger.error(error, 'Failed to find tracks through the Spotify API.');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// TODO: Document this API in the wiki
// TODO: Let it use the Interface
router.post('/select', async (req, res) => {
    const {
        token,
        username,
        email,
        sessionId,
        trackId,
        trackTitle,
        trackArtist,
        trackAlbum,
        trackCoverURL,
        trackDuration,
    } = req.body;
    logger.info('A user is selecting a track', { token, username, email });
    // TODO: Validate the track information (caching?)

    if (token === undefined || token === null || token === '') {
        logger.error('Token is required');
        res.status(400).json({ error: 'Token is required' });
        return;
    }

    let isAdmin = false;
    // Check if the token is valid
    try {
        if (token.length === 250) {
            logger.debug('J4o');
            // token is an admin token
            await generalPurposeValidation(req, res);
            isAdmin = true;
        } else {
            logger.debug('Jo3');
            // token is a guest token (or invalid)
            await generalPurposeGuestValidation(req, res);
        }
    } catch {
        // Error handled in generalPurposeValidation functions
        return;
    }

    let adminUsername = username;

    // Get the current OAuth token for that guest
    if (token.length !== 250) {
        adminUsername = await getAdminUsernameByGuestToken(token);
    }

    const oAuthToken = await refreshAuthToken(token, adminUsername, email);
    if (oAuthToken === undefined || oAuthToken === null) {
        logger.error('No OAuth token found');
        res.status(401).json({ error: 'No OAuth token found' });
        return;
    }

    try {
        await addTrackToWishlist(
            trackId,
            trackTitle,
            trackArtist,
            trackAlbum,
            trackCoverURL,
            trackDuration,
            isAdmin,
            sessionId,
            oAuthToken,
            username,
            email
        );
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.error(error, 'Invalid parameter in addTrackToWishlist');
            res.status(400).json({ error: error.message });
            return;
        }
        logger.error(error, 'Failed to add track to wishlist.');
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
    logger.info('Song got selected: ' + trackId);
    res.status(200).send('You selected the song!');
});

export default router;
