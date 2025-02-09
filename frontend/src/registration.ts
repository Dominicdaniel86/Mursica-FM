window.addEventListener('load', () => {
    console.log('DOM has loaded!');

    // Reset email and username
    let emailInputElement: HTMLInputElement = document.getElementById('email-input') as HTMLInputElement;
    emailInputElement.value = '';
    let usernameInputElement: HTMLInputElement = document.getElementById('username-input') as HTMLInputElement;
    usernameInputElement.value = '';
});

function registration() {
    let emailInputElement: HTMLInputElement = document.getElementById('email-input') as HTMLInputElement;
    let emailInput: string = emailInputElement.value;
    let usernameInputElement: HTMLInputElement = document.getElementById('username-input') as HTMLInputElement;
    let usernameInput: string = usernameInputElement.value;

    if(emailInput.length === 0 || usernameInput.length === 0) {
        alert('Invalid credentials!');
    } else {
        window.location.href = '/static/html/add-song.html';
    }

}
