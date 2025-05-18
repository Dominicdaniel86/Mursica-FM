export interface LoginResponse {
    token: string;
    user: {
        name: string;
        email: string;
    };
}
