import express from 'express';
import logger from '../logger/logger.js';
import { confirmEmail, login, logout, register, resendValidationToken } from '../auth/index.js';
import {
    InvalidParameterError,
    ExistingUserError,
    NotVerifiedError,
    NotFoundError,
    InvalidPasswordError,
    AlreadyVerifiedError,
    AuthenticationError,
    ExpiredTokenError,
} from '../errors/index.js';

const router = express.Router();

router.get('/confirm-email', async (req, res) => {
    const { token } = req.query as { token: string };
    logger.info('A user is trying to confirm their email address', { token });
    try {
        await confirmEmail(token);
        res.redirect('/static/html/email-validation/validation-success.html');
    } catch (error) {
        if (
            error instanceof InvalidParameterError ||
            error instanceof NotFoundError ||
            error instanceof AlreadyVerifiedError
        ) {
            logger.warn(error.message);
            res.redirect('/static/html/email-validation/validation-failure.html');
        } else {
            logger.error(error, 'Failed to confirm email');
            res.redirect('/static/html/email-validation/validation-failure.html');
        }
    }
});

router.post('/login', async (req, res) => {
    const { username, email, password } = req.body;
    logger.info('A user is trying to log in', { username, email, password }); // TODO: Redact password
    try {
        const token = await login(password, email, username);
        const response = {
            token,
            user: {
                name: username,
                email, // TODO: If user only provides one information, the other one should be read from DB
            }, // TODO: Implement shared interface for the response
        };
        logger.info('User logged in successfully', { username, email });
        res.status(200).json({ message: 'Login successful!', ...response });
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message, { username, email });
            res.status(400).json({ error: error.message });
        } else if (error instanceof NotVerifiedError || error instanceof InvalidPasswordError) {
            logger.warn(error.message, { username, email });
            res.status(403).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn(error.message, { username, email });
            res.status(404).json({ error: error.message });
        } else {
            logger.error(error, 'Failed to log in', { username, email });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/logout', async (req, res) => {
    const { username, email, token } = req.body;
    logger.info('A user is trying to log out', { username, email, token });
    try {
        await logout(token, username, email);
        logger.info('User logged out successfully', { username, email });
        res.status(200).send('Logout successful!');
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message, { username, email });
            res.status(400).json({ error: error.message });
        } else if (
            error instanceof NotVerifiedError ||
            error instanceof AuthenticationError ||
            error instanceof ExpiredTokenError
        ) {
            logger.warn(error.message, { username, email });
            res.status(403).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn(error.message, { username, email });
            res.status(404).json({ error: error.message });
        } else {
            logger.error(error, 'Failed to log out', { username, email });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    logger.info('A user is trying to register', { username, email, password });

    try {
        await register(username, email, password);
        logger.info('User registered successfully', { username, email });
        res.status(200).send('Registration successful!');
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message, { username, email });
            res.status(400).json({ error: error.message });
        } else if (error instanceof ExistingUserError) {
            logger.warn(error.message, { username, email });
            res.status(409).json({ error: error.message });
        } else {
            logger.error(error, 'Failed to register user: Internal server error', { username, email });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// TODO: Implement functionality to override the email address
router.post('/resend-verification', async (req, res) => {
    const { username } = req.body;
    logger.info('A user is trying to resend the verification email', { username });

    try {
        await resendValidationToken(username);
        logger.info('Verification email resent successfully', { username });
        res.status(200).send('Verification email resent successfully!');
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message, { username });
            res.status(400).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn(error.message, { username });
            res.status(404).json({ error: error.message });
        } else if (error instanceof AlreadyVerifiedError) {
            logger.warn(error.message, { username });
            res.status(409).json({ error: error.message });
        } else {
            logger.error(error, 'Failed to resend verification email', { username });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
