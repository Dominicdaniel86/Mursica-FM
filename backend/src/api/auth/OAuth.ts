import axios from 'axios';
import * as querystring from 'querystring';
import type { SpotifyAuthTokenResponse } from '../../interfaces/index.js';
import logger from '../../logger/logger.js';
import { generateRandomString } from '../../utility/fileUtils.js';
import { ENV_VARIABLES, prisma } from '../../config.js';
import { AuthenticationError, SpotifyStateError } from '../../errors/authentication.js';
import { DatabaseOperationError, NotFoundError } from '../../errors/database.js';
import type { OAuthToken, State } from '@prisma/client';
import { InvalidParameterError } from '../../errors/services.js';

/**
 * Generates an OAuth query string for initiating Spotify authentication.
 *
 * This function constructs the authorization URL parameters required to request
 * an authentication code from Spotify, including response type, client ID, scope,
 * redirect URI, and a randomly generated state to prevent CSRF attacks.
 *
 * @returns {string} - A URL-encoded query string containing the necessary OAuth parameters.
 *
 * @throws {InvalidParameterError} If the provided token is invalid.
 * @throws {NotFoundError} If no user is found for the provided token.
 * @throws {DatabaseOperationError} If there is an error updating the state in the database.
 */
export async function generateOAuthQuerystring(token: string): Promise<string> {
    // Internal function: Should always be called with a valid token
    if (token === null || token === undefined || token.trim() === '') {
        logger.error(
            { file: 'OAuth.ts', function: 'generateOAuthQuerystring' },
            'Invalid token provided for generating OAuth query string'
        );
        throw new InvalidParameterError('Invalid token provided for generating OAuth query string');
    }

    const state = generateRandomString(16);
    // TODO: Validate the selected scope
    const scope = 'user-modify-playback-state user-read-playback-state';
    let redirectURI: string;

    if (ENV_VARIABLES.IS_PRODUCTION) {
        redirectURI = `https://${ENV_VARIABLES.DOMAIN}/api/auth/spotify/callback`;
    } else if (ENV_VARIABLES.LOCAL_HOST === 'localhost') {
        redirectURI = 'http://127.0.0.1/api/auth/spotify/callback';
    } else {
        redirectURI = `http://${ENV_VARIABLES.LOCAL_HOST}/api/auth/spotify/callback`;
    }

    logger.debug(
        { redirectURI, filename: 'OAuth.ts', function: 'generateOAuthQuerystring' },
        'Generated redirect URI:'
    );

    const validUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    try {
        const tokenDBEntry = await prisma.jwt.findUnique({
            where: {
                token,
            },
            include: {
                user: true, // assuming the relation field is called `user`
            },
        });

        const userDBEntry = tokenDBEntry?.user;

        if (userDBEntry === null || userDBEntry === undefined) {
            throw new NotFoundError('No user found for the provided username or email');
        }

        // Check if the state already exists in the database
        const currentState = await prisma.state.findUnique({
            where: { userId: userDBEntry.id },
        });

        if (currentState !== null && currentState !== undefined) {
            // Update the existing state
            await prisma.state.update({
                where: { id: currentState.id },
                data: { state, validUntil },
            });
        } else {
            // Create a new state
            await prisma.state.create({
                data: {
                    state,
                    validUntil,
                    userId: userDBEntry.id,
                },
            });
        }
    } catch (error) {
        logger.error(error, 'Failed to update the state in the database');
        throw new DatabaseOperationError('Failed to update the state in the database');
    }

    return querystring.stringify({
        response_type: 'code',
        client_id: ENV_VARIABLES.CLIENT_ID,
        scope,
        redirect_uri: redirectURI,
        state,
    });
}

/**
 * Handles OAuth authorization by exchanging an authorization code for an access token.
 *
 * This function sends a request to Spotify's token API to exchange the provided authorization code
 * for an access token, refresh token, and expiration time. The retrieved tokens are then stored
 * in the database.
 *
 * @param {string} code - The authorization code received from Spotify during the authentication flow.
 * @param {string} state - The state parameter received from Spotify during the authentication flow.
 *
 * @throws {SpotifyStateError} If the state is invalid or expired.
 * @throws {NotFoundError} If the user associated with the state is not found in the database.
 * @throws {DatabaseOperationError} If there is an error updating the user's OAuth token in the database.
 */
