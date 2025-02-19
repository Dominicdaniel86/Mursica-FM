import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { SpotifyTrackResponse, TrackSummary } from '../interfaces/index.js';
import logger from '../logger/logger.js';

const prisma = new PrismaClient();

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

export async function playTrack() {

    const token = await prisma.oAuthToken.findFirst();

    if(token) {
        logger.debug(token.token);
        const url = 'https://api.spotify.com/v1/me/player/play';
        const config: object = {
            headers: {
                'Authorization': `Bearer ${token.token}`
            }
        };
        const response = await axios.put(url, {}, config);
        // logger.info(response.data);
    }
}

export async function pauseTrack() {

    const token = await prisma.oAuthToken.findFirst();

    if(token) {
        logger.debug(token.token);
        const url = 'https://api.spotify.com/v1/me/player/pause';
        const config: object = {
            headers: {
                'Authorization': `Bearer ${token.token}`
            }
        };
        const response = await axios.put(url, {}, config);
        // logger.info(response.data);
    }
}

export async function skipTrack() {

    const token = await prisma.oAuthToken.findFirst();

    if(token) {
        logger.debug(token.token);
        const url = 'https://api.spotify.com/v1/me/player/next';
        const config: object = {
            headers: {
                'Authorization': `Bearer ${token.token}`
            }
        };
        const response = await axios.post(url, {}, config);
        // logger.info(response.data);
    }
}
