import axios from 'axios';
import { SpotifyClientTokenResponse } from '../../interfaces/index.js';
import logger from '../../logger/logger.js';
import { CLIENT_ID, CLIENT_SECRET, prisma} from '../../config.js';

/**
 * Validates and refreshes the Spotify client token if necessary.
 * 
 * This function ensures that a valid client token is always avialable by checking its
 * expiration and refreshing it when needed. This token can be used for requests
 * that are independent of a specific user.
 */
export async function validateClientToken() {

    const currentToken = await prisma.clientToken.findFirst();
    const currentDate: Date = new Date(Date.now());

    let valid: boolean = false;
    let difference: number = 0;

    if(currentToken) {
        let validUntil: number = currentToken.validUntil.getTime();
        let currentTime: number = currentDate.getTime();

        difference = validUntil - currentTime;

        if(difference > 10000)
            valid = true;
    }

    // If difference is less than 10 sec or token does not exist at all
    if(!valid) {
        try {
            let clientTokenResult: [string, number] = await requestClientCredentialToken();

            const accessToken = clientTokenResult[0];
            const expresIn = clientTokenResult[1];

            const validUntilDate: Date = new Date(Date.now() + expresIn * 1000);
    
            if(currentToken) {
                await prisma.clientToken.update({
                    where: { id: currentToken.id },
                    data: { token: accessToken, validUntil: validUntilDate }
                });
            } else {
                await prisma.clientToken.create({
                    data: { token: accessToken, validUntil: validUntilDate},
                });
            }

            logger.info('Successfully updated client token.');
        } catch(error) {
            logger.fatal(error, 'Failed to update the client token.');
            process.exit(1);
        }
    } else {
        logger.info(`Checked token validity: still valid for ${Number(difference)/ 1000} seconds.`);
    }
}

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

    if(!CLIENT_ID || !CLIENT_SECRET) {
        logger.warn('Client ID or Client Secret not set."');
        throw new Error('Client-Credentials-Flow failed: Cliend ID or Client Secret not set');
    }

    const url: string = 'https://accounts.spotify.com/api/token';
    const data = new URLSearchParams({
        grant_type: 'client_credentials'
    });
    const config = {
        headers: {
            'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
        }
    };

    try {
        const response = await axios.post<SpotifyClientTokenResponse>(url, data, config);

        const accessToken = response.data.access_token;
        const expresIn = response.data.expires_in;

        logger.info({'accessToken': accessToken, 'expresIn': expresIn}, `Client-Credentials-Flow request succeeded.`);

        return [accessToken, expresIn];

    } catch(error) {
        if(axios.isAxiosError(error)) {
            if(error.response)
                logger.error(error, `Client-Credentials-Flow request failed with status ${error.status}: ${error.message}.`);
            else if(error.request)
                logger.error(error, `Client-Credentials-Flow request failed: No response received.`);
            else
                logger.error(error, `Client-Credentials-Flow request failed: ${error.message}.`);
        } else {
            logger.error(error, `Axios request to Spotify API failed: Unexpected error.`);
        }

        throw new Error('Client-Credentials-Flow request failed');
    }
}
