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
