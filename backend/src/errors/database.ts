export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class DatabaseOperationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseOperationError';
    }
}

export class ValueAlreadyExistsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValueAlreadyExistsError';
    }
}
