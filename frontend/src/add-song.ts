import { TrackResp } from "./interfaces/search-song";

declare global {
    interface Window {
        switchToAdmin: () => void;
        sendResponse: (input: string) => void;
    }
}

//* Global variables
let searchSongElement: HTMLInputElement = document.getElementById('search-song') as HTMLInputElement;
let timeoutID: number;

//* Called when the DOM has loaded
window.addEventListener('load', () => {
    console.log('DOM has loaded');

    // Reset searched song value
    searchSongElement.value = '';

    searchSongElement.addEventListener('input', () => {
        clearTimeout(timeoutID);
        timeoutID = setTimeout(() => {
            searchSong(searchSongElement.value);
        }, 1000);
    });
});

// Routing to admin page
// TODO: Implement authorization step
export function switchToAdmin() {
    window.location.href = '/static/html/admin.html';
}

/**
 * This function sends a request to the backend to search for songs with a given title.
 * It gets called after 1 second has passed after the last input in the song title field.
 * 
 * @param {string} input The song title
 */
async function searchSong(input: string) {

    const targetDiv: HTMLDivElement = document.getElementById("song-results") as HTMLDivElement;

    // Remove existing child elements (searched songs from previous requests)
    while(targetDiv.firstChild) {
        targetDiv.removeChild(targetDiv.lastChild as ChildNode);
    }

    // If input is empty: stop function execution
    if(!input)
        return;

    // Request to backend
    const url: string = `/api/tracks/search/?trackTitle=${input}`;
    let response = await axios.get<TrackResp>(url);

    // Create HTML elements for all the retrieved tracks
    response.data.tracks.forEach(element => {
        const newDiv = document.createElement("div");
        newDiv.className = 'song-result';
        newDiv.setAttribute('track-id', element.id);
        newDiv.onclick = () => {
            sendResponse(newDiv.getAttribute('track-id') as string);
        };

        const albumElement = document.createElement("img");
        const titleElement = document.createElement("p");
        const artistElement = document.createElement("p");

        titleElement.textContent = element.title;
        artistElement.textContent = `- ${element.artist}`;
        albumElement.src = element.albumImage;

        newDiv.appendChild(albumElement);
        newDiv.appendChild(titleElement);
        newDiv.appendChild(artistElement);

        targetDiv?.appendChild(newDiv);
    });
}

/**
 * Send the ID of the favored song.
 * @param {string} ID The song ID
 */
export async function sendResponse(ID: string) {

    console.log(`ID: ${ID}`);

    const url: string = `/api/tracks/select`;
    const data = new URLSearchParams({
        trackID: ID
    });
    let response = await axios.post<TrackResp>(url, data);

    console.log(response.data);

    // Clear track input and result
    searchSongElement.value = '';
    const targetDiv: HTMLDivElement = document.getElementById("song-results") as HTMLDivElement;
    while(targetDiv.firstChild) {
        targetDiv.removeChild(targetDiv.lastChild as ChildNode);
    }
}

window.switchToAdmin = switchToAdmin;
window.sendResponse = sendResponse;
