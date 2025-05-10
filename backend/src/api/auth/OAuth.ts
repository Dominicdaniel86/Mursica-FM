import axios from 'axios';
import * as querystring from 'querystring';
import type { SpotifyAuthTokenResponse } from '../../interfaces/index.js';
import logger from '../../logger/logger.js';
import { generateRandomString } from '../../utility/fileUtils.js';
import { CLIENT_ID, CLIENT_SECRET, prisma} from '../../config.js';

/**
 * Generates an OAuth query string for initiating Spotify authentication.
 * 
 * This function constructs the authorization URL parameters required to request
 * an authentication code from Spotify, including response type, client ID, scope, 
 * redirect URI, and a randomly generated state to prevent CSRF attacks.
 * 
 * @returns {string} - A URL-encoded query string containing the necessary OAuth parameters.
 */
export async function generateOAuthQuerystring(): Promise<string> {
    const state = generateRandomString(16); // TODO: Use this state to prevent CSRF attacks
    const scope = 'user-modify-playback-state user-read-playback-state';
    const redirectURI = 'http://127.0.0.1/api/auth/spotify/callback';

    try {
        const previousState = await prisma.state.findFirst();

        if(previousState) {
            await prisma.state.update({
                where: {id: previousState.id},
                data: { state }
            })
        } else {
            await prisma.state.create({
                data: { state }
            })
        }
    } catch (error) {
        console.error(error, 'Failed to update the state in the database');
        throw new Error('Failed to update the state in the database');
    }

    return querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope,
        redirect_uri: redirectURI,
        state
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
 */
export async function oAuthAuthorization(code: string): Promise<void> {
    const url = 'https://accounts.spotify.com/api/token';
    const data = {
        code,
        redirect_uri: 'http://127.0.0.1/api/auth/spotify/callback',
        grant_type: 'authorization_code'
    };
    const config = {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
        }
    };

    try {
        const response = await axios.post<SpotifyAuthTokenResponse>(url, data, config);
        const accessToken = response.data.access_token;
        const expresIn = response.data.expires_in;
        const refreshToken = response.data.refresh_token;

        const validUntilDate: Date = new Date(Date.now() + (expresIn * 1000));
        const currentToken = await prisma.oAuthToken.findFirst();

        if(currentToken) {
            await prisma.oAuthToken.update({
                where: {id: currentToken.id },
                data: { token: accessToken, validUntil: validUntilDate, refreshToken}
            });
        } else {
            await prisma.oAuthToken.create({
                data: { token: accessToken, validUntil: validUntilDate, refreshToken}
            });
        }

        logger.info('OAuth user authentication successfully completed.');
    } catch(error) {
        logger.error(error, 'OAuth user authentication failed!');
        throw error;
    }
}

/**
 * Refreshes the OAuth access token using the stored refresh token.
 * Requires an already existing OAuth token in the database.
 */
export async function refreshAuthToken(): Promise<void> {

    try {
        const currentToken = await prisma.oAuthToken.findFirst();

        if(!currentToken) {
            logger.warn('AuthToken could not be refreshed, as there is no current token in the database');
            throw Error('refreshAuthToken failed: No current token found in database');
        }

        const url = 'https://accounts.spotify.com/api/token';
        const data = new URLSearchParams({
           grant_type: 'refresh_token',
           refresh_token: currentToken.refreshToken,
        });
        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
            }
        };
    
        const response = await axios.post<SpotifyAuthTokenResponse>(url, data, config);
        const accessToken = response.data.access_token;
        const expresIn = response.data.expires_in;
        const refreshToken = response.data.refresh_token;

        const validUntilDate: Date = new Date(Date.now() + (expresIn * 1000));

        await prisma.oAuthToken.update({
            where: {id: currentToken.id },
            data: { token: accessToken, validUntil: validUntilDate, refreshToken}
        });

        logger.info('Successfully refreshed the OAuth token');

    } catch(error) {
        logger.error(error, 'OAuth token refresh failed');
    }
}
