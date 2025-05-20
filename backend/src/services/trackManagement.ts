import { DatabaseOperationError } from '../errors/database.js';
import { prisma } from '../config.js';
import { InvalidParameterError } from '../errors/services.js';
import logger from '../logger/logger.js';
import { getNextTrack } from './algorithm.js';
import timerManager from './timerManagements.js';
import { getRemainingDuration } from '../api/trackControl.js';

export async function addTrackToWishlist(
    trackId: string,
    trackTitle: string,
    trackArtist: string,
    trackAlbum: string,
    trackCoverURL: string,
    trackDuration: string,
    isAdmin: boolean,
    sessionId: string,
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

    // TODO: Try-catch
    const nextTrack = await getNextTrack(sessionId);
    logger.debug('Next track:' + nextTrack.id);

    // TODO: Clean up & improve (propably entire function...)
    const currentSessionDB = await prisma.currentSession.findFirst({
        where: {
            sessionId,
        },
    });
    if (currentSessionDB === null || currentSessionDB === undefined) {
        throw new DatabaseOperationError('Session not found');
    }
    const adminEntry = await prisma.user.findFirst({
        where: {
            id: currentSessionDB.adminId,
        },
    });
    if (adminEntry === null || adminEntry === undefined) {
        throw new DatabaseOperationError('Admin not found');
    }
    const oAuthToken = await prisma.oAuthToken.findFirst({
        where: {
            userId: adminEntry.id,
        },
    });
    if (oAuthToken === null || oAuthToken === undefined) {
        throw new DatabaseOperationError('OAuth token not found');
    }
    const token = oAuthToken.token;
    if (token === null || token === undefined) {
        throw new DatabaseOperationError('No OAuth token found for this user');
    }

    const duration = await getRemainingDuration(token);

    await timerManager.setTimer(token, nextTrack.id, duration);
}
