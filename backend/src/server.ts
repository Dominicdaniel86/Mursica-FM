import express from 'express';
import logger from './logger.js';

const app = express();
const port = 3000;

app.get('/api', (req, res) => {
    res.send("Hello from the backend!");
});

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
