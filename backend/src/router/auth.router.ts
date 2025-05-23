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
import type { BaseRes } from '../shared/interfaces/base.js';
import type { AuthenticationReq } from '../shared/interfaces/req/auth.js';

const router = express.Router();

router.get('/confirm-email', async (req, res) => {
    const { token } = req.query as { token: string };
    logger.info({ token, endpoint: '/confirm-email' }, 'A user is trying to confirm their email address');
    try {
        await confirmEmail(token);
        res.redirect('/static/html/email-validation/validation-success.html');
    } catch (error) {
        if (error instanceof AlreadyVerifiedError) {
            logger.warn({ token, endpoint: '/confirm-email' }, error.message);
            res.redirect(
                `/static/html/email-validation/validation-failure.html?error=${encodeURIComponent('Your%20email%20is%20already%20verified.%20You%20can%20log%20in%20now.')}`
            );
        } else if (error instanceof InvalidParameterError || error instanceof NotFoundError) {
            logger.warn({ token, endpoint: '/confirm-email' }, error.message);
            res.redirect(
                `/static/html/email-validation/validation-failure.html?error=${encodeURIComponent('Invalid%20token.%20You%20can%20request%20a%20new%20one%20by%20trying%20to%20log%20in.')}`
            );
        } else if (error instanceof ExpiredTokenError) {
            logger.warn({ token, endpoint: '/confirm-email' }, error.message);
            res.redirect(
                `/static/html/email-validation/validation-failure.html?error=${encodeURIComponent('The%20token%20has%20expired.%20Please%20request%20a%20new%20one%20by%20trying%20to%20log%20in.')}`
            );
        } else {
            logger.error({ error, endpoint: '/confirm-email' }, 'Failed to confirm email');
            res.redirect(
                `/static/html/email-validation/validation-failure.html?error=${encodeURIComponent('Internal%20server%20error.%20Please%20try%20again%20later.')}`
            );
        }
    }
});

router.post('/login', async (req, res) => {
    const { username, password, email: rawEmail } = req.body as AuthenticationReq;
    let email = rawEmail ?? '';
    if (email !== undefined && email !== null) {
        email = email.toLowerCase();
    }
    logger.info({ username, email, endpoint: '/login' }, 'A user is trying to log in');

    try {
        const response = await login(password, username, email);
        logger.info({ username, email, endpoint: '/login' }, 'User logged in successfully');
        res.status(200).json(response);
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn({ username, email, endpoint: '/login' }, error.message);
            res.status(400).json({ error: error.message });
        } else if (error instanceof NotVerifiedError || error instanceof InvalidPasswordError) {
            logger.warn({ username, email, endpoint: '/login' }, error.message);
            res.status(403).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn({ username, email, endpoint: '/login' }, error.message);
            res.status(404).json({ error: error.message });
        } else {
            logger.error({ username, email, endpoint: '/login' }, 'Failed to log in', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/logout', async (req, res) => {
    const { username, email, token } = req.body; // TODO: Use interface / use Bearer
    logger.info({ username, email, token, endpoint: '/logout' }, 'A user is trying to log out');
    try {
        await logout(token, username, email);
        logger.info({ username, email, endpoint: '/logout' }, 'User logged out successfully');
        res.status(200).send('Logout successful!');
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn({ username, email, endpoint: '/logout' }, error.message);
            res.status(400).json({ error: error.message });
        } else if (
            error instanceof NotVerifiedError ||
            error instanceof AuthenticationError ||
            error instanceof ExpiredTokenError
        ) {
            logger.warn({ username, email, endpoint: '/logout' }, error.message);
            res.status(403).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn({ username, email, endpoint: '/logout' }, error.message);
            res.status(404).json({ error: error.message });
        } else {
            logger.error({ username, email, endpoint: '/logout' }, 'Failed to log out', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/register', async (req, res) => {
    const { password, username: rawUsername, email: rawEmail } = req.body as AuthenticationReq;
    const username = rawUsername ?? '';
    let email = rawEmail ?? '';
    if (email !== undefined && email !== null) {
        email = email.toLowerCase();
    }
    logger.info({ username, email, endpoint: '/register' }, 'A user is trying to register');

    try {
        await register(username, email, password);
        logger.info({ username, email, endpoint: '/register' }, 'User registered successfully');
        const response: BaseRes = {
            message: 'Registration successful!',
            code: 200,
        };
        res.status(200).json(response);
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn({ username, email, endpoint: '/register' }, error.message);
            res.status(400).json({ error: error.message });
        } else if (error instanceof ExistingUserError) {
            logger.warn({ username, email, endpoint: '/register' }, error.message);
            res.status(409).json({ error: error.message });
        } else {
            logger.error({ username, email, endpoint: '/register' }, 'Failed to register user: Internal server error');
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// TODO: Implement functionality to override the email address
router.post('/resend-verification', async (req, res) => {
    const { password, username: rawUsername, email: rawEmail } = req.body as AuthenticationReq;
    const username = rawUsername ?? '';
    let email = rawEmail ?? '';
    if (email !== undefined && email !== null) {
        email = email.toLowerCase();
    }
    logger.info(
        { username, email, endpoint: '/resend-verification' },
        'A user is trying to resend the verification email'
    );

    try {
        await resendValidationToken(password, username, email);
        logger.info({ username, email, endpoint: '/resend-verification' }, 'Verification email resent successfully');
        const response: BaseRes = {
            message: 'Verification email resent successfully!',
            code: 200,
        };
        res.status(200).json(response);
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            logger.warn({ username, email }, error.message);
            res.status(400).json({ error: error.message });
        } else if (error instanceof NotFoundError) {
            logger.warn({ username, email }, error.message);
            res.status(404).json({ error: error.message });
        } else if (error instanceof AlreadyVerifiedError) {
            logger.warn({ username, email }, error.message);
            res.status(409).json({ error: error.message });
        } else {
            logger.error({ username, email, endpoint: '/resend-verification' }, 'Failed to resend verification email');
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
