import axios from 'axios';
import * as querystring from 'querystring';
import type { SpotifyAuthTokenResponse } from '../../interfaces/index.js';
import logger from '../../logger/logger.js';
import { generateRandomString } from '../../utility/fileUtils.js';
import { CLIENT_ID, CLIENT_SECRET, IS_PRODUCTION, prisma } from '../../config.js';
import { AuthenticationError } from '../../errors/authentication.js';
import { DatabaseOperationError, NotFoundError } from '../../errors/database.js';
import type { OAuthToken, State, User } from '@prisma/client';

/**
 * Generates an OAuth query string for initiating Spotify authentication.
 *
 * This function constructs the authorization URL parameters required to request
 * an authentication code from Spotify, including response type, client ID, scope,
 * redirect URI, and a randomly generated state to prevent CSRF attacks.
 *
 * @returns {string} - A URL-encoded query string containing the necessary OAuth parameters.
 *
 * @throws {DatabaseOperationError} If there is an error updating the state in the database.
 */
export async function generateOAuthQuerystring(user?: string, email?: string): Promise<string> {
    const state = generateRandomString(16);
    const scope = 'user-modify-playback-state user-read-playback-state';
    let redirectURI: string;

    if (IS_PRODUCTION) {
        // TODO: Use an env variable for the redirect URI
        redirectURI = 'https://mursica.fm/api/auth/spotify/callback';
    } else {
        redirectURI = 'http://127.0.0.1/api/auth/spotify/callback';
    }

    const validUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    try {
        let matchingUser: User | null;
        if (user !== undefined && user !== null) {
            matchingUser = await prisma.user.findFirst({
                where: {
                    name: user,
                },
            });
        } else {
            matchingUser = await prisma.user.findFirst({
                where: {
                    email,
                },
            });
        }

        if (matchingUser === null || matchingUser === undefined) {
            logger.warn('No user found for the provided username or email');
            throw new NotFoundError('No user found for the provided username or email');
        }

        // Check if the state already exists in the database
        const currentState = await prisma.state.findUnique({
            where: { userId: matchingUser.id },
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
                    userId: matchingUser.id,
                },
            });
        }
    } catch (error) {
        logger.error(error, 'Failed to update the state in the database');
        throw new DatabaseOperationError('Failed to update the state in the database');
    }

    return querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
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
 * @throws {AuthenticationError} If the OAuth authentication fails.
 */
export async function oAuthAuthorization(code: string, state: string): Promise<void> {
    const url = 'https://accounts.spotify.com/api/token';
    const data = {
        code,
        redirect_uri: 'http://127.0.0.1/api/auth/spotify/callback',
        grant_type: 'authorization_code',
    };
    const config = {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
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
            logger.error('OAuth authentication failed: Received invalid state');
            throw new AuthenticationError('OAuth authentication failed: Received invalid state');
        }

        const userID = stateDBEntry.userId;

        // Find the user associated with the state
        const user = await prisma.user.findUnique({
            where: { id: userID },
        });

        if (user === null || user === undefined) {
            logger.error('OAuth authentication failed: User not found');
            throw new AuthenticationError('OAuth authentication failed: User not found');
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
        throw new AuthenticationError('OAuth user authentication failed');
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
 * @throws {AuthenticationError} If the state is invalid or expired.
 * @throws {DatabaseOperationError} If there is an error reading the state from the database.
 */
export async function validateState(state: string): Promise<void> {
    let currentState: State | null;
    try {
        currentState = await prisma.state.findUnique({
            where: { state },
        });
    } catch (error) {
        logger.error(error, 'Failed to read state from the database');
        throw new DatabaseOperationError('Failed to read state from the database');
    }

    if (currentState === null || currentState === undefined) {
        logger.error('OAuth authentication failed: Received invalid state');
        throw new AuthenticationError('OAuth authentication failed: Received invalid state');
    }
    if (currentState.validUntil < new Date()) {
        logger.error('OAuth authentication failed: State expired');
        throw new AuthenticationError('OAuth authentication failed: State expired');
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
                Authorization: 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
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
