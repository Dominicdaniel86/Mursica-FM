import axios from 'axios';

export async function searchSong(track: string): Promise<Array<object>> {

    let filteredSongs: Array<object> = [];

    const url: string = 'https://api.spotify.com/v1/search?q=master%2520of%2520puppets&type=track&limit=10&include_external=audio';

    const config: object = {
        headers: {
            'Authorization': `Bearer ${process.env.CLIENT_CREDENTIAL_TOKEN}`
        }
    };

    // axios.get

    return filteredSongs;
}
