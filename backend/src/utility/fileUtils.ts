import * as fs from 'fs';
import logger from '../logger/logger.js';
import { clientCredentialsFlow } from '../api/spotifyAuth.js';

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
    const validUntil = BigInt(process.env.CLIENT_CREDENTIAL_TOKEN_EXPIRATION || '0');
    const currentTimestamp = BigInt(Date.now());
    const difference = validUntil - currentTimestamp;

    // If difference is less than 10 sec
    if(difference < 10000) {
        try {
            const client_id = process.env.CLIENT_ID || '';
            const client_secret = process.env.CLIENT_SECRET || '';

            let clientTokenResult: [string, string] = await clientCredentialsFlow(client_id, client_secret);
            // Write retrieved token into env file //? Temporary Solution
            writeToEnvFile('CLIENT_CREDENTIAL_TOKEN', clientTokenResult[0]);
            writeToEnvFile('CLIENT_CREDENTIAL_TOKEN_EXPIRATION', clientTokenResult[1]);

            logger.info('Successfully updated client token.');
        } catch(error) {
            logger.fatal(error, 'Failed to update the client token');
            process.exit(1);
        }
    } else {
        logger.info(`Checked token validity: still valid for ${Number(difference)/ 1000} seconds`);
    }
}
