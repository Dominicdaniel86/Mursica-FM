// TODO: Fix this ESLint problem
/* eslint-disable @typescript-eslint/no-misused-promises */
export {};

declare global {
    interface Window {
        spotifyLogin: () => void;
        spotifyLogout: () => void;
        switchVolumeVisbility: () => void;
        playSong: () => void;
        stopSong: () => void;
        skipSong: () => void;
        changeVolume: () => void;
    }
}

window.addEventListener('load', async () => {

    // check if the user is logged in
    const loggedInReqUrl = '/api/auth/spotify/login';
    const loggedInReqConfig: object = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const loggedIn = await axios.get<boolean>(loggedInReqUrl, loggedInReqConfig);
        const loggedINData = loggedIn.data;

        if(loggedINData) {
            const accountField = document.getElementById('spotify-account-logged-in') as HTMLDivElement;
            accountField.style.display = 'block';
            console.info("LOGGED IN");
        } else {
            const accountField = document.getElementById('spotify-account-logged-out') as HTMLDivElement;
            accountField.style.display = 'block';
            console.info("LOGGED IN");
        }
    } catch {
        console.error('Error retrieving loggin status');
    }
    
    // load current volume
    const url = '/api/admin/control/volume';
    const config: object = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const volume = await axios.get<string>(url, config);
        console.log(volume.data);

        const element = document.getElementById('volume-slider') as HTMLInputElement;
        element.value = volume.data;
    } catch {
        console.error('Error retrieving the current volume');
    }


});

export async function spotifyLogin(): Promise<void> {

    const url = '/api/auth/spotify/login';
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

export async function spotifyLogout(): Promise<void> {
    const url = '/api/auth/spotify/logout';
    const config: object = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    axios.post(url, config);
}

export async function playSong(): Promise<void> {
    const url = '/api/admin/control/play';
    axios.put(url);
}

export async function stopSong(): Promise<void> {
    const url = '/api/admin/control/stop';
    axios.put(url);
}

export async function skipSong(): Promise<void> {
    const url = '/api/admin/control/skip';
    axios.post(url);
}

export async function switchVolumeVisbility(): Promise<void> {
    const volumeSliderElement = document.getElementById('volume-slider') as HTMLInputElement;
    const visiblity = volumeSliderElement.style.display;

    if(visiblity === 'none') {
        volumeSliderElement.style.display = 'block';
    } else {
        volumeSliderElement.style.display = 'none'; 
    }
}

export async function changeVolume(): Promise<void> {
    const element = document.getElementById('volume-slider') as HTMLInputElement;
    console.log(element.value);
    console.log('Volume changed');

    const url = `/api/admin/control/volume?volume=${element.value}`;
    const config: object = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    await axios.put<string>(url, config);
}

window.spotifyLogin = spotifyLogin;
window.spotifyLogout = spotifyLogout;
window.switchVolumeVisbility = switchVolumeVisbility;
window.playSong = playSong;
window.stopSong = stopSong;
window.skipSong = skipSong;
window.changeVolume = changeVolume;
