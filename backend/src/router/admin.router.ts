import express from 'express';
import {
    changeCurrentVolume,
    getCurrentVolume,
    pauseTrack,
    playTrack,
    refreshAuthToken,
    skipTrack,
} from '../api/index.js';
import { NotFoundError } from '../errors/database.js';
import logger from '../logger/logger.js';

const router = express.Router();

// 200: OK
// 400: Bad Request - No OAuth token found
// 500: Internal Server Error
// TODO: Validate this function
router.put('/control/play', async (req, res) => {
    try {
        await refreshAuthToken();
        await playTrack();
        logger.info('Admin plays/ continues the song');
        res.status(200).send('Play Song');
    } catch (error) {
        if (error instanceof NotFoundError) {
            logger.error(error, 'Failed to play/ continue the song - No OAuth token found');
            res.status(400).json({ error: 'No OAuth token found' });
            return;
        }
        logger.error(error, 'Failed to play/ continue the song - Internal server error');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 200: OK
// 400: Bad Request - No OAuth token found
// 500: Internal Server Error
// TODO: Validate this function
router.put('/control/stop', async (req, res) => {
    try {
        await refreshAuthToken();
        await pauseTrack();
        logger.info('Admin stopped the song');
        res.status(200).send('Stop Song');
    } catch (err) {
        if (err instanceof NotFoundError) {
            logger.error(err, 'Admin could not stop the song - No OAuth token found');
            res.status(400).json({ error: 'No OAuth token found' });
            return;
        }
        logger.error(err, 'Admin could not stop the song - Internal server error');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 200: OK
// 400: Bad Request - No OAuth token found
// 500: Internal Server Error
// TODO: Validate this function
router.post('/control/skip', async (req, res) => {
    try {
        await refreshAuthToken();
        await skipTrack();
        logger.info('Admin skipped the song');
        res.status(200).send('Skip Song');
    } catch (err) {
        if (err instanceof NotFoundError) {
            logger.error(err, 'Admin could not skip the song - No OAuth token found');
            res.status(400).json({ error: 'No OAuth token found' });
            return;
        }
        logger.error(err, 'Admin could not skip the song - Internal server error');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 200: OK
// 400: Bad Request - No OAuth token found
// 500: Internal Server Error
// TODO: Validate this function
router.get('/control/volume', async (req, res) => {
    try {
        await refreshAuthToken();
        const currentVolume = await getCurrentVolume();
        logger.info('Admin retrieved the current volume');
        res.status(200).send(`${currentVolume}`);
    } catch (error) {
        if (error instanceof NotFoundError) {
            logger.error(error, 'Admin could not retrieve current volume - No OAuth token found');
            res.status(400).json({ error: 'No OAuth token found' });
            return;
        }
        logger.error(error, 'Admin could not retrieve current volume - Internal server error');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 200: OK
// 400: Bad Request - Invalid volume
// 400: Bad Request - No OAuth token found
// 500: Internal Server Error
// TODO: Validate this function
router.put('/control/volume', async (req, res) => {
    try {
        const volume = req.query.volume as string;
        logger.debug(volume);

        await refreshAuthToken();
        await changeCurrentVolume(volume);
        logger.info('Admin changed the current volume');
        res.status(200).send('Volume successfully changed!');
    } catch (error) {
        if (error instanceof NotFoundError) {
            logger.error(error, 'Admin could not change current volume - No OAuth token found');
            res.status(400).json({ error: 'No OAuth token found' });
            return;
        }
        logger.error('Admin could not change current volume - Internal server error');
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
