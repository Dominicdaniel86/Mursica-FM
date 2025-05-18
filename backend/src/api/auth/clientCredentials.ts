import axios from 'axios';
import type { SpotifyClientTokenResponse } from '../../interfaces/index.js';
import logger from '../../logger/logger.js';
import { CLIENT_ID, CLIENT_SECRET, prisma } from '../../config.js';
import type { ClientToken } from '@prisma/client';
import { ClientCredentialFlow, DatabaseOperationError } from '../../errors/index.js';

/**
 * Requests an access token from the Spotify API using the Client Credentials flow.
 *
 * This function authenticates with the Spotify API using the provided Client ID and
 * Client Secret and retrieved an access token, which can be used for further API requests.
 *
 * @returns {Promise<[string, number]>} A tuple containing:
 *   - The access token (string) required for authentication.
 *   - The duration (in seconds) for which the token remains valid.
 */
async function requestClientCredentialToken(): Promise<[string, number]> {
    if (CLIENT_ID === undefined || CLIENT_ID === null || CLIENT_SECRET === undefined || CLIENT_SECRET === null) {
        logger.warn('Client ID or Client Secret not set.');
        throw new ClientCredentialFlow('Client-Credentials-Flow failed: Client ID or Client Secret not set');
    }

    const url = 'https://accounts.spotify.com/api/token';
    const data = new URLSearchParams({
        grant_type: 'client_credentials',
    });
    const config = {
        headers: {
            Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
    };

    try {
        const response = await axios.post<SpotifyClientTokenResponse>(url, data, config);

        const accessToken = response.data.access_token;
        const expiresIn = response.data.expires_in;

        logger.info({ accessToken, expiresIn }, `Client-Credentials-Flow request succeeded.`);

        return [accessToken, expiresIn];
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                logger.error(
                    error,
                    `Client-Credentials-Flow request failed with status ${error.status}: ${error.message}.`
                );
            } else if (typeof error.request !== 'undefined') {
                logger.error(error, `Client-Credentials-Flow request failed: No response received.`);
            } else {
                logger.error(error, `Client-Credentials-Flow request failed: ${error.message}.`);
            }
        } else {
            logger.error(error, `Axios request to Spotify API failed: Unexpected error.`);
        }

        throw new ClientCredentialFlow('Client-Credentials-Flow request failed');
    }
}

/**
 * Validates and refreshes the Spotify client token if necessary.
 *
 * This function ensures that a valid client token is always avialable by checking its
 * expiration and refreshing it when needed. This token can be used for requests
 * that are independent of a specific user.
 */
export async function validateClientToken(): Promise<void> {
    let currentToken: ClientToken | null;
    try {
        currentToken = await prisma.clientToken.findFirst();
    } catch (error) {
        logger.fatal(error, 'Error finding current client token');
        throw new DatabaseOperationError('Error finding current client token');
    }

    const currentDate: Date = new Date(Date.now());

    let valid = false;
    let difference = 0;

    if (currentToken !== null && currentToken !== undefined) {
        const validUntil = currentToken.validUntil.getTime();
        const currentTime = currentDate.getTime();

        difference = validUntil - currentTime;

        if (difference > 10000) {
            valid = true;
        }
    }

    // If difference is less than 10 sec or token does not exist at all
    if (valid === false) {
        try {
            const clientTokenResult: [string, number] = await requestClientCredentialToken();

            const accessToken = clientTokenResult[0];
            const expiresIn = clientTokenResult[1];

            const validUntilDate: Date = new Date(Date.now() + expiresIn * 1000);

            if (currentToken) {
                await prisma.clientToken.update({
                    where: { id: currentToken.id },
                    data: { token: accessToken, validUntil: validUntilDate },
                });
            } else {
                await prisma.clientToken.create({
                    data: { token: accessToken, validUntil: validUntilDate },
                });
            }

            logger.info('Successfully updated client token.');
        } catch (error) {
            if (error instanceof ClientCredentialFlow) {
                throw new ClientCredentialFlow('Failed to update the client token');
            }
            logger.fatal(error, 'Failed to update the client token.');
            throw new Error('Failed to update the client token.');
        }
    } else {
        logger.info(`Checked client-token validity: still valid for ${Number(difference) / 1000} seconds.`);
    }
}
