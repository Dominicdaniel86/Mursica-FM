import express from 'express';
import logger from '../logger/logger.js';
import { confirmEmail, login, register, resendValidationToken } from '../auth/index.js';
import { InvalidParameterError, ExistingUserError, NotVerifiedError } from '../errors/index.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    logger.info('A user is trying to register.');
    const { userName, email, password } = req.body;

    if (userName === undefined || userName === null || userName.trim() === '') {
        logger.warn('Empty username received');
        res.status(400).json({ error: 'Empty username' });
        return;
    }
    if (email === undefined || email === null || email.trim() === '') {
        logger.warn('Empty email received');
        res.status(400).json({ error: 'Empty email' });
        return;
    }
    if (password === undefined || password === null || password.trim() === '') {
        logger.warn('Empty password received');
        res.status(400).json({ error: 'Empty password' });
        return;
    }

    try {
        await register(userName, email, password);
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message);
            res.status(400).json({ error: error.message });
            return;
        } else if (error instanceof ExistingUserError) {
            logger.warn(error.message);
            res.status(400).json({ error: error.message });
            return;
        } else {
            logger.error(error, 'Failed to register user');
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
    }

    // Verification email is valid for 1 hour. Afterwards, the user has to register again.
    // Until then: No login possible

    // Path 1: User is not registered: Send verification email
    // Path 2: User is registered: Send error message
    // Path 3: User is registered but not verified: Send extra message
    res.status(200).send('Register');
});

router.get('/confirm-email', async (req, res) => {
    logger.info('A user is trying to confirm their email address.');
    const { token } = req.query as { token: string };
    if (token === undefined || token === null) {
        logger.warn('Empty token received');
        // TODO: Update the HTML file to show the error message
        res.redirect('/static/html/email-validation/validation-failure.html');
        // res.status(400).json({ error: 'Empty token' }); // ? Should still a response be sent?
        return;
    }
    try {
        await confirmEmail(token);
        res.redirect('/static/html/email-validation/validation-success.html');
        // res.status(200).send('Email confirmed successfully!');
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message);
            res.redirect('/static/html/email-validation/validation-failure.html');
            // res.status(400).json({ error: error.message });
            return;
        } else {
            logger.error(error, 'Failed to confirm email');
            res.redirect('/static/html/email-validation/validation-failure.html');
            // res.status(500).json({ error: 'Internal server error' });
            return;
        }
    }
});

router.post('/login', async (req, res) => {
    const { userName, email, password } = req.body;
    logger.info('A user is trying to log in.');
    try {
        const token = await login(password, email, userName);
        const response = {
            token,
            user: {
                name: userName,
                email, // TODO: If user only provides one information, the other one should be read from DB
            },
        };
        res.status(200).json({ message: 'Login successful!', ...response });
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn(error.message);
            res.status(400).json({ error: error.message });
            return;
        } else if (error instanceof NotVerifiedError) {
            logger.warn(error.message);
            res.status(400).json({ error: error.message });
            return;
        } else {
            logger.error(error, 'Failed to log in');
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
    }
});

// TODO: Additional validation
router.post('/resend-verification', async (req, res) => {
    logger.info('A user is trying to resend the verification email.');
    const { userName } = req.body;
    logger.info(userName);

    if (userName === undefined || userName === null || userName.trim() === '') {
        logger.warn('Empty username received');
        res.status(400).json({ error: 'Empty username' });
        return;
    }

    try {
        await resendValidationToken(userName);
        res.status(200).json({ message: 'Verification email resent successfully!' });
    } catch (error) {
        logger.error(error, 'Failed to resend verification email');
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
});

router.post('/logout', (req, res) => {
    logger.info('A user is trying to log out.');
    res.status(200).send('Logout');
});

export default router;
