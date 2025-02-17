import express from 'express';
import * as querystring from 'querystring';
import { generateOAuthQuerystring, searchSong } from './api/index.js';
import logger, { initializeLoggingFile } from './logger/logger.js';
import { validateClientToken, writeToEnvFile } from './utility/fileUtils.js';
import axios from 'axios';
import { SpotifyAuthTokenResponse } from './interfaces/spotifyTokens.js';

// Initialize app
const app = express();

// Read env variables
const port = process.env.PORT || 3000;
const client_id = process.env.CLIENT_ID || '';
const client_secret = process.env.CLIENT_SECRET || '';

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

app.get('/api/auth/spotify/login', (req, res) => {

    logger.info('A user is trying to log in');

    const url = 'https://accounts.spotify.com/authorize?';
    const querystring = generateOAuthQuerystring();

    res.redirect(url + querystring);
});

app.get('/callback', async (req, res) => {
    logger.debug('User login callback');
    var code = req.query.code || null;
    var state = req.query.state || null;

    if (!state) {
        return res.redirect('/#' + querystring.stringify({ error: 'state_mismatch' }));
    }
    else {
        const url = 'https://accounts.spotify.com/api/token';
        const data = {
            code: code,
            redirect_uri: 'http://127.0.0.1:3000/callback',
            grant_type: 'authorization_code'
        };
        const config = {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            }
        };

        const response = await axios.post<SpotifyAuthTokenResponse>(url, data, config);

        let access_token = response.data.access_token;
        let expires_in = response.data.expires_in;
        let refresh_token = response.data.refresh_token;

        let validUntil: number = Date.now() + (expires_in * 1000);

        process.env.AUTH_CREDENTIAL_TOKEN = access_token;
        process.env.AUTH_CREDENTIAL_TOKEN_EXPIRATION = String(validUntil);
        process.env.AUTH_REFRESH_TOKEN = refresh_token;

        writeToEnvFile('AUTH_CREDENTIAL_TOKEN', access_token);
        writeToEnvFile('AUTH_CREDENTIAL_TOKEN_EXPIRATION', String(validUntil));
        writeToEnvFile('AUTH_REFRESH_TOKEN', refresh_token);

        logger.info(response.data);

        res.redirect('http://localhost/static/html/admin.html');
    }
});

app.post('/api/auth/spotify/logout', (req, res) => {
    res.send('Logged out now!');
});

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
