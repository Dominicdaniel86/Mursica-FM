import { playSong } from '../api/trackControl.js';
// import { getRemainingDuration, playSong } from '../api/trackControl.js';
// import { getNextTrack } from './algorithm.js';
import { addTrackToTimerManager, removePlayTrack } from './trackManagement.js';

class TimerManager {
    private timers: Map<string, NodeJS.Timeout> = new Map();

    // Set or update a timer for a specific ID
    async setTimer(
        oAuthToken: string,
        sessionId: string,
        delay: number,
        spotifyTrackId: string,
        trackDBId: string
    ): Promise<void> {
        // TODO: Make delay dynamic
        delay -= 1000; // 1 second delay
        // delay = 1000 * 10; // 10 seconds delay //! TEMPORARY - TESTING PURPOSES ONLY
        this.clearTimer(oAuthToken); // Clear any existing timer for the same ID
        if (
            spotifyTrackId === null ||
            spotifyTrackId === undefined ||
            spotifyTrackId === '' ||
            trackDBId === null ||
            trackDBId === undefined ||
            trackDBId === ''
        ) {
            // No track to play: no need to set a timer (maybe pause spotify instead?)
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const timer = setTimeout(async () => {
            await playSong(oAuthToken, spotifyTrackId); // Play the song
            await removePlayTrack(trackDBId); // Remove the track from the database after playing
            await addTrackToTimerManager(sessionId, oAuthToken); // Add the next track to the timer manager
        }, delay);
        this.timers.set(oAuthToken, timer); // Store the new timer in the map

        //     const trackSummary = await getNextTrack(sessionId); // Get the next track after the current one finishes
        //     const getRemainingTime = await getRemainingDuration(token); // Get the remaining time for the next track
        //     if (trackSummary.trackSummary !== null && trackSummary.trackSummary !== undefined) {
        //         await this.setTimer(
        //             token,
        //             sessionId,
        //             trackSummary.trackSummary.id,
        //             trackSummary.internalTrackId,
        //             getRemainingTime
        //         ); // Set a new timer for the next track
        //     }
        //     this.timers.delete(token); // Remove the timer from the map when it expires
    }

    // Clear the timer for a specific ID
    clearTimer(token: string): void {
        const timer = this.timers.get(token);
        if (timer) {
            clearTimeout(timer); // Clear the timer
            this.timers.delete(token); // Remove it from the map
        }
    }
}

export const timerManager = new TimerManager();
export default timerManager;
