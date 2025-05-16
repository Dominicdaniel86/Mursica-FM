// TODO: Fix this ESLint problem
/* eslint-disable @typescript-eslint/no-misused-promises */
export {};

declare global {
    interface Window {
        changeVolume: () => void;
        playSong: () => void;
        skipSong: () => void;
        spotifyLogin: () => void;
        spotifyLogout: () => void;
        stopSong: () => void;
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

async function playSong() {
    const url = '/api/admin/control/play';
    try {
        await axios.put(url);
    } catch (error) {
        console.error('Error playing song:', error);
    }
}

async function skipSong() {
    const url = '/api/admin/control/skip';
    try {
        await axios.post(url);
    } catch (error) {
        console.error('Error skipping song:', error);
    }
}

// TODO: Implement this function
async function spotifyLogin(): Promise<void> {
    // const url = '/api/auth/spotify/login';
    // const config: object = {
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    // };
    // try {
    //     window.location.replace('/api/auth/spotify/login');
    // } catch (error) {
    //     console.error(error);
    // }
}

// TODO: Implement this function
export async function spotifyLogout(): Promise<void> {
    // const url = '/api/auth/spotify/logout';
    // const config: object = {
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    // };
    // axios.post(url, config);
}

async function stopSong() {
    const url = '/api/admin/control/stop';
    try {
        await axios.put(url);
    } catch (error) {
        console.error('Error stopping song:', error);
    }
}

async function switchVolumeVisibility() {
    const volumeSliderElement = document.getElementById('volume-slider') as HTMLInputElement;

    if (volumeSliderElement === null || volumeSliderElement === undefined) {
        console.error('Volume slider element not found');
        return;
    }

    const visibility = volumeSliderElement.style.display ?? 'none';

    if (visibility === 'none') {
        volumeSliderElement.style.display = 'block';
    } else {
        volumeSliderElement.style.display = 'none';
    }
}

window.addEventListener('load', async () => {
    // TODO: Implement this function
    // check if the user is logged in
    // const loggedInReqUrl = '/api/auth/spotify/login';
    // const loggedInReqConfig: object = {
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    // };
    // try {
    //     const loggedIn = await axios.get<boolean>(loggedInReqUrl, loggedInReqConfig);
    //     const loggedINData = loggedIn.data;
    //     if (loggedINData) {
    //         const accountField = document.getElementById('spotify-account-logged-in') as HTMLDivElement;
    //         accountField.style.display = 'block';
    //     } else {
    //         const accountField = document.getElementById('spotify-account-logged-out') as HTMLDivElement;
    //         accountField.style.display = 'block';
    //     }
    // } catch {
    //     console.error('Error retrieving loggin status');
    // }

    // load current volume
    const url = '/api/admin/control/volume';
    const config: object = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    try {
        const volume = await axios.get<string>(url, config);
        const element = document.getElementById('volume-slider') as HTMLInputElement;
        if (element === null || element === undefined) {
            console.error('Volume slider element not found');
            return;
        }
        element.value = volume.data;
    } catch (error) {
        console.error('Error retrieving the current volume: ', error);
    }
});

window.spotifyLogin = spotifyLogin;
window.spotifyLogout = spotifyLogout;
window.switchVolumeVisibility = switchVolumeVisibility;
window.playSong = playSong;
window.stopSong = stopSong;
window.skipSong = skipSong;
window.changeVolume = changeVolume;
