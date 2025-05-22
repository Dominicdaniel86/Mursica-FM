import type { DefaultResponse } from './interfaces/login';
import type { TrackResp } from './interfaces/search-song';
import { deleteCookie, getCookie } from './shared/cookie-management.js';

declare global {
    interface Window {
        sendResponse: (input: HTMLDivElement) => Promise<void>;
        searchSong: (input: string) => Promise<void>;
        switchToAdmin: () => void;
        leaveSession: () => Promise<void>;
    }
}

//* Global variables
const searchSongElement = document.getElementById('search-song') as HTMLInputElement;
let timeoutID: number;
let isAdmin = false;

/**
 * Send the ID of the favored song.
 * @param {string} ID The song ID
 */
// TODO: Implement and test this function
async function sendResponse(clickedDiv: HTMLDivElement): Promise<void> {
    if (clickedDiv === null || clickedDiv === undefined) {
        console.error('Clicked div is null or undefined');
        return;
    }

    const id = clickedDiv.getAttribute('track-id');
    const title = clickedDiv.getAttribute('track-title');
    const artist = clickedDiv.getAttribute('track-artist');
    const album = clickedDiv.getAttribute('track-album');
    const coverUrl = clickedDiv.getAttribute('track-cover-url');
    const duration = clickedDiv.getAttribute('track-duration');

    const url = `/api/tracks/select`;
    const body = {
        token: isAdmin ? getCookie('mursica-fm-admin-token') : getCookie('mursica-fm-guest-token'),
        username: isAdmin ? getCookie('mursica-fm-admin-username') : getCookie('mursica-fm-guest-username'),
        email: isAdmin ? getCookie('mursica-fm-admin-email') : '',
        sessionId: isAdmin ? getCookie('mursica-fm-admin-session-id') : getCookie('mursica-fm-guest-session-id'),
        trackId: id,
        trackTitle: title,
        trackArtist: artist,
        trackAlbum: album,
        trackCoverURL: coverUrl,
        trackDuration: duration,
    };

    await axios.post<TrackResp>(url, body);

    // Clear track input and result
    searchSongElement.value = '';
    const targetDiv: HTMLDivElement = document.getElementById('song-results') as HTMLDivElement;
    while (targetDiv.firstChild) {
        targetDiv.removeChild(targetDiv.lastChild as ChildNode);
    }

    // eslint-disable-next-line no-alert
    alert('Song added to the queue!');
}

/**
 * This function sends a request to the backend to search for songs with a given title.
 * It gets called after 1 second has passed after the last input in the song title field.
 *
 * @param {string} input The song title
 */
async function searchSong(input: string) {
    const targetDiv: HTMLDivElement = document.getElementById('song-results') as HTMLDivElement;

    if (targetDiv === null || targetDiv === undefined) {
        console.error('Target div not found');
        return;
    }

    // Remove existing child elements (searched songs from previous requests)
    while (targetDiv.firstChild) {
        targetDiv.removeChild(targetDiv.lastChild as ChildNode);
    }

    // If input is empty: stop function execution
    if (!input || input.length === 0) {
        return;
    }

    // Request to backend
    const url = `/api/tracks/search/?trackTitle=${input}`;
    let config = {};
    // TODO: Helper function for that
    if (isAdmin) {
        config = {
            headers: {
                'x-token': getCookie('mursica-fm-admin-token'),
                'x-email': getCookie('mursica-fm-admin-email'),
                'x-username': getCookie('mursica-fm-admin-username'),
            },
        };
    } else {
        config = {
            headers: {
                'x-token': getCookie('mursica-fm-guest-token'),
                'x-username': getCookie('mursica-fm-guest-username'),
                'x-session-id': getCookie('mursica-fm-guest-session-id'),
            },
        };
    }

    let response: TrackResp;
    try {
        response = (await axios.get<TrackResp>(url, config)).data;
        // Create HTML elements for all the retrieved tracks
        response.tracks.forEach((element) => {
            const newDiv = document.createElement('div');
            newDiv.className = 'song-result';
            newDiv.setAttribute('track-id', element.id);
            newDiv.setAttribute('track-title', element.title);
            newDiv.setAttribute('track-artist', element.artist);
            newDiv.setAttribute('track-album', element.album);
            newDiv.setAttribute('track-cover-url', element.albumImage);
            newDiv.setAttribute('track-duration', element.duration.toString());
            newDiv.onclick = async () => {
                await sendResponse(newDiv);
            };

            const albumElement = document.createElement('img');
            const titleElement = document.createElement('p');
            const artistElement = document.createElement('p');

            titleElement.textContent = element.title;
            artistElement.textContent = `- ${element.artist}`;
            albumElement.src = element.albumImage;

            newDiv.appendChild(albumElement);
            newDiv.appendChild(titleElement);
            newDiv.appendChild(artistElement);

            targetDiv?.appendChild(newDiv);
        });
    } catch (error) {
        console.error('Error searching for song:', error);
    }
}

async function leaveSession() {
    const guestToken = getCookie('mursica-fm-guest-token');
    const username = getCookie('mursica-fm-guest-username');
    const sessionId = getCookie('mursica-fm-guest-session-id');
    const body = {
        guestToken,
        username,
        sessionId,
    };
    try {
        const result = await axios.post<DefaultResponse>('/api/guest/leave', body);
        if (result.status !== 200) {
            console.error(result.data.message);
            return;
        }
    } catch (error: any) {
        console.error('Error leaving session:', error);
    } finally {
        // Clear cookies
        deleteCookie('mursica-fm-guest-token');
        deleteCookie('mursica-fm-guest-username');
        deleteCookie('mursica-fm-guest-session-id');
        // Redirect to the index page
        window.location.href = '/static/html/index.html';
    }
}

// Routing to admin page
// TODO: Implement authorization step
function switchToAdmin(): void {
    window.location.href = '/static/html/admin.html';
}

//* Called when the DOM has loaded
window.addEventListener('load', () => {
    // Reset searched song value
    searchSongElement.value = '';

    // Add event listener to the search song input field
    // -> search for songs after 1 second of input inactivity
    searchSongElement.addEventListener('input', () => {
        clearTimeout(timeoutID);
        timeoutID = setTimeout(async () => {
            await searchSong(searchSongElement.value);
        }, 1000);
    });

    // TODO: Validate session and/ or admin login

    // If guest: show logout icon
    const guestToken = getCookie('mursica-fm-guest-token');
    const adminToken = getCookie('mursica-fm-admin-token');
    if (guestToken) {
        const leaveIcon = document.getElementById('logout') as HTMLImageElement;
        leaveIcon.style.display = 'block';
    } else if (adminToken) {
        // If admin: show admin icon
        const adminIcon = document.getElementById('admin') as HTMLImageElement;
        adminIcon.style.display = 'block';
        isAdmin = true;
    } else {
        // TODO: Improve this and use the helper functions
        window.location.href = '/static/html/index.html';
    }
});

window.sendResponse = sendResponse;
window.searchSong = searchSong;
window.switchToAdmin = switchToAdmin;
window.leaveSession = leaveSession;
