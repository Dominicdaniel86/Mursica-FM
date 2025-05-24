// TODO: Fix this ESLint problem

import { CookieList, deleteCookie, getCookie, setCookie } from './shared/cookie-management.js';
import { openLoading } from './shared/popups.js';
import { validateNotAdmin } from './shared/validations.js';

/* eslint-disable @typescript-eslint/no-misused-promises */
export {};

declare global {
    interface Window {
        changeVolume: () => void;
        // playSong: () => void;
        // skipSong: () => void;
        spotifyLogin: () => void;
        spotifyLogout: () => void;
        logout: () => void;
        startSession: () => void;
        stopSession: () => void;
        // stopSong: () => void;
        switchVolumeVisibility: () => void;
    }
}

async function changeVolume() {
    const element = document.getElementById('volume-slider') as HTMLInputElement;
    const url = `/api/admin/control/volume?volume=${element.value}`;

    const config: object = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        await axios.put<string>(url, config);
    } catch (error) {
        console.error('Error changing volume:', error);
    }
}

// async function playSong() {
//     const url = '/api/admin/control/play';
//     try {
//         await axios.put(url);
//     } catch (error) {
//         console.error('Error playing song:', error);
//     }
// }

// async function skipSong() {
//     const url = '/api/admin/control/skip';
//     try {
//         await axios.post(url);
//     } catch (error) {
//         console.error('Error skipping song:', error);
//     }
// }

// TODO: Implement this function
async function spotifyLogin(): Promise<void> {
    const url = '/api/auth/spotify/login';
    try {
        setCookie('mursica-fm-admin-spotify-status', 'connected', 1);
        window.location.replace(url);
    } catch (error) {
        console.error(error);
    }
}

// TODO: Implement this function
export async function spotifyLogout(): Promise<void> {
    deleteCookie('mursica-fm-admin-spotify-status');
    window.location.replace('');
}

export async function logout(): Promise<void> {
    const url = '/api/auth/logout';
    const config: object = {
        headers: {
            Authorization: `Bearer ${getCookie(CookieList.ADMIN_TOKEN)}`,
        },
    };

    try {
        await axios.post(url, null, config);
    } catch (error) {
        console.error('Error logging out:', error);
    } finally {
        openLoading();
        setTimeout(() => {
            window.location.replace('/static/html/index.html');
        }, 1000);
        deleteCookie(CookieList.ADMIN_USERNAME);
        deleteCookie(CookieList.ADMIN_EMAIL);
        deleteCookie(CookieList.ADMIN_TOKEN);
    }
}

// async function stopSong() {
//     const url = '/api/admin/control/stop';
//     try {
//         await axios.put(url);
//     } catch (error) {
//         console.error('Error stopping song:', error);
//     }
// }

async function switchVolumeVisibility() {
    // const volumeSliderElement = document.getElementById('volume-slider') as HTMLInputElement;
    // if (volumeSliderElement === null || volumeSliderElement === undefined) {
    //     console.error('Volume slider element not found');
    //     return;
    // }
    // const visibility = volumeSliderElement.style.display ?? 'none';
    // if (visibility === 'none') {
    //     volumeSliderElement.style.display = 'block';
    // } else {
    //     volumeSliderElement.style.display = 'none';
    // }
}

async function startSession() {
    const url = '/api/admin/session/start';
    const body = {
        email: getCookie('mursica-fm-admin-email'),
        username: getCookie('mursica-fm-admin-username'),
        token: getCookie('mursica-fm-admin-token'),
    };
    try {
        const response = await axios.post<any>(url, body);
        // TODO: Use interface
        const sessionId = response.data.token;
        setCookie('mursica-fm-admin-session-id', sessionId, 7);
        setCookie('mursica-fm-admin-spotify-status', 'session', 7);
        window.location.replace('');
    } catch (error) {
        // eslint-disable-next-line no-alert
        alert('Error starting session: ' + error);
        console.error('Error starting session:', error);
    }
}

async function stopSession() {
    const url = '/api/admin/session/stop';
    const body = {
        email: getCookie('mursica-fm-admin-email'),
        username: getCookie('mursica-fm-admin-username'),
        token: getCookie('mursica-fm-admin-token'),
    };
    try {
        await axios.post(url, body);
        deleteCookie('mursica-fm-admin-session-id');
        deleteCookie('mursica-fm-admin-spotify-status');
        window.location.replace('');
    } catch (error) {
        // eslint-disable-next-line no-alert
        alert('Error ending session: ' + error);
        console.error('Error ending session:', error);
    }
}

// TODO: Currently, spotify account management is done with cookies -> Use HTTP requests
window.addEventListener('load', async () => {
    // TODO: Implement this function

    // load current volume
    // const url = '/api/admin/control/volume';
    // const config: object = {
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    // };
    // try {
    //     const volume = await axios.get<string>(url, config);
    //     const element = document.getElementById('volume-slider') as HTMLInputElement;
    //     if (element === null || element === undefined) {
    //         console.error('Volume slider element not found');
    //         return;
    //     }
    //     element.value = volume.data;
    // } catch (error) {
    //     console.error('Error retrieving the current volume: ', error);
    // }

    // Routing validation
    // TODO: Also really validate the admin with backend API
    validateNotAdmin('/static/html/index.html');

    let accName = getCookie('mursica-fm-admin-username');
    if (accName === null || accName === undefined || accName === '') {
        accName = 'Connected with email';
    }
    const accNameElement = document.getElementById('account-name') as HTMLSpanElement;
    accNameElement.innerText = accName;

    const spotifyStatus = getCookie('mursica-fm-admin-spotify-status');
    if (
        spotifyStatus === null ||
        spotifyStatus === undefined ||
        spotifyStatus === '' ||
        spotifyStatus === 'disconnected'
    ) {
        const accDisconnectedSection = document.getElementById('spotify-account-disconnected') as HTMLDivElement;
        accDisconnectedSection.style.display = 'block';
    } else if (spotifyStatus === 'connected') {
        const accConnectedSection = document.getElementById('spotify-account-connected') as HTMLDivElement;
        accConnectedSection.style.display = 'block';
    } else if (spotifyStatus === 'session') {
        const accSessionSection = document.getElementById('spotify-session-open') as HTMLDivElement;
        accSessionSection.style.display = 'block';
        const logoutElement = document.getElementById('logout') as HTMLElement;
        logoutElement.style.display = 'block';
        const sessionId = getCookie('mursica-fm-admin-session-id') ?? '#XXX-XXX';
        const sessionIdElement = document.getElementById('session-id') as HTMLSpanElement;
        sessionIdElement.innerText = sessionId;
    }
});

window.spotifyLogin = spotifyLogin;
window.spotifyLogout = spotifyLogout;
window.logout = logout;
window.startSession = startSession;
window.stopSession = stopSession;
window.switchVolumeVisibility = switchVolumeVisibility;
// window.playSong = playSong;
// window.stopSong = stopSong;
// window.skipSong = skipSong;
window.changeVolume = changeVolume;
