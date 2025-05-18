export {};

export function setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/`;
}

export function getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');

    for (let c of ca) {
        c = c.trim();
        if (c.startsWith(nameEQ)) {
            return decodeURIComponent(c.substring(nameEQ.length));
        }
    }
    return null;
}

export function deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function listCookies(): Record<string, string> {
    const cookies: Record<string, string> = {};
    const cookieArray = document.cookie.split(';');

    for (const cookie of cookieArray) {
        const [name, ...rest] = cookie.trim().split('=');
        const value = rest.join('=');
        cookies[name] = decodeURIComponent(value);
    }

    return cookies;
}
