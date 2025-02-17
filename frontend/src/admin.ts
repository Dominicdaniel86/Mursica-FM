export {};

declare global {
    interface Window {
        spotifyLogin: () => void;
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

window.spotifyLogin = spotifyLogin;
