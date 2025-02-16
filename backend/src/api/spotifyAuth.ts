import axios from 'axios';
import { SpotifyTokenResponse } from '../interfaces/index.js';
import logger from '../logger/logger.js';

export async function clientCredentialsFlow(client_id: string, client_secret: string): Promise<[string, string]> {

    if(!client_id || !client_secret) {
        logger.warn('Received empty client parameters in function "clientCredentialsFlow"');
        throw new Error('Client-Credentials-Flow failed.');
    }

    const url: string = 'https://accounts.spotify.com/api/token';
    const data = new URLSearchParams({
        grant_type: 'client_credentials'
    });
    const config = {
        headers: {
            'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
        }
    };

    let clientToken: string = '';
    let validUntil: number = Date.now();

    try {
        const response = await axios.post<SpotifyTokenResponse>(url, data, config);

        let access_token = response.data.access_token;
        let expires_in = response.data.expires_in;

        validUntil += (expires_in * 1000);

        process.env.CLIENT_CREDENTIAL_TOKEN = access_token;
        process.env.CLIENT_CREDENTIAL_TOKEN_EXPIRATION = String(validUntil);

        logger.info({'accessToken': access_token, 'validUntil': validUntil}, `Client-Credentials-Flow authorization succeeded.`);

        return [clientToken, String(validUntil)];

    } catch(error) {
        if(axios.isAxiosError(error)) {
            if(error.response)
                logger.error(`Client-Credentials-Flow authorization failed with status ${error.status}: ${error.message}`);
            else if(error.request)
                logger.error(`Client-Credentials-Flow authorization failed: No response received`);
            else
                logger.error(`Client-Credentials-Flow authorization failed: ${error.message}`);
        } else {
            logger.error(error, `Axios request to Spotify API failed: Unexpected error.`);
        }

        throw new Error('Client-Credentials-Flow failed.');
    }
}
