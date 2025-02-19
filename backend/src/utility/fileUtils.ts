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
