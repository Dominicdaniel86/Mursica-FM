// Filtered track search response
export interface TrackSummary {
    id: string;
    title: string;
    artist: string;
    albumImage: string;
}

export interface TrackResp {
    tracks: TrackSummary[];
}