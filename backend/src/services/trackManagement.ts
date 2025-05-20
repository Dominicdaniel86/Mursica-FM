import { DatabaseOperationError } from '../errors/database.js';
import { prisma } from '../config.js';
import { InvalidParameterError } from '../errors/services.js';
import logger from '../logger/logger.js';

export async function addTrackToWishlist(
    trackId: string,
    trackTitle: string,
    trackArtist: string,
    trackAlbum: string,
    trackCoverURL: string,
    trackDuration: string,
    isAdmin: boolean,
    username?: string,
    email?: string
): Promise<void> {
    if (!trackId) {
        throw new InvalidParameterError('Track ID is required');
    }
    if (isAdmin && (username === undefined || username === null) && (email === undefined || email === null)) {
        throw new InvalidParameterError('Username or email is required for admin');
    } else if (!isAdmin && (username === undefined || username === null)) {
        throw new InvalidParameterError('Username is required for guest');
    }

    const trackDurationNr = parseInt(trackDuration, 10);
    if (isNaN(trackDurationNr)) {
        throw new InvalidParameterError('Track duration must be a number');
    }

    logger.debug('"SO FARR"');

    try {
        if (isAdmin) {
            logger.debug('isAdmin');
            if (username !== undefined && username !== null) {
                logger.debug('username');
                await prisma.track.create({
                    data: {
                        trackId,
                        title: trackTitle,
                        artist: trackArtist,
                        album: trackAlbum,
                        coverUrl: trackCoverURL,
                        duration: trackDurationNr,
                        user: {
                            connect: {
                                name: username,
                            },
                        },
                    },
                });
            } else {
                logger.debug('email');
                await prisma.track.create({
                    data: {
                        trackId,
                        title: trackTitle,
                        artist: trackArtist,
                        album: trackAlbum,
                        coverUrl: trackCoverURL,
                        duration: trackDurationNr,
                        user: {
                            connect: {
                                email,
                            },
                        },
                    },
                });
            }
        } else {
            logger.debug('isGuest');
            await prisma.track.create({
                data: {
                    trackId,
                    title: trackTitle,
                    artist: trackArtist,
                    album: trackAlbum,
                    coverUrl: trackCoverURL,
                    duration: trackDurationNr,
                    guest: {
                        connect: {
                            name: username,
                        },
                    },
                },
            });
        }
    } catch (error) {
        logger.error(error, 'Failed to add track to wishlist');
        throw new DatabaseOperationError('Failed to add track to wishlist');
    }
}
