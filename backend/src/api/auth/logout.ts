import logger from '../../logger/logger.js';
import { prisma } from '../../config.js';
import { DatabaseOperationError, NotFoundError } from '../../errors/index.js';

/**
 * Removes the OAuth token from the database, leading to a clean database entry.
 */
// TODO: Update the function to new user and token model
export async function logout(): Promise<void> {
    try {
        const currentToken = await prisma.oAuthToken.findFirst();

        if (currentToken?.id === undefined) {
            logger.warn('Could not remove OAuth token from the database: No OAuth token found.');
            throw new NotFoundError('No OAuth token found to remove from the database');
        }

        await prisma.oAuthToken.delete({
            where: {
                id: currentToken?.id,
            },
        });

        logger.info('Successfully removed OAuth token from the database.');
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        logger.error(error, 'Could not delete OAuth token from database.');
        throw new DatabaseOperationError('Could not delete the OAuth token during logout');
    }
}
