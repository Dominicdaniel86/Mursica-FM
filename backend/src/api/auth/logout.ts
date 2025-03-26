import logger from '../../logger/logger.js';
import { prisma} from '../../config.js';
import { NotFoundError } from '../../errors/index.js';

/**
 * Removes the OAuth token from the database, leading to a clean database entry.
 */
export async function logout() {
    try {
        const currentToken = await prisma.oAuthToken.findFirst();

        if(!currentToken) {
            logger.warn('Could not remove OAuth token from the database: No OAuth token found.');
            throw new NotFoundError('No OAuth token found to remove from the database');
        }

        await prisma.oAuthToken.delete({
            where: {
                id: currentToken?.id
            }
        });
        
        logger.info('Successfully removed OAuth token from the database.');
    } catch(error) {
        logger.error(error, 'Could not delete OAuth token from database.');
        throw new Error('Could not remove the OAuth token from the database');
    }
}
