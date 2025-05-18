/* eslint-disable no-alert */
export {};

declare global {
    interface Window {
        login: () => Promise<void>;
    }
}

async function login(): Promise<void> {
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    const passwordInputElement = document.getElementById('password-input') as HTMLInputElement;

    const usernameInput = usernameInputElement.value;
    const passwordInput = passwordInputElement.value;

    if (usernameInput.length === 0 || passwordInput.length === 0) {
        // TODO: Implement better solution than alerting
        alert('Please fill out all fields');
        return;
    }
    // } else {
    //     // window.location.href = '/static/html/add-song.html';
    // }

    try {
        const url = '/api/auth/login';
        await axios.post(url, {
            userName: usernameInput,
            password: passwordInput,
        });
        window.location.href = '/static/html/add-song.html';
    } catch (error: any) {
        if (error.response) {
            const status = error.response?.status;
            const message = error.response?.data?.error;

            if (status === 400 && message === 'Email not verified') {
                if (confirm('Your email is not verified. Would you like to resend the verification email?')) {
                    try {
                        await axios.post('/api/auth/resend-verification', { userName: usernameInput });
                        alert('Verification email resent. Please check your inbox.');
                    } catch (resendError: any) {
                        alert(
                            'Failed to resend verification email: ' +
                                (resendError.response?.data?.error ?? resendError.message)
                        );
                    }
                }
            } else if (status === 400) {
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
    // Reset username
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    usernameInputElement.value = '';
});

window.login = login;
