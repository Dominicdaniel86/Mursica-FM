import axios from 'axios';
import { SpotifyAuthTokenResponse, SpotifyClientTokenResponse } from '../interfaces/index.js';
import logger from '../logger/logger.js';
import { writeToEnvFile } from 'src/utility/fileUtils.js';

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

    try {
        const response = await axios.post<SpotifyClientTokenResponse>(url, data, config);

        let access_token = response.data.access_token;
        let expires_in = response.data.expires_in;

        let validUntil: number = Date.now() + (expires_in * 1000);

        process.env.CLIENT_CREDENTIAL_TOKEN = access_token;
        process.env.CLIENT_CREDENTIAL_TOKEN_EXPIRATION = String(validUntil);

        logger.info({'accessToken': access_token, 'validUntil': validUntil}, `Client-Credentials-Flow authorization succeeded.`);

        return [access_token, String(validUntil)];

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

export async function refreshAuthToken() {
    const refreshToken = process.env.AUTH_REFRESH_TOKEN as string;
    const client_id = process.env.CLIENT_ID as string;
    const client_secret = process.env.CLIENT_SECRET as string;

    const url = 'https://accounts.spotify.com/api/token';
    const data = new URLSearchParams({
       grant_type: 'refresh_token',
       refresh_token: refreshToken,
    });
    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        }
    };

    const response = await axios.post<SpotifyAuthTokenResponse>(url, data, config);
    console.log(response.data);
}
