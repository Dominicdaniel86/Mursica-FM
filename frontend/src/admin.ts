export {};

declare global {
    interface Window {
        spotifyLogin: () => void;
        playSong: () => void;
        stopSong: () => void;
        skipSong: () => void;
    }
}

export async function spotifyLogin() {

    const url: string = '/api/auth/spotify/login';
    const config: object = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        window.location.replace('/api/auth/spotify/login');
    } catch(error) {
        console.error(error);
    }
}

export async function playSong() {
    const url: string = '/api/admin/control/play';
    axios.put(url);
}

export async function stopSong() {
    const url: string = '/api/admin/control/stop';
    axios.put(url);
}

export async function skipSong() {
    const url: string = '/api/admin/control/skip';
    axios.post(url);
}

window.spotifyLogin = spotifyLogin;
window.playSong = playSong;
window.stopSong = stopSong;
window.skipSong = skipSong;
