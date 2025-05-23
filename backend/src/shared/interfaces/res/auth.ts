export interface AuthenticationRes {
    token: string;
    message: string;
    code: number;
    user: {
        username: string;
        email: string;
        verified: boolean;
    };
}