export async function oAuthAuthorization(code: string, state: string): Promise<void> {
    // * Because of the redirect, the logging and error handling is done here and less in the router
    const url = 'https://accounts.spotify.com/api/token';
    let redirect_uri: string;
    if (ENV_VARIABLES.IS_PRODUCTION) {
        redirect_uri = `https://${ENV_VARIABLES.DOMAIN}/api/auth/spotify/callback`;
    } else {
        redirect_uri = `http://${ENV_VARIABLES.LOCAL_HOST}/api/auth/spotify/callback`;
    }
    const data = {
        code,
        redirect_uri,
        grant_type: 'authorization_code',
    };
    const config = {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization:
                'Basic ' + Buffer.from(ENV_VARIABLES.CLIENT_ID + ':' + ENV_VARIABLES.CLIENT_SECRET).toString('base64'),
        },
    };

    try {
        const response = await axios.post<SpotifyAuthTokenResponse>(url, data, config);
        const accessToken = response.data.access_token;
        const expiresIn = response.data.expires_in;
        const refreshToken = response.data.refresh_token;

        const validUntilDate: Date = new Date(Date.now() + expiresIn * 1000);

        const stateDBEntry = await prisma.state.findUnique({
            where: { state },
        });

        if (stateDBEntry === null || stateDBEntry === undefined) {
            logger.warn('OAuth authentication failed: Received invalid state');
            throw new SpotifyStateError('OAuth authentication failed: Received invalid state');
        }

        const userID = stateDBEntry.userId;

        // Find the user associated with the state
        const user = await prisma.user.findUnique({
            where: { id: userID },
        });

        if (user === null || user === undefined) {
            logger.error('OAuth authentication failed: User not found');
            throw new NotFoundError('OAuth authentication failed: User not found');
        }

        // Update the user with the new access token
        const currentToken = await prisma.oAuthToken.findFirst({
            where: { userId: userID },
        });

        if (currentToken !== null && currentToken !== undefined) {
            await prisma.oAuthToken.update({
                where: { id: currentToken.id },
                data: { token: accessToken, validUntil: validUntilDate, refreshToken },
            });
        } else {
            await prisma.oAuthToken.create({
                data: { token: accessToken, validUntil: validUntilDate, refreshToken, userId: userID },
            });
        }

        logger.info({ accessToken, validUntil: validUntilDate }, 'OAuth user authentication successfully completed.');
    } catch (error) {
        logger.error(error);
        throw new DatabaseOperationError('OAuth user authentication failed');
    }
}

/**
 * Validates the state parameter received from Spotify during the OAuth callback.
 *
 * This function checks if the provided state exists in the database and if it is still valid.
 * If the state is invalid or expired, an error is thrown.
 *
 * @param {string} state - The state parameter received from Spotify during the OAuth callback.
 *
 * @throws {SpotifyStateError} If the state is invalid or expired.
 * @throws {DatabaseOperationError} If there is an error reading the state from the database.
 */
export async function validateState(state: string): Promise<void> {
    // * Because of the redirect, the logging and error handling is done here and less in the router
    let currentState: State | null;
    try {
        currentState = await prisma.state.findUnique({
            where: { state },
        });
    } catch (error) {
        logger.error({ error, endpoint: '/spotify/callback' }, 'Failed to read state from the database');
        throw new DatabaseOperationError('Failed to read state from the database');
    }

    if (currentState === null || currentState === undefined) {
        logger.error({ endpoint: '/spotify/callback' }, 'OAuth authentication failed: Received invalid state');
        throw new SpotifyStateError('OAuth authentication failed: Received invalid state');
    }
    if (currentState.validUntil < new Date()) {
        logger.error({ endpoint: '/spotify/callback' }, 'OAuth authentication failed: State expired');
        throw new SpotifyStateError('OAuth authentication failed: State expired');
    }
}

/**
 * Refreshes the OAuth access token using the stored refresh token.
 * Looks up the OAuth token in the database by username or email, and refreshes it if expired.
 *
 * @param {string} token - The current access token.
 * @param {string} [username] - The username associated with the token (optional).
 * @param {string} [email] - The email associated with the token (optional).
 *
 * @throws {AuthenticationError} If the parameters are invalid.
 * @throws {NotFoundError} If the token is not found in the database.
 * @throws {DatabaseOperationError} If there is an error updating the token in the database.
 */
// TODO: Important! Validate that the token is really belonging to the user
export async function refreshAuthToken(token: string, username?: string, email?: string): Promise<string> {
    if (
        token === null ||
        token === '' ||
        ((username === null || username === '') && (email === null || email === ''))
    ) {
        // Should never happen, as the function is only called when the token is valid
        logger.error('Invalid parameters for refreshing the OAuth token');
        throw new AuthenticationError('Invalid parameters for refreshing the OAuth token');
    }

    try {
        let tokenDBEntry: OAuthToken | null;
        if (username !== undefined && username !== null) {
            tokenDBEntry = await prisma.oAuthToken.findFirst({
                where: {
                    user: {
                        name: username,
                    },
                },
            });
        } else {
            tokenDBEntry = await prisma.oAuthToken.findFirst({
                where: {
                    user: {
                        email,
                    },
                },
            });
        }

        if (tokenDBEntry === null || tokenDBEntry === undefined) {
            // Should never happen, as the function is only called when the token is valid
            throw new NotFoundError('refreshAuthToken failed: No current token found in database');
        }

        if (tokenDBEntry.validUntil > new Date()) {
            logger.info('OAuth token is still valid, no need to refresh', { username, email });
            return tokenDBEntry.token;
        }

        const url = 'https://accounts.spotify.com/api/token';
        const data = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokenDBEntry.refreshToken,
        });
        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization:
                    'Basic ' +
                    Buffer.from(ENV_VARIABLES.CLIENT_ID + ':' + ENV_VARIABLES.CLIENT_SECRET).toString('base64'),
            },
        };

        const response = await axios.post<SpotifyAuthTokenResponse>(url, data, config);
        const accessToken = response.data.access_token;
        const expiresIn = response.data.expires_in;
        const refreshToken = response.data.refresh_token;

        const validUntilDate: Date = new Date(Date.now() + expiresIn * 1000);

        await prisma.oAuthToken.update({
            where: { id: tokenDBEntry.id },
            data: { token: accessToken, validUntil: validUntilDate, refreshToken },
        });

        logger.info('Successfully refreshed the OAuth token');
        return accessToken;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        logger.error(error, 'OAuth token refresh failed');
        throw new DatabaseOperationError('OAuth token refresh failed');
    }
}
