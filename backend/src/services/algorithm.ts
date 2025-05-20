import { NotFoundError } from '../errors/database.js';
import { prisma } from '../config.js';
import type { TrackSummary } from '../interfaces/spotifyTracks.js';
import type { CurrentSession, Track, User } from '@prisma/client';
import logger from '../logger/logger.js';

// TODO: Update the function when removing tracks is a feature: will cause problems
// TODO: Handle the rare case when the user has waited the same time
export async function getNextTrack(sessionId: string): Promise<{
    currentSession: CurrentSession;
    admin: User;
    trackSummary: TrackSummary | null;
    internalTrackId: string | null;
}> {
    // 1. Get the session DB entry
    const currentSession = await prisma.currentSession.findUnique({
        where: {
            sessionId,
        },
    });

    if (currentSession === null || currentSession === undefined) {
        throw new NotFoundError('Session not found');
    }

    // 2. Load the admin
    const admin = await prisma.user.findUnique({
        where: {
            id: currentSession.adminId,
        },
    });
    // 3. Load all guests
    const guests = await prisma.guest.findMany({
        where: {
            sessionId: currentSession.id,
        },
    });

    logger.info('NR OF GUESTS: ' + guests.length);

    if (admin === null || admin === undefined) {
        throw new NotFoundError('Admin not found');
    }

    // 4. Look which user has waited the longest
    const waitTimeArray: [number, string][] = [];

    const waitTimeMS = Date.now() - admin.latTrackPlayed.getTime();
    waitTimeArray.push([waitTimeMS, admin.id]);
    if (guests.length > 0) {
        for (const guest of guests) {
            logger.info('GUEST: ' + guest.guestToken);
            const waitTimeGuestMS = Date.now() - guest.latTrackPlayed.getTime();
            waitTimeArray.push([waitTimeGuestMS, guest.id]);
        }
    }

    let trackSummary: TrackSummary | null;
    let finalTrackId: string | null = null;

    logger.info('WAIT TIME ARRAY:');
    for (const tuple of waitTimeArray) {
        logger.info(`User ID: ${tuple[1]}, Wait Time (ms): ${tuple[0]}`);
    }

    while (true) {
        // 5. Get the user with the highest wait time
        const maxTuple = waitTimeArray.reduce(
            (max, current) => (current[0] > max[0] ? current : max),
            waitTimeArray[0]
        );
        logger.info('HIGHEST WAIT USER: ' + maxTuple[1]);

        let track: Track | null = null;

        if (maxTuple[1] === admin.id) {
            // Admin
            track = await prisma.track.findFirst({
                where: {
                    userId: maxTuple[1],
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
        } else {
            // Guest
            track = await prisma.track.findFirst({
                where: {
                    guestId: maxTuple[1],
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
        }

        if (track !== null) {
            trackSummary = {
                id: track.trackId,
                title: track.title,
                artist: track.artist,
                album: track.album,
                albumImage: track.coverUrl,
                duration: track.duration,
            };
            finalTrackId = track.id;
            break;
        } else {
            waitTimeArray.splice(waitTimeArray.indexOf(maxTuple), 1);
            if (waitTimeArray.length === 0) {
                trackSummary = null;
                finalTrackId = null;
                break;
            }
        }
    }

    // 6. Return the track
    return { currentSession, admin, trackSummary, internalTrackId: finalTrackId };
}

export async function generatePlaylist(): Promise<void> {}

export async function getWishlist(): Promise<void> {}
