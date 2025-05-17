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
// TODO: Check additional middlewares
app.use(express.json()); // Parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses incoming requests with URL-encoded payloads

// Initialize log file
try {
    await initializeLoggingFile();
} catch (error: unknown) {
    let errorMessage = '';
    if (error instanceof Error) {
        errorMessage = `Failed to initialize the logging file: ${error.message}`;
        logger.fatal(errorMessage);
        throw error;
    } else if (typeof error === 'string') {
        errorMessage = `Failed to initialize the logging file: ${error}`;
        logger.fatal(errorMessage);
        throw new Error(`Failed to initialize the logging file: ${error}`);
    } else {
        errorMessage = 'Failed to initialize the logging file due to an unknown reason';
        logger.fatal(errorMessage);
        throw new Error(errorMessage);
    }
}

// Retrieve client credential token
await validateClientToken(); // TODO: Check this function

app.get('/api', (req, res) => {
    res.send('Hello from the backend!');
});

// 200: OK
// 400: Bad Request - Empty track title
// 404: Not Found - No tracks found
// 500: Internal Server Error
app.get('/api/tracks/search', async (req, res) => {
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
app.post('/api/tracks/select', (req, res) => {
    if (req.body === undefined || req.body === null) {
        // TODO: Not working currently
        logger.warn('Empty song selection received');
        res.status(400).send('Empty song send');
        return;
    }
    logger.info('Song got selected: ' + req.body.trackID);
    res.status(200).send('You selected the song!');
});

// 200: OK
// 500: Internal Server Error
app.get('/api/auth/spotify', async (req, res) => {
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
app.post('/api/auth/spotify/logout', async (req, res) => {
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

// 200: OK
// 400: Bad Request - No OAuth token found
// 500: Internal Server Error
app.put('/api/admin/control/play', async (req, res) => {
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
app.put('/api/admin/control/stop', async (req, res) => {
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
app.post('/api/admin/control/skip', async (req, res) => {
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
app.get('/api/admin/control/volume', async (req, res) => {
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
app.put('/api/admin/control/volume', async (req, res) => {
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

app.post('/api/auth/register', (req, res) => {
    logger.info('A user is trying to register.');
    res.status(200).send('Register');
});

app.post('/api/auth/login', (req, res) => {
    logger.info('A user is trying to log in.');
    res.status(200).send('Login');
});

app.post('/api/auth/logout', (req, res) => {
    logger.info('A user is trying to log out.');
    res.status(200).send('Logout');
});

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
