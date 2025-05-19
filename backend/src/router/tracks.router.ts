import express from 'express';
import logger from '../logger/logger.js';
import { searchSong, validateClientToken } from '../api/index.js';
import { generalPurposeGuestValidation, generalPurposeValidation } from '../utility/authsUtils.js';

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

// TODO: Implement this function
// TODO: Document this API in the wiki
router.post('/select', (req, res) => {
    if (req.body.trackID === undefined || req.body.trackID === null) {
        logger.warn('Empty song selection received');
        res.status(400).send('Empty song send');
        return;
    }
    logger.info('Song got selected: ' + req.body.trackID);
    res.status(200).send('You selected the song!');
});

export default router;
