import express from 'express';
import * as querystring from 'querystring';
import {
    validateClientToken,
    generateOAuthQuerystring,
    oAuthAuthorization,
    searchSong,
    playTrack,
    pauseTrack,
    skipTrack,
    refreshAuthToken,
    getCurrentVolume,
    changeCurrentVolume,
    logout,
} from './api/index.js';
import logger, { initializeLoggingFile } from './logger/logger.js';
import { PORT, prisma } from './config.js';
import { NotFoundError } from './errors/index.js';

// Initialize app
const app = express();

// Add body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize log file
try {
    initializeLoggingFile();
} catch (error: unknown) {
    const errorMessage =
        error instanceof Error
            ? `Failed to initialize the logging file: ${error.message}`
            : 'Failed to initialize the logging file due to an unknown reason';
    logger.fatal(errorMessage);
    throw new Error('Failed to initialize the logging file');
}

// Retrieve client credential token
await validateClientToken();

app.get('/api', (req, res) => {
    res.send('Hello from the backend!');
});

app.get('/api/tracks/search', async (req, res) => {
    try {
        await validateClientToken();

        const trackTitle = req.query.trackTitle as string;

        if (!trackTitle) {
            res.status(400).json({ error: 'Empty track title' });
            return;
        }

        const tracks = await searchSong(trackTitle);

        if (tracks.length === 0) {
            res.status(404).json({ error: 'No tracks found' });
            return;
        }

        logger.info(`Sucessfully send ${tracks.length} track results to the user.`);
        res.status(200).json({ tracks });
    } catch (error) {
        logger.error(error, 'Failed to find tracks through the Spotify API.');
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/tracks/select', (req, res) => {
    if (req.body.trackID !== undefined && req.body.trackID !== null) {
        logger.info('Song got selected: ' + req.body.trackID);
        res.send('You selected the song!');
    } else {
        logger.warn('Empty song selection received');
        res.status(400).send('Empty song send');
    }
});

app.get('/api/auth/spotify', async (req, res) => {
    try {
        const token = await prisma.oAuthToken.findFirst();
        if (token) {
            res.status(200).send(true);
        } else {
            res.status(200).send(false);
        }
    } catch (error) {
        logger.error(error, 'Could not check if an admin is logged in.');
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/auth/spotify/login', async (req, res) => {
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

app.get('/api/auth/spotify/callback', async (req, res) => {
    logger.info('User login callback');
    const code = req.query.code as string;
    const state = req.query.state as string;

    try {
        const currentState = await prisma.state.findFirst();

        if (!state || state !== currentState?.state) {
            logger.warn('OAuth authentication failed: Received invalid state');
            return res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
        }
    } catch {
        logger.error('Failed to read state from the database');
        return res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
    }

    await oAuthAuthorization(code);
    res.redirect('http://localhost/static/html/admin.html');
    logger.info('Redirected user back to admin.html');
});

app.post('/api/auth/spotify/logout', async (req, res) => {
    logger.info('A user is trying to logout.');

    try {
        await logout();
        res.send('Logged out now!');
    } catch (error) {
        if (error instanceof NotFoundError) {
            logger.error(error, 'Failed to log out');
            res.status(400).json({ error: 'No OAuth token found' });
        } else {
            logger.error(error, 'Failed to log out');
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

app.put('/api/admin/control/play', async (req, res) => {
    try {
        await refreshAuthToken();
        await playTrack();
        logger.info('Admin plays/ continues the song');
        res.status(200).send('Play Song');
    } catch (error) {
        logger.error(error, 'Failed to play/ continue the song');
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/admin/control/stop', async (req, res) => {
    try {
        await refreshAuthToken();
        await pauseTrack();
        logger.info('Admin stopped the song');
        res.status(200).send('Stop Song');
    } catch (err) {
        logger.error(err, 'Failed to stop the song');
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/control/skip', async (req, res) => {
    try {
        await refreshAuthToken();
        await skipTrack();
        logger.info('Admin skipped the song');
        res.status(200).send('Skip Song');
    } catch (err) {
        logger.error(err, 'Failed to skip the song');
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/control/volume', async (req, res) => {
    try {
        await refreshAuthToken();
        const currentVolume = await getCurrentVolume();
        res.status(200).send(`${currentVolume}`);
    } catch (error) {
        logger.error(error, 'Could not retrieve current volume.');
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/admin/control/volume', async (req, res) => {
    try {
        const volume = req.query.volume as string;

        logger.debug(volume);
        await refreshAuthToken();
        await changeCurrentVolume(volume);
        res.status(200).send('Volume successfully changed!');
    } catch (error) {
        logger.error(error, 'Could not change current volume.');
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ! Deprecated
app.get('/api/admin', async (req, res) => {
    try {
        const token = await prisma.oAuthToken.findFirst();
        if (token) {
            res.status(200).send(true);
        } else {
            res.status(200).send(false);
        }
    } catch (error) {
        logger.error(error, 'Could not check if an admin is logged in.');
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
