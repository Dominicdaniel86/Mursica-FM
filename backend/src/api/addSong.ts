import axios from 'axios';
import { SpotifyTrackResponse, TrackSummary } from '../interfaces/index.js';
import logger from '../logger/logger.js';

export async function searchSong(track: string): Promise<TrackSummary[]> {

    // Validate input
    if(!track) {
        logger.warn('Received empty track input in function "searchSong"');
        return [];
    }

    track = track.replace(' ', '%2520');

    const url: string = `https://api.spotify.com/v1/search?q=${track}&type=track&limit=10&include_external=audio`;
    const config: object = {
        headers: {
            'Authorization': `Bearer ${process.env.CLIENT_CREDENTIAL_TOKEN}`
        }
    };

    try {
        const response = await axios.get<SpotifyTrackResponse>(url, config);

        const trackSummaries: TrackSummary[] = response.data.tracks.items.map(track => {
            return {
                id: track.id,
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
