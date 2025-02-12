import * as fs from 'fs';
import logger from '../logger/logger.js';

export function writeToEnvFile(key: string, value: string) {

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

        logger.info({ key, value, message: 'Successfully updated .env'});
    } catch (error) {
        const errorMessage = error instanceof Error ? `Failed to update .env file: ${error.message}` : 'Failed to update .env file due to an unknown reason';
        logger.error(errorMessage, error);
    }
}
