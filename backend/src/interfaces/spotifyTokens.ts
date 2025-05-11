// Response from Spotify API for the client-flow token authorization
export interface SpotifyClientTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number; // in seconds
}

// Response from Spotify API for the OAuth authorization
export interface SpotifyAuthTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number; // in seconds
    refresh_token: string;
}
