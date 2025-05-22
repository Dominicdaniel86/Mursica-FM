// Full response from the Spotify track search API
export interface SpotifyTrackResponse {
    tracks: {
        href: string;
        limit: number;
        next: string | null;
        offset: number;
        previous: string | null;
        total: number;
        items: Array<Track>;
    };
}

// Filtered track search response
export interface TrackSummary {
    id: string;
    title: string;
    artist: string;
    album: string;
    albumImage: string;
    duration: number;
}

//* Following interfaces are all sub-parts of the SpotifyTrackResponse interface
interface Track {
    album: Album;
    artists: Array<Artists>;
    available_markets: Array<string>;
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_ids: object;
    external_urls: object;
    href: string;
    id: string;
    is_local: boolean;
    is_playable: boolean;
    name: string;
    popularity: number;
    preview_url: string;
    track_number: number;
    type: string;
    uri: string;
}

interface Album {
    album_type: string;
    artists: Array<Artists>;
    available_markets: Array<string>;
    external_urls: object;
    href: string;
    id: string;
    images: Array<Image>;
    is_playable: boolean;
    name: string;
    release_date: string;
    release_date_precision: string;
    total_tracks: number;
    type: string;
    uri: string;
}

interface Artists {
    external_urls: object;
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
}

interface Image {
    height: number;
    width: number;
    url: string;
}
