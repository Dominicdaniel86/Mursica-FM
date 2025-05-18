import type { TrackResp } from './interfaces/search-song';
import { listCookies } from './shared/cookie-management.js';

declare global {
    interface Window {
        sendResponse: (input: string) => Promise<void>;
        searchSong: (input: string) => Promise<void>;
        switchToAdmin: () => void;
    }
}

//* Global variables
const searchSongElement = document.getElementById('search-song') as HTMLInputElement;
let timeoutID: number;

/**
 * Send the ID of the favored song.
 * @param {string} ID The song ID
 */
// TODO: Implement and test this function
async function sendResponse(ID: string): Promise<void> {
    if (ID === undefined || ID === null) {
        console.error('ID is undefined or null');
        return;
    }

    const url = `/api/tracks/select`;
    const data = new URLSearchParams({
        trackID: ID,
    });

    await axios.post<TrackResp>(url, data);

    // Clear track input and result
    searchSongElement.value = '';
    const targetDiv: HTMLDivElement = document.getElementById('song-results') as HTMLDivElement;
    while (targetDiv.firstChild) {
        targetDiv.removeChild(targetDiv.lastChild as ChildNode);
    }
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
    const response = await axios.get<TrackResp>(url);

    // Create HTML elements for all the retrieved tracks
    response.data.tracks.forEach((element) => {
        const newDiv = document.createElement('div');
        newDiv.className = 'song-result';
        newDiv.setAttribute('track-id', element.id);
        newDiv.onclick = () => async () => {
            await sendResponse(newDiv.getAttribute('track-id') as string);
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

    // Testing: Print out current cookies
    console.log(listCookies());
});

window.sendResponse = sendResponse;
window.searchSong = searchSong;
window.switchToAdmin = switchToAdmin;
