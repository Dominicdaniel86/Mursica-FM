import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { SpotifyClientTokenResponse } from '../interfaces/index.js';
import logger from '../logger/logger.js';
import { clientID, clientSecret} from '../config.js';

const prisma = new PrismaClient();

export async function clientCredentialsFlow(): Promise<[string, string]> {

    if(!clientID || !clientSecret) {
        logger.warn('Received empty client parameters in function "clientCredentialsFlow"');
        throw new Error('Client-Credentials-Flow failed.');
    }

    const url: string = 'https://accounts.spotify.com/api/token';
    const data = new URLSearchParams({
        grant_type: 'client_credentials'
    });
    const config = {
        headers: {
            'Authorization': `Basic ${Buffer.from(`${clientID}:${clientSecret}`).toString('base64')}`
        }
    };

    try {
        const response = await axios.post<SpotifyClientTokenResponse>(url, data, config);

        let access_token = response.data.access_token;
        let expires_in = response.data.expires_in;

        logger.info({'accessToken': access_token, 'validUntil': expires_in}, `Client-Credentials-Flow authorization succeeded.`);

        return [access_token, String(expires_in)];

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

export async function validateClientToken() {

    const token = await prisma.clientToken.findFirst();
    const currentDate: Date = new Date(Date.now());
    let valid: boolean = false;
    let difference: number = 0;

    if(token) {
        let validUntil: number = token.validUntil.getTime();
        let currentTime: number = currentDate.getTime();

        difference = validUntil - currentTime;

        if(difference > 10000)
            valid = true;
    }

    // If difference is less than 10 sec
    if(!valid) {
        try {
            let clientTokenResult: [string, string] = await clientCredentialsFlow();

            let access_token = clientTokenResult[0];
            let expires_in = Number(clientTokenResult[1]);

            let validUntilDate: Date = new Date(Date.now() + expires_in * 1000);

            const token = await prisma.clientToken.findFirst();
    
            if(token) {
                await prisma.clientToken.update({
                    where: { id: token.id },
                    data: { token: access_token, validUntil: validUntilDate }
                });
            } else {
                await prisma.clientToken.create({
                    data: { token: access_token, validUntil: validUntilDate},
                });
            }

            logger.info('Successfully updated client token.');
        } catch(error) {
            logger.fatal(error, 'Failed to update the client token');
            process.exit(1);
        }
    } else {
        logger.info(`Checked token validity: still valid for ${Number(difference)/ 1000} seconds`);
    }
}
