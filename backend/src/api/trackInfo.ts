import axios from 'axios';
import type { SpotifyTrackResponse, TrackSummary } from '../interfaces/index.js';
import logger from '../logger/logger.js';
import { prisma } from '../config.js';

/**
 * Searches for a song on Spotify based on the given track name.
 *
 * @param {string} track - The name of the track to search for.
 *
 * @returns {Promise<TrackSummary[]>} - A promise resolving to an array of track summaries.
 *
 */
export async function searchSong(track: string): Promise<TrackSummary[]> {
    // Validate input
    if (track === undefined || track === null || track.trim() === '') {
        logger.warn('Received empty track input in function "searchSong".');
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
        }));

        logger.info({ receivedTracks: trackSummaries.length }, `Received tracks from Spotify API`);

        return trackSummaries;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                logger.error(error, `Spotify API request failed with status ${error.status}: ${error.message}`);
            } else if (typeof error.request !== 'undefined' && error.request !== null) {
                logger.error(error, `Spotify API request failed: No response received.`);
            } else {
                logger.error(error, `Spotify API request failed: ${error.message}`);
            }
        } else {
            logger.error(error, `Spotify API request failed: Unexpected error.`);
        }

        throw new Error('Failed to fetch tracks from Spotify API.');
    }
}
