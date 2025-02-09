import axios from 'axios';
import logger from './logger.js';

interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export async function clientCredentialsFlow(client_id: string, client_secret: string): Promise<string> {

    const data = new URLSearchParams({
        grant_type: 'client_credentials'
    });
    const config = {
        headers: {
            'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
        }
    };

    let clientToken = '';

    await axios.post<SpotifyTokenResponse>('https://accounts.spotify.com/api/token', data, config)
        .then(response => {
            logger.info(`Client-Credentials-Flow authorization succeeded!`);
            logger.info(`Access Token: ${response.data.access_token}`);
            logger.info(`Token Type: ${response.data.token_type}`);
            logger.info(`Expires In: ${response.data.expires_in}`);

            let access_token = response.data.access_token;

            process.env.CLIENT_CREDENTIAL_TOKEN = access_token;

            clientToken = access_token;
        })
        .catch(error => {
            if(error.response) {
                logger.error(`Client-Credentials-Flow authorization failed: ${error.response.status}`);
            } else if(error.request) {
                logger.error(`Client-Credentials-Flow authorization failed: No response received`);
            } else {
                logger.error(`Client-Credentials-Flow authroization failed: ${error.message}`);
            }
        });

    return clientToken;
}
