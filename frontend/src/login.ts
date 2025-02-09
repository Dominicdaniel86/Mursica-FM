window.addEventListener('load', () => {
    console.log('DOM has loaded!');

    // Reset username
    let usernameInputElement: HTMLInputElement = document.getElementById('username-input') as HTMLInputElement;
    usernameInputElement.value = '';
});

function login() {
    let usernameInputElement: HTMLInputElement = document.getElementById('username-input') as HTMLInputElement;
    let usernameInput: string = usernameInputElement.value;

    if(usernameInput.length === 0) {
        alert('Invalid credentials!');
    } else {
        window.location.href = '/static/html/add-song.html';
    }
}
