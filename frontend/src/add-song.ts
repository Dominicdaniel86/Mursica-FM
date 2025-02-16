import { TrackSummary } from "./interfaces/search-song";

declare global {
    interface Window {
        switchToAdmin: () => void;
    }
}

window.addEventListener('load', () => {
    console.log('DOM has loaded');

    // Reset searched song value
    let searchSongElement: HTMLInputElement = document.getElementById('search-song') as HTMLInputElement;
    searchSongElement.value = '';
});

export function switchToAdmin() {
    window.location.href = '/static/html/admin.html';
}

async function searchSong(input: string) {

    const url: string = '/api/tracks/search/?trackTitle=Master of Puppets';

    let response = await axios.get<TrackSummary>(url);

    console.log(response.data);
}

let searchSongElement: HTMLInputElement = document.getElementById('search-song') as HTMLInputElement;
let timeoutID: number;

searchSongElement.addEventListener('input', () => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
        searchSong(searchSongElement.value);
    }, 1750);
});

window.switchToAdmin = switchToAdmin;
