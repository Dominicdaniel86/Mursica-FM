import { playSong } from '../api/trackControl.js';

class TimerManager {
    private timers: Map<string, NodeJS.Timeout> = new Map();

    // Set or update a timer for a specific ID
    async setTimer(token: string, trackId: string, delay: number): Promise<void> {
        delay -= 1000; // Adjust delay to account for the time taken to play the song
        this.clearTimer(token); // Clear any existing timer for the same ID
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const timer = setTimeout(async () => {
            await playSong(token, trackId);
            this.timers.delete(token); // Remove the timer from the map when it expires
        }, delay);
        this.timers.set(token, timer); // Store the new timer in the map
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
