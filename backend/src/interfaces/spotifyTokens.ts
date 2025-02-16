// Response from Spotify API for the client-flow token authorization
export interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;  // in seconds
}
