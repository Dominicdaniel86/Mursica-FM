window.addEventListener('load', () => {
    console.log('DOM has loaded!');

    // Reset email and username
    const emailInputElement = document.getElementById('email-input') as HTMLInputElement;
    emailInputElement.value = '';
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    usernameInputElement.value = '';
});

function registration() {
    const emailInputElement = document.getElementById('email-input') as HTMLInputElement;
    const emailInput = emailInputElement.value;
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    const usernameInput = usernameInputElement.value;

    if (emailInput.length === 0 || usernameInput.length === 0) {
        // TODO: Implement better solution than alerting
        // eslint-disable-next-line no-alert
        alert('Invalid credentials!');
    } else {
        window.location.href = '/static/html/add-song.html';
    }
}
