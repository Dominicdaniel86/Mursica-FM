import axios, { AxiosError } from 'axios';
import type { SpotifyPlayer, SpotifyTrackResponse, TrackSummary } from '../interfaces/index.js';
import logger from '../logger/logger.js';
import { prisma } from '../config.js';
import { InvalidParameterError } from '../errors/services.js';

/**
 * Searches for a song on Spotify based on the given track name.
 *
 * @param {string} track - The name of the track to search for.
 *
 * @returns {Promise<TrackSummary[]>} - A promise resolving to an array of track summaries.
 *
 */
// TODO: Update the function to new user and token model
export async function searchSong(track: string): Promise<TrackSummary[]> {
    // Validate input
    if (track === undefined || track === null || track.trim() === '') {
        logger.error('Received empty track input in function "searchSong".');
        return [];
    }

    track = track.replace(' ', '%2520');

    const token = await prisma.clientToken.findFirst();
    const tokenValue = token?.token;

    const url = `https://api.spotify.com/v1/search?q=${track}&type=track&limit=6&include_external=audio`;
    const config: object = {
        headers: {
            Authorization: `Bearer ${tokenValue}`,
        },
    };

    try {
        const response = await axios.get<SpotifyTrackResponse>(url, config);

        const trackSummaries: TrackSummary[] = response.data.tracks.items.map((item) => ({
            id: item.id,
            artist: item.artists[0].name,
            title: item.name,
            albumImage: item.album.images[0].url,
            album: item.album.name,
            duration: item.duration_ms,
        }));

        logger.info({ receivedTracks: trackSummaries.length }, `Received tracks from Spotify API`);

        return trackSummaries;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response !== undefined && error.response !== null) {
                logger.error(error, `Spotify API request failed with status ${error.status}: ${error.message}`);
            } else if (error.request !== null) {
                logger.error(error, `Spotify API request failed: No response received.`);
            } else {
                logger.error(error, `Spotify API request failed: ${error.message}`);
            }
        } else {
            logger.error(error, `Spotify API request failed: Unexpected error.`);
        }

        throw new AxiosError('Failed to fetch tracks from Spotify API.');
    }
}

export async function playSong(token: string, trackId: string): Promise<void> {
    if (token === null || token === undefined) {
        throw new InvalidParameterError('No OAuth token found for this user');
    }

    logger.debug('Playing track with ID:' + trackId);
    logger.debug('Using token:' + token);

    const url = 'https://api.spotify.com/v1/me/player/play';
    const config: object = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const body = {
        uris: [`spotify:track:${trackId}`],
        position_ms: 0,
    };
    try {
        await axios.put(url, body, config);
    } catch (error) {
        logger.error('Error playing track:' + error, error);
        throw new AxiosError(`Failed to play track on Spotify player`);
    }
}

export async function getRemainingDuration(token: string): Promise<number> {
    if (token === null || token === undefined) {
        throw new InvalidParameterError('No OAuth token found for this user');
    }

    const url = 'https://api.spotify.com/v1/me/player';
    const config: object = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    try {
        const response = await axios.get<SpotifyPlayer>(url, config);
        const remainingDuration = response.data.item.duration_ms - response.data.progress_ms;
        return remainingDuration;
    } catch (error) {
        logger.error('Error getting remaining duration:', error);
        throw new AxiosError(`Failed to get remaining duration on Spotify player`);
    }
}
