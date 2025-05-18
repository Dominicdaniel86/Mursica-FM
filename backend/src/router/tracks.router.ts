import express from 'express';
import logger from '../logger/logger.js';
import { searchSong, validateClientToken } from '../api/index.js';

const router = express.Router();

// 200: OK
// 400: Bad Request - Empty track title
// 404: Not Found - No tracks found
// 500: Internal Server Error
router.get('/search', async (req, res) => {
    logger.info('A user is searching for tracks');
    try {
        const trackTitle = req.query.trackTitle as string;

        if (trackTitle === undefined || trackTitle === null || trackTitle.trim() === '') {
            logger.warn('Empty track title received');
            res.status(400).json({ error: 'Empty track title' });
            return;
        }

        await validateClientToken();

        const tracks = await searchSong(trackTitle);

        if (tracks.length === 0 || tracks === undefined || tracks === null) {
            logger.warn(trackTitle, 'No tracks found for the given title');
            res.status(404).json({ error: 'No tracks found' });
            return;
        }

        res.status(200).json({ tracks });
        logger.info(`Successfully sent ${tracks.length} track results to the user.`);
    } catch (error) {
        logger.error(error, 'Failed to find tracks through the Spotify API.');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 200: OK
// 400: Bad Request
// TODO: Implement this function
router.post('/select', (req, res) => {
    if (req.body === undefined || req.body === null) {
        // TODO: Not working currently
        logger.warn('Empty song selection received');
        res.status(400).send('Empty song send');
        return;
    }
    logger.info('Song got selected: ' + req.body.trackID);
    res.status(200).send('You selected the song!');
});

export default router;
