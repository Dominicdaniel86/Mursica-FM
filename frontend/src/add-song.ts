import { TrackResp } from "./interfaces/search-song";

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

    const targetDiv: HTMLDivElement = document.getElementById("song-results") as HTMLDivElement;

    while(targetDiv.firstChild) {
        targetDiv.removeChild(targetDiv.lastChild as ChildNode);
    }

    if(!input)
        return;

    const url: string = '/api/tracks/search/?trackTitle=Master of Puppets';

    let response = await axios.get<TrackResp>(url);

    response.data.tracks.forEach(element => {
        const newDiv = document.createElement("div");
        newDiv.className = 'song-result';

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

let searchSongElement: HTMLInputElement = document.getElementById('search-song') as HTMLInputElement;
let timeoutID: number;

searchSongElement.addEventListener('input', () => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
        searchSong(searchSongElement.value);
    }, 1750);
});

window.switchToAdmin = switchToAdmin;
