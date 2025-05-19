import axios, { AxiosError } from 'axios';
import type { SpotifyPlayer } from '../interfaces/index.js';
import { InvalidParameterError } from '../errors/services.js';
import logger from '../logger/logger.js';

/**
 * Starts playback of the currently active track on the user's Spotify player.
 *
 * This function sends a request to the Spotify Web API to start playback for the user
 * associated with the provided OAuth token. The token must be a valid Spotify access token.
 *
 * @param token - The OAuth access token for the Spotify user. Must be a non-null, non-undefined string.
 * @throws {InvalidParameterError} If the token is null or undefined.
 * @throws {AxiosError} If the Spotify API request fails for any reason.
 */
export async function playTrack(token: string): Promise<void> {
    if (token === null || token === undefined) {
        throw new InvalidParameterError('No OAuth token found for this user');
    }

    logger.debug('Token found:', token);

    const url = 'https://api.spotify.com/v1/me/player/play';
    const config: object = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    try {
        await axios.put(url, {}, config);
    } catch (error) {
        logger.error('Error playing track:', error);
        throw new AxiosError(`Failed to play track on Spotify player`);
    }
}

/**
 * Pauses the currently active track on the Spotify player.
 *
 * Sends a request to the Spotify API to pause playback for the user
 * associated with the provided OAuth token.
 *
 * @param oAuthToken - The OAuth access token for the Spotify user. Must be a non-null, non-undefined string.
 * @throws {InvalidParameterError} If the token is null or undefined.
 * @throws {AxiosError} If the Spotify API request fails.
 */
export async function pauseTrack(oAuthToken: string): Promise<void> {
    if (oAuthToken === null || oAuthToken === undefined) {
        throw new InvalidParameterError('No OAuth token found for this user');
    }

    const url = 'https://api.spotify.com/v1/me/player/pause';
    const config: object = {
        headers: {
            Authorization: `Bearer ${oAuthToken}`,
        },
    };
    try {
        await axios.put(url, {}, config);
    } catch (error) {
        logger.error('Error pausing track:', error);
        throw new AxiosError(`Failed to pause track on Spotify player`);
    }
}

/**
 * Skips to the next track on the Spotify player.
 *
 * This function sends a request to the Spotify Web API to skip to the next track
 * for the user associated with the provided OAuth token. The token must be a valid
 * Spotify access token.
 *
 * @param oAuthToken - The OAuth access token for the Spotify user. Must be a non-null, non-undefined string.
 * @throws {InvalidParameterError} If the token is null or undefined.
 * @throws {AxiosError} If the Spotify API request fails for any reason.
 */
export async function skipTrack(oAuthToken: string): Promise<void> {
    if (oAuthToken === null || oAuthToken === undefined) {
        throw new InvalidParameterError('No OAuth token found for this user');
    }

    const url = 'https://api.spotify.com/v1/me/player/next';
    const config: object = {
        headers: {
            Authorization: `Bearer ${oAuthToken}`,
        },
    };
    try {
        await axios.post(url, {}, config);
    } catch (error) {
        logger.error('Error skipping track:', error);
        throw new AxiosError(`Failed to skip track on Spotify player`);
    }
}

/**
 * Gets the current volume level of the user's Spotify player.
 *
 * This function sends a request to the Spotify Web API to retrieve the current
 * player state, including the volume level, for the user associated with the
 * provided OAuth token.
 *
 * @param oAuthToken - The OAuth access token for the Spotify user. Must be a non-null, non-undefined string.
 * @returns The current volume level as a number between 0 and 100.
 * @throws {InvalidParameterError} If the token is null or undefined.
 * @throws {AxiosError} If the Spotify API request fails for any reason.
 */
export async function getCurrentVolume(oAuthToken: string): Promise<number> {
    if (oAuthToken === null || oAuthToken === undefined) {
        throw new InvalidParameterError('No OAuth token found for this user');
    }

    const url = 'https://api.spotify.com/v1/me/player';
    const config: object = {
        headers: {
            Authorization: `Bearer ${oAuthToken}`,
        },
    };
    try {
        const player = await axios.get<SpotifyPlayer>(url, config);
        return player.data.device.volume_percent;
    } catch (error) {
        logger.error('Error getting current volume:', error);
        throw new AxiosError(`Failed to get current volume on Spotify player`);
    }
}

/**
 * Changes the volume of the user's Spotify player.
 *
 * This function sends a request to the Spotify Web API to set the volume level
 * for the user associated with the provided OAuth token.
 *
 * @param oAuthToken - The OAuth access token for the Spotify user. Must be a non-null, non-undefined string.
 * @param desiredVolume - The volume level to set (as a string between "0" and "100").
 * @throws {InvalidParameterError} If the token is null or undefined.
 * @throws {AxiosError} If the Spotify API request fails for any reason.
 */
export async function changeCurrentVolume(oAuthToken: string, desiredVolume: string): Promise<void> {
    if (oAuthToken === null || oAuthToken === undefined) {
        throw new InvalidParameterError('No OAuth token found for this user');
    }

    const url = `https://api.spotify.com/v1/me/player/volume?volume_percent=${desiredVolume}`;
    const config: object = {
        headers: {
            Authorization: `Bearer ${oAuthToken}`,
        },
    };
    try {
        await axios.put(url, {}, config);
    } catch (error) {
        logger.error('Error changing volume:', error);
        throw new AxiosError(`Failed to change volume on Spotify player`);
    }
}
