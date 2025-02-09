import * as fs from 'fs';
import logger from './logger.js';

export function writeToEnvFile(key: string, value: string) {
    fs.readFile('./.env', 'utf8', (err: NodeJS.ErrnoException | null, data: string) => {
        if (err) {
            logger.error('Failed to read .env file: ', err);
            return;
        }

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

        fs.writeFile('./.env', updatedContent, err => {
            if(err)
                logger.error(`Failed to write ${key}:${value} into .env file: `, err);
            else
                logger.info(`Successfully updated .env with ${key}:${value}`);
        });

    });
}