/**
 * Generates a random alphanumeric string of the specified length.
 *
 * The generated string consists of uppercase and lowercase Latin letters (A-Z, a-z)
 * and numerical digits (0-9).
 *
 * @param {number} length - The desired length of the output string.
 * @returns {string} A randomly generated alphanumeric string.
 */
export function generateRandomString(length: number): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Generates a random session ID in the format #XXX-XXX, where X is a random alphanumeric character.
 *
 * @returns {string} A random session ID in the format #XXX-XXX, where X is a random alphanumeric character.
 */
export function generateRandomSessionId(): string {
    const part1 = generateRandomString(3).toUpperCase();
    const part2 = generateRandomString(3).toUpperCase();
    return `#${part1}-${part2}`;
}
