import { PrismaClient } from '@prisma/client';
import logger from '../logger/logger.js';
import { clientCredentialsFlow } from '../api/spotifyAuth.js';

const prisma = new PrismaClient();

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

export function generateRandomString(length: number) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
