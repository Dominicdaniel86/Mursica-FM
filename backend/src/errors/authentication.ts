export class ClientCredentialFlow extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ClientCredentialFlow';
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export class SpotifyStateError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SpotifyStateError';
    }
}

export class SpotifyStateExpiredError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SpotifyStateExpiredError';
    }
}

export class ExistingUserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ExistingUserError';
    }
}

export class NotVerifiedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotVerifiedError';
    }
}

export class AlreadyVerifiedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AlreadyVerifiedError';
    }
}

export class ExpiredTokenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ExpiredTokenError';
    }
}
