import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import logger from '../logger/logger.js';
import { clientCredentialsFlow } from '../api/spotifyAuth.js';

const prisma = new PrismaClient();

/**
 * This function writes a key-value pair into the designated .env file.
 * @param {string} key The key as a string.
 * @param {string} value The corresponding key as a string. Quotes are added to non-numbers.
 */
export function writeToEnvFile(key: string, value: string) {

    if(!key || !value) {
        logger.warn('Received empty key or value in function "writeToEnvFile"');
        return;
    }

    try {
        // Add "" to strings
        let isANumber = !isNaN(Number(value)) && value.trim() !== '';
        if(!isANumber)
            value = `"${value}"`

        let data = fs.readFileSync('./.env', 'utf8');

        let envValues: Array<string> = data.split('\n').filter(line => line.trim());
        let tokenUpdated = false;

        envValues = envValues.map(line => {
            if (line.startsWith(key)) {
                tokenUpdated = true;
                return `${key}=${value}`;
            }
            return line;
        });

        if(!tokenUpdated) {
            envValues.push(`${key}=${value}`);
        }

        const updatedContent = envValues.join('\n') + '\n';
        fs.writeFileSync('./.env', updatedContent, 'utf-8');

        // filter certain keys
        let filtered_keys = ['CLIENT_CREDENTIAL_TOKEN'];
        if (filtered_keys.includes(key))
            value = '[REDACTED]';

        logger.info({ key, value}, 'Successfully updated .env');
    } catch (error) {
        const errorMessage = error instanceof Error ? `Failed to update .env file: ${error.message}` : 'Failed to update .env file due to an unknown reason';
        logger.error(errorMessage, error);
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
            const client_id = process.env.CLIENT_ID || '';
            const client_secret = process.env.CLIENT_SECRET || '';

            let clientTokenResult: [string, string] = await clientCredentialsFlow(client_id, client_secret);

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

export function generateRandomString(length: number) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
