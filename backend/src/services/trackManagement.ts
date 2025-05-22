import { DatabaseOperationError } from '../errors/database.js';
import { prisma } from '../config.js';
import { InvalidParameterError } from '../errors/services.js';
import logger from '../logger/logger.js';
import { getNextTrack } from './algorithm.js';
import timerManager from './timerManagements.js';
import { getRemainingDuration } from '../api/trackControl.js';

export async function addTrackToTimerManager(sessionId: string, oAuthToken: string): Promise<void> {
    // TODO: Try-catch
    // Get the next track (based on the last played track for each user)
    const nextTrackResult = await getNextTrack(sessionId);
    const nextTrackSummary = nextTrackResult.trackSummary;
    let nextTrackInternalId = nextTrackResult.internalTrackId;
    // const currentSession = nextTrackResult.currentSession; //! Not used anymore
    // const admin = nextTrackResult.admin; //! Not used anymore

    logger.debug('Next track:' + nextTrackSummary?.id);

    // TODO: Clean up & improve (propably entire function...)
    const duration = await getRemainingDuration(oAuthToken);

    let spotifyTrackId = nextTrackSummary?.id;

    // No next track
    spotifyTrackId ??= '';
    nextTrackInternalId ??= '';

    await timerManager.setTimer(oAuthToken, sessionId, duration, spotifyTrackId, nextTrackInternalId);
}

export async function addTrackToWishlist(
    trackId: string,
    trackTitle: string,
    trackArtist: string,
    trackAlbum: string,
    trackCoverURL: string,
    trackDuration: string,
    isAdmin: boolean,
    sessionId: string,
    oAuthToken: string,
    username?: string,
    email?: string
): Promise<void> {
    if (trackId === null || trackId === undefined) {
        throw new InvalidParameterError('Track ID is required');
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
    await addTrackToTimerManager(sessionId, oAuthToken);
}

export async function removePlayTrack(trackId: string): Promise<void> {
    if (trackId === null || trackId === undefined) {
        throw new InvalidParameterError('Track ID is required');
    }

    try {
        const deletedTrack = await prisma.track.delete({
            where: {
                id: trackId,
            },
        });
        if (deletedTrack.userId !== null && deletedTrack.userId !== undefined) {
            await prisma.user.update({
                where: {
                    id: deletedTrack.userId,
                },
                data: {
                    latTrackPlayed: new Date(),
                },
            });
        } else if (deletedTrack.guestId !== null && deletedTrack.guestId !== undefined) {
            await prisma.guest.update({
                where: {
                    id: deletedTrack.guestId,
                },
                data: {
                    latTrackPlayed: new Date(),
                },
            });
        }
        // Update the timer for this user
    } catch (error) {
        logger.error(error, 'Failed to remove track from wishlist');
        throw new DatabaseOperationError('Failed to remove track from wishlist');
    }
}
