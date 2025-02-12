import axios from 'axios';
import { SpotifyTrackResponse, TrackSummary } from '../interfaces/index.js';
import logger from '../logger/logger.js';

export async function searchSong(track: string): Promise<Array<TrackSummary>> {

    let filteredSongs: Array<TrackSummary> = [];

    const url: string = 'https://api.spotify.com/v1/search?q=master%2520of%2520puppets&type=track&limit=10&include_external=audio';

    const config: object = {
        headers: {
            'Authorization': `Bearer ${process.env.CLIENT_CREDENTIAL_TOKEN}`
        }
    };

    axios.get<SpotifyTrackResponse>(url, config)
        .then(response => {
            const trackSummaries = response.data.tracks.items.map(track => {
                return {
                    id: track.id,
                    title: track.name,
                    albumImage: track.album.images[0].url
                };
            });

            filteredSongs = trackSummaries;
        })

    return filteredSongs;
}
