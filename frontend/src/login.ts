export {};

declare global {
    interface Window {
        login: () => void;
    }
}

function login(): void {
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    const usernameInput = usernameInputElement.value ?? '';

    if (usernameInput.length === 0) {
        // TODO: Implement better solution than alerting
        // eslint-disable-next-line no-alert
        alert('Invalid credentials!');
    } else {
        window.location.href = '/static/html/add-song.html';
    }
}

window.addEventListener('load', () => {
    // Reset username
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    usernameInputElement.value = '';
});

window.login = login;
