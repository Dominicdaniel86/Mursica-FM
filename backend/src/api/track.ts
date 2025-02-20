import axios from 'axios';
import { SpotifyTrackResponse, TrackSummary } from '../interfaces/index.js';
import logger from '../logger/logger.js';
import { prisma } from '../config.js';
import { SpotifyPlayer } from '../interfaces/index.js';

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
    if(!track) {
        logger.warn('Received empty track input in function "searchSong".');
        return [];
    }

    track = track.replace(' ', '%2520');

    const token = await prisma.clientToken.findFirst();
    const tokenValue = token?.token;

    const url: string = `https://api.spotify.com/v1/search?q=${track}&type=track&limit=6&include_external=audio`;
    const config: object = {
        headers: {
            'Authorization': `Bearer ${tokenValue}`
        }
    };

    try {
        const response = await axios.get<SpotifyTrackResponse>(url, config);

        const trackSummaries: TrackSummary[] = response.data.tracks.items.map(track => {
            return {
                id: track.id,
                artist: track.artists[0].name,
                title: track.name,
                albumImage: track.album.images[0].url
            };
        });

        logger.info({'receivedTracks': trackSummaries.length}, `Received tracks from Spotify API`)

        return trackSummaries;

    } catch(error) {
        if(axios.isAxiosError(error)) {
            if(error.response)
                logger.error(error, `Spotify API request failed with status ${error.status}: ${error.message}`);
            else if(error.request)
                logger.error(error, `Spotify API request failed: No response received.`);
            else
                logger.error(error, `Spotify API request failed: ${error.message}`);
        } else {
            logger.error(error, `Spotify API request failed: Unexpected error.`);
        }

        throw new Error('Failed to fetch tracks from Spotify API.');
    }
}

/**
 * Plays the currently active track on the Spotify player.
 * 
 * This function retrieves the OAuth token from the database and 
 * sends a request to the Spotify API to start playback. Throws an
 * error if no OAuth token is found for the user.
 * 
 */
export async function playTrack() {

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
export async function pauseTrack() {

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
export async function skipTrack() {

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

export async function getCurrentVolume() {

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

export async function changeCurrentVolume(desiredVolume: string) {

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
