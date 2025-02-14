import axios from 'axios';
import { SpotifyTrackResponse, TrackSummary } from '../interfaces/index.js';
import logger from '../logger/logger.js';

export async function searchSong(track: string): Promise<Array<TrackSummary>> {

    // Validate input
    if(track === '') {
        logger.warn('searchSong function received empty input track');
    }

    track = track.replace(' ', '%2520');

    const url: string = `https://api.spotify.com/v1/search?q=${track}&type=track&limit=10&include_external=audio`;
    const config: object = {
        headers: {
            'Authorization': `Bearer ${process.env.CLIENT_CREDENTIAL_TOKEN}`
        }
    };

    const response = await axios.get<SpotifyTrackResponse>(url, config);
    const trackSummaries: Array<TrackSummary> = response.data.tracks.items.map(track => {
        return {
            id: track.id,
            title: track.name,
            albumImage: track.album.images[0].url
        };
    });

    logger.info({'received_tracks': trackSummaries.length}, `Received tracks from Spotify API`)

    return trackSummaries;
}
