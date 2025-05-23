export interface LoginResponse {
    message: string;
    token: string;
}

export interface GuestJoinResponse {
    message: string;
    guestToken: string;
    username: string;
    sessionId: string;
}

export interface DefaultResponse {
    message: string;
}
