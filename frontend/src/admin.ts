async function spotifyLogin() {

    const api: string = '/api/auth/login';
    const postData: object = {};

    axios.post(api, postData, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error(error);
    });
}
