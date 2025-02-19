import express from 'express';
import * as querystring from 'querystring';
import { validateClientToken, generateOAuthQuerystring, oAuthAuthorization, searchSong, playTrack, pauseTrack, skipTrack } from './api/index.js';
import logger, { initializeLoggingFile } from './logger/logger.js';
import { port } from './config.js';

// Initialize app
const app = express();

// Add body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize log file
try {
    initializeLoggingFile();  
} catch(error: unknown) {
    const errorMessage = error instanceof Error ? `Failed to initialize the logging file: ${error.message}` : 'Failed to initialize the logging file due to an unknown reason';
    logger.fatal(errorMessage);
    process.exit(1);
}

// Retrieve client credential token
validateClientToken();

app.get('/api', (req, res) => {
    res.send("Hello from the backend!");
});

app.get('/api/tracks/search', async (req, res) => {

    validateClientToken();

    try {
        let trackTitle = req.query.trackTitle as string;

        if(!trackTitle) {
            res.status(400).json({error: 'Invalid track title'});
            return
        }

        let tracks = await searchSong(trackTitle);

        if(tracks.length === 0) {
            res.status(404).json({error: 'No tracks found'});
            return
        }

        res.status(200).json({tracks: tracks});
        logger.info('/api/tracks/search API call succeeded');
    } catch(err) {
        logger.error(err, 'No tracks found through API');
        res.status(500).json({error: 'Internal server error'});
    }
});

app.post('/api/tracks/select', (req, res) => {
    if(req.body.trackID) {
        logger.info('Song got selected: ' + req.body.trackID);
        res.send("You selected the song!");
    } else {
        logger.warn('Empty song received');
        res.status(400).send('Empty song send');
    }
});

app.get('/api/auth/spotify/login', (req, res) => {

    logger.info('A user is trying to log in');

    const url = 'https://accounts.spotify.com/authorize?';
    const querystring = generateOAuthQuerystring();

    res.redirect(url + querystring);
});

// TODO: Rename callback to match projects API syntax
app.get('/callback', async (req, res) => {
    logger.debug('User login callback');
    var code = req.query.code as string;
    var state = req.query.state as string;

    if (!state) {
        return res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
    }
    else {
        const response = await oAuthAuthorization(code);

        logger.info(response);

        res.redirect('http://localhost/static/html/admin.html');
    }
});

app.post('/api/auth/spotify/logout', (req, res) => {
    res.send('Logged out now!');
});

app.put('/api/admin/control/play', async (req, res) => {
    try {
        await playTrack();
        logger.info('Admin plays/ continues the song');
        res.status(200).send('Play Song');
    } catch(error) {
        logger.error(error, 'Failed to play/ continue the song');
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/admin/control/stop', async (req, res) => {
    try {
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
        await skipTrack();
        logger.info('Admin skipped the song');
        res.status(200).send('Skip Song');
    } catch (err) {
        logger.error(err, 'Failed to skip the song');
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
