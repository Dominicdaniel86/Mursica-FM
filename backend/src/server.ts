import express from 'express';
import logger, { initializeLogger } from './logger/logger.js';
import { writeToEnvFile } from './utility/index.js';
import { clientCredentialsFlow, searchSong } from './api/index.js';

const app = express();
const port = 3000;

initializeLogger();

const client_id = process.env.CLIENT_ID || '';
const client_secret = process.env.CLIENT_SECRET || '';

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
