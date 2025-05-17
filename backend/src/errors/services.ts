export class AdminControlError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AdminControlError';
    }
}

export class InvalidParameterError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidParameterError';
    }
}
