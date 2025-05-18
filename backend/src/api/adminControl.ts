import axios from 'axios';
import { prisma } from '../config.js';
import type { SpotifyPlayer } from '../interfaces/index.js';
import { NotFoundError } from '../errors/database.js';
import { AdminControlError } from '../errors/services.js';
import logger from '../logger/logger.js';

/**
 * Plays the currently active track on the Spotify player.
 *
 * This function retrieves the OAuth token from the database and
 * sends a request to the Spotify API to start playback. Throws an
 * error if no OAuth token is found for the user.
 *
 */
// TODO: Update the function to new user and token model
export async function playTrack(): Promise<void> {
    const token = await prisma.oAuthToken.findFirst();

    if (token?.token === null || token?.token === undefined) {
        throw new NotFoundError('No OAuth token found for this user');
    }

    logger.debug('Token found:', token.token);

    const url = 'https://api.spotify.com/v1/me/player/play';
    const config: object = {
        headers: {
            Authorization: `Bearer ${token.token}`,
        },
    };
    try {
        await axios.put(url, {}, config);
    } catch (error) {
        if (error instanceof Error) {
            throw new AdminControlError(`Failed to play track on Spotify player: ${error.message}`);
        } else {
            throw new AdminControlError('Failed to play track on Spotify player: Unknown error');
        }
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
// TODO: Update the function to new user and token model
export async function pauseTrack(): Promise<void> {
    const token = await prisma.oAuthToken.findFirst();

    if (token?.token === null || token?.token === undefined) {
        throw new NotFoundError('No OAuth token found for this user');
    }

    const url = 'https://api.spotify.com/v1/me/player/pause';
    const config: object = {
        headers: {
            Authorization: `Bearer ${token.token}`,
        },
    };
    try {
        await axios.put(url, {}, config);
    } catch (error) {
        if (error instanceof Error) {
            throw new AdminControlError(`Failed to pause track on Spotify player: ${error.message}`);
        } else {
            throw new AdminControlError('Failed to pause track on Spotify player: Unknown error');
        }
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
// TODO: Update the function to new user and token model
export async function skipTrack(): Promise<void> {
    const token = await prisma.oAuthToken.findFirst();

    if (token?.token === null || token?.token === undefined) {
        throw new NotFoundError('No OAuth token found for this user');
    }

    const url = 'https://api.spotify.com/v1/me/player/next';
    const config: object = {
        headers: {
            Authorization: `Bearer ${token.token}`,
        },
    };
    try {
        await axios.post(url, {}, config);
    } catch (error) {
        if (error instanceof Error) {
            throw new AdminControlError(`Failed to skip track on Spotify player: ${error.message}`);
        } else {
            throw new AdminControlError('Failed to skip track on Spotify player: Unknown error');
        }
    }
}

// TODO: Update the function to new user and token model
export async function getCurrentVolume(): Promise<number> {
    const token = await prisma.oAuthToken.findFirst();

    if (token?.token === null || token?.token === undefined) {
        throw new NotFoundError('No OAuth token found for this user');
    }

    const url = 'https://api.spotify.com/v1/me/player';
    const config: object = {
        headers: {
            Authorization: `Bearer ${token.token}`,
        },
    };
    try {
        const player = await axios.get<SpotifyPlayer>(url, config);
        return player.data.device.volume_percent;
    } catch (error) {
        if (error instanceof Error) {
            throw new AdminControlError(`Failed to get current volume: ${error.message}`);
        } else {
            throw new AdminControlError('Failed to get current volume: Unknown error');
        }
    }
}

// TODO: Update the function to new user and token model
export async function changeCurrentVolume(desiredVolume: string): Promise<void> {
    const token = await prisma.oAuthToken.findFirst();

    if (token?.token === null || token?.token === undefined) {
        throw new NotFoundError('No OAuth token found for this user');
    }

    const url = `https://api.spotify.com/v1/me/player/volume?volume_percent=${desiredVolume}`;
    const config: object = {
        headers: {
            Authorization: `Bearer ${token.token}`,
        },
    };
    try {
        await axios.put(url, {}, config);
    } catch (error) {
        if (error instanceof Error) {
            throw new AdminControlError(`Failed to change volume: ${error.message}`);
        } else {
            throw new AdminControlError('Failed to change volume: Unknown error');
        }
    }
}
