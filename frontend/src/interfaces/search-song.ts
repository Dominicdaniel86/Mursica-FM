// Filtered track search response
export interface TrackSummary {
    id: string;
    title: string;
    artist: string;
    album: string;
    albumImage: string;
    duration: number;
}

export interface TrackResp {
    tracks: TrackSummary[];
}
