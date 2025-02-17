import express from 'express';
import { searchSong } from './api/index.js';
import logger, { initializeLoggingFile } from './logger/logger.js';
import { validateClientToken } from './utility/fileUtils.js';

// Initialize app
const app = express();

// Read env variables
const port = process.env.PORT || 3000;

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

app.post('/api/auth/spotify/login', (req, res) => {
    res.send('Clever, you are trying to login?');
});

app.post('/api/auth/spotify/logout', (req, res) => {
    res.send('Logged out now!');
});

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
