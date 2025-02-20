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
    
    // check if user is logged in
    const firstUrl: string = '/api/admin';
    const firstConfig: object = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const loggedIn = await axios.get<boolean>(firstUrl, firstConfig);
        const loggedINData = loggedIn.data;

        if(loggedINData) {
            let accountField = document.getElementById('spotify-account-logged-in') as HTMLDivElement;
            accountField.style.display = 'block';
            console.info("LOGGED IN");
        } else {
            let accountField = document.getElementById('spotify-account-logged-out') as HTMLDivElement;
            accountField.style.display = 'block';
            console.info("LOGGED IN");
        }
    } catch(error) {
        console.error('Error retrieving loggin status');
    }
    
    // load current volume
    const url: string = '/api/admin/control/volume';
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
    } catch(error) {
        console.error('Error retrieving the current volume');
    }


});

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

export async function spotifyLogout() {
    const url: string = '/api/auth/spotify/logout';
    const config: object = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    axios.post(url, config);
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

export async function switchVolumeVisbility() {
    const volumeSliderElement = document.getElementById('volume-slider') as HTMLInputElement;
    const visiblity = volumeSliderElement.style.display;

    if(visiblity === 'none')
        volumeSliderElement.style.display = 'block';
    else
        volumeSliderElement.style.display = 'none';
}

export async function changeVolume() {
    const element = document.getElementById('volume-slider') as HTMLInputElement;
    console.log(element.value);
    console.log('Volume changed');
}

window.spotifyLogin = spotifyLogin;
window.spotifyLogout = spotifyLogout;
window.switchVolumeVisbility = switchVolumeVisbility;
window.playSong = playSong;
window.stopSong = stopSong;
window.skipSong = skipSong;
window.changeVolume = changeVolume;
