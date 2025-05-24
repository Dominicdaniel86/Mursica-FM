import type { StateEnum } from '../../state.js';

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

export interface SessionStateRes {
    message: string;
    code: string;
    session_state: StateEnum;
}
