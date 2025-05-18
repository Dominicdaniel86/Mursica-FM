import express from 'express';
import { validateClientToken } from './api/index.js';
import logger, { initializeLoggingFile } from './logger/logger.js';
import { PORT } from './config.js';
import adminRouter from './router/admin.router.js';
import authRouter from './router/auth.router.js';
import authSpotifyRouter from './router/auth.spotify.router.js';
import tracksRouter from './router/tracks.router.js';
import cookieParser from 'cookie-parser';

// Initialize app
const app = express();

// Add body parser middleware
// TODO: Check additional middlewares
app.use(express.json()); // Parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses incoming requests with URL-encoded payloads
app.use(cookieParser()); // Parses incoming requests with cookies

// Initialize log file
// TODO: Improve this error handling
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
await validateClientToken();

// Test route
app.get('/api', (req, res) => {
    res.send('Hello from the backend!');
});

// Define routers and their routes
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/auth/spotify', authSpotifyRouter);
app.use('/api/tracks/', tracksRouter);

// Let the server listen on the specified port
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});
