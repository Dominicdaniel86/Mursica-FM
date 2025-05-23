export interface LoginResponse {
    message: string;
    token: string;
    user: {
        name: string;
        email: string;
    };
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
