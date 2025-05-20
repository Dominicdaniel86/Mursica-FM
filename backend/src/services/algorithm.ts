import { NotFoundError } from '../errors/database.js';
import { prisma } from '../config.js';
import type { TrackSummary } from '../interfaces/spotifyTracks.js';

// TODO: Update the function when removing tracks is a feature: will cause problems
// TODO: Handle the rare case when the user has waited the same time
export async function getNextTrack(sessionId: string): Promise<TrackSummary> {
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
            sessionId,
        },
    });

    if (admin === null || admin === undefined) {
        throw new NotFoundError('Admin not found');
    }

    // 4. Look which user has waited the longest
    const waitTimeMap = new Map<number, string>();

    const waitTimeMS = Date.now() - admin.latTrackPlayed.getTime();
    waitTimeMap.set(waitTimeMS, admin.id);
    if (guests.length > 0) {
        for (const guest of guests) {
            const waitTimeGuestMS = Date.now() - guest.latTrackPlayed.getTime();
            waitTimeMap.set(waitTimeGuestMS, guest.id);
        }
    }

    let trackSummary: TrackSummary | null;

    while (true) {
        const waitTimes = waitTimeMap.keys();
        const lowestWaitTime = Math.min(...Array.from(waitTimes));
        const userId = waitTimeMap.get(lowestWaitTime);

        const track = await prisma.track.findFirst({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        if (track !== null) {
            trackSummary = {
                id: track.trackId,
                title: track.title,
                artist: track.artist,
                album: track.album,
                albumImage: track.coverUrl,
                duration: track.duration,
            };
            break;
        } else {
            waitTimeMap.delete(lowestWaitTime);
        }
    }

    // 6. Return the track
    return trackSummary;
}

export async function generatePlaylist(): Promise<void> {}

export async function getWishlist(): Promise<void> {}
