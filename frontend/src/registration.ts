/* eslint-disable no-alert */
export {};

declare global {
    interface Window {
        registration: () => Promise<void>;
    }
}

async function registration() {
    const emailInputElement = document.getElementById('email-input') as HTMLInputElement;
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    const passwordInputElement = document.getElementById('password-input') as HTMLInputElement;

    const emailInput = emailInputElement.value;
    const usernameInput = usernameInputElement.value;
    const passwordInput = passwordInputElement.value;

    if (emailInput.length === 0 || usernameInput.length === 0 || passwordInput.length === 0) {
        // TODO: Implement better solution than alerting
        alert('Please fill out all fields');
        return;
    }

    try {
        const url = '/api/auth/register';
        await axios.post(url, {
            email: emailInput,
            userName: usernameInput,
            password: passwordInput,
        });
        alert('Registration successful! Please verify your email address.');
        // window.location.href = '/static/html/add-song.html';
    } catch (error: any) {
        if (error.response) {
            const status = error.response?.status;
            const message = error.response?.data?.error;

            if (status === 400) {
                alert('Invalid input: ' + message);
            } else if (status === 500) {
                alert('Something went wrong: ' + message);
            } else {
                alert('An unexpected error occurred: ' + message);
            }
        }
    }
}

window.addEventListener('load', () => {
    // Reset email and username
    const emailInputElement = document.getElementById('email-input') as HTMLInputElement;
    emailInputElement.value = '';
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    usernameInputElement.value = '';

    // TODO: Enter key should also trigger the registration
});

window.registration = registration;
