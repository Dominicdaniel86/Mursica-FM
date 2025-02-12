import * as fs from 'fs';
import logger from '../logger/logger.js';

export function writeToEnvFile(key: string, value: string) {

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
    logger.info(`Successfully updated .env with ${key}:${value}`);
}
