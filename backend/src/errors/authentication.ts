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

export class RegistrationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RegistrationError';
    }
}

export class NotVerifiedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotVerifiedError';
    }
}
