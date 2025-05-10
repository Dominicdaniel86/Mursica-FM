import axios from 'axios';
import { prisma } from '../config.js';
import type { SpotifyPlayer } from '../interfaces/index.js';

/**
 * Plays the currently active track on the Spotify player.
 * 
 * This function retrieves the OAuth token from the database and 
 * sends a request to the Spotify API to start playback. Throws an
 * error if no OAuth token is found for the user.
 * 
 */
export async function playTrack(): Promise<void> {

    const token = await prisma.oAuthToken.findFirst();

    if(token) {
        const url = 'https://api.spotify.com/v1/me/player/play';
        const config: object = {
            headers: {
                'Authorization': `Bearer ${token.token}`
            }
        };
        await axios.put(url, {}, config);
    } else {
        throw new Error('No OAuth token found for this user');
    }
}

/**
 * Pauses the currently active track on the Spotify player.
 * 
 * This function retrieves the OAuth token from the database and 
 * sends a request to the Spotify API to pause playback. Throws an
 * error if no OAuth token is found for the user.
 * 
 */
export async function pauseTrack(): Promise<void> {

    const token = await prisma.oAuthToken.findFirst();

    if(token) {
        const url = 'https://api.spotify.com/v1/me/player/pause';
        const config: object = {
            headers: {
                'Authorization': `Bearer ${token.token}`
            }
        };
        await axios.put(url, {}, config);
    } else {
        throw new Error('No OAuth token found for this user');
    }
}

/**
 * Skips to the next track on the Spotify player.
 * 
 * This function retrieves the OAuth token from the database and 
 * sends a request to the Spotify API to skip to the next track.
 * Throws an error if no OAuth token is found for the user.
 * 
 */
export async function skipTrack(): Promise<void> {

    const token = await prisma.oAuthToken.findFirst();

    if(token) {
        const url = 'https://api.spotify.com/v1/me/player/next';
        const config: object = {
            headers: {
                'Authorization': `Bearer ${token.token}`
            }
        };
        await axios.post(url, {}, config);
    } else {
        throw new Error('No OAuth token found for this user');
    }
}

export async function getCurrentVolume(): Promise<number> {

    const token = await prisma.oAuthToken.findFirst();

    if(token) {
        const url = 'https://api.spotify.com/v1/me/player';
        const config: object = {
            headers: {
                'Authorization': `Bearer ${token.token}`
            }
        };
        const player = await axios.get<SpotifyPlayer>(url, config);

        return player.data.device.volume_percent;
    } else {
        throw new Error('No OAuth token found for this user');
    }
}

export async function changeCurrentVolume(desiredVolume: string): Promise<void> {

    const token = await prisma.oAuthToken.findFirst();

    if(token) {
        const url = `https://api.spotify.com/v1/me/player/volume?volume_percent=${desiredVolume}`;
        const config: object = {
            headers: {
                'Authorization': `Bearer ${token.token}`
            }
        };
        await axios.put(url, {}, config);
    } else {
        throw new Error('Could not change volume');
    }
}
