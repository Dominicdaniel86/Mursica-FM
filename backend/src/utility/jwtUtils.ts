import { generateRandomString } from './fileUtils.js';

export function generateJWTToken(): string {
    return generateRandomString(250);
}
