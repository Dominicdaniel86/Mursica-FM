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
