import express from 'express';
import { clientCredentialsFlow, searchSong } from './api/index.js';
import logger, { initializeLoggingFile } from './logger/logger.js';
import { writeToEnvFile } from './utility/fileUtils.js';

// Initialize app
const app = express();

// Read env variables
const port = process.env.PORT || 3000;
const client_id = process.env.CLIENT_ID || '';
const client_secret = process.env.CLIENT_SECRET || '';

// Initialize log file
try {
    initializeLoggingFile();  
} catch(err: unknown) {
    const errorMessage = err instanceof Error ? `Failed to initialize the logging file: ${err.message}` : 'Failed to initialize the logging file due to an unknown reason';
    logger.fatal(errorMessage);
    process.exit(1);
}
let clientTokenResult: Promise<[string, number]> = clientCredentialsFlow(client_id, client_secret);

clientTokenResult.then(resolvedClientToken => {
    writeToEnvFile('CLIENT_CREDENTIAL_TOKEN', resolvedClientToken[0]);
    writeToEnvFile('CLIENT_TOKEN_EXPERIATION', resolvedClientToken[1].toString());
}).catch(error => {
    logger.fatal('Could not resolve Client Token: ', error);
});

app.get('/api', (req, res) => {
    res.send("Hello from the backend!");
});

app.get('/api/tracks/search', (req, res) => {

    let tracks = searchSong('');

    tracks.then(resTracks => {
        resTracks.forEach(element => {
            console.log(element);
        });
    });

    res.send('Searched song result: Master of Puppets (best song!)');
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
