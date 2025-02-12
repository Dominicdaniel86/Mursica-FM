import axios from 'axios';
import { SpotifyTokenResponse } from '../interfaces/index.js';
import logger from '../logger/logger.js';

export async function clientCredentialsFlow(client_id: string, client_secret: string): Promise<[string, string]> {

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

    await axios.post<SpotifyTokenResponse>('https://accounts.spotify.com/api/token', data, config)
        .then(response => {
            let access_token = response.data.access_token;
            let expires_in = response.data.expires_in;

            process.env.CLIENT_CREDENTIAL_TOKEN = access_token;

            clientToken = access_token;
            validUntil += (expires_in * 1000);

            logger.info(response.data, `Client-Credentials-Flow authorization succeeded!`);
        })
        .catch(error => {
            if(error.response) {
                logger.error(`Client-Credentials-Flow authorization failed: ${error.response.status}`);
            } else if(error.request) {
                logger.error(`Client-Credentials-Flow authorization failed: No response received`);
            } else {
                logger.error(`Client-Credentials-Flow authorization failed: ${error.message}`);
            }
        });

    return [clientToken, String(validUntil)];
}
