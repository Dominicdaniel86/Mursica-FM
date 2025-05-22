import { getCookie } from './cookie-management.js';

export function validateGuest(url: string): void {
    // TODO: Use Enums for the cookies
    const token = getCookie('mursica-fm-guest-token');
    const username = getCookie('mursica-fm-guest-username');
    const sessionId = getCookie('mursica-fm-guest-session-id');
    if (token && username && sessionId) {
        // User is already logged in
        window.location.href = url;
    }
}

export function validateAdmin(url: string): void {
    // TODO: Use Enums for the cookies
    const token = getCookie('mursica-fm-admin-token');
    const username = getCookie('mursica-fm-admin-username');
    const email = getCookie('mursica-fm-admin-email');
    // const sessionId = getCookie('mursica-fm-admin-session-id');
    if (token && (username || email)) {
        // User is already logged in
        window.location.href = url;
    }
}
