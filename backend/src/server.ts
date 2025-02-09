import express from 'express';
import logger from './logger.js';

const app = express();
const port = 3000;

app.get('/api', (req, res) => {
    res.send("Hello from the backend!");
});

app.get('/api/tracks/search', (req, res) => {
    res.send('Searched song result: Master of Puppets (best song!)');
});

app.post('/api/auth/login', (req, res) => {
    res.send('Clever, you are trying to login?');
});

app.post('/api/auth/logout', (req, res) => {
    res.send('Logged out now!');
});

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
