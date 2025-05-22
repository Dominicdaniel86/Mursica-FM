/* eslint-disable no-alert */
import type { LoginResponse } from './interfaces/login';
import { setCookie } from './shared/cookie-management.js';
import { validateAdmin, validateGuest } from './shared/validations.js';

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

    // TODO: Implement feature to check 100% if input is email or username
    const isEmail = usernameInput.includes('@');

    try {
        const url = '/api/auth/login';
        let body = {};
        if (isEmail) {
            body = { email: usernameInput, password: passwordInput };
        } else {
            body = { username: usernameInput, password: passwordInput };
        }
        const response = await axios.post<LoginResponse>(url, body);
        if (response.status !== 200) {
            alert('Login failed: ' + response.data.message);
            return;
        }
        const token = response.data.token;
        const user = response.data.user.name;
        const email = response.data.user.email;
        setCookie('mursica-fm-admin-token', token, 7); // TODO: Invalidate the token in the backend after 7 days
        if (isEmail) {
            setCookie('mursica-fm-admin-email', usernameInput, 7);
        } else {
            setCookie('mursica-fm-admin-username', usernameInput, 7);
        }
        window.location.href = '/static/html/admin.html';
    } catch (error: any) {
        if (error.response) {
            const status = error.response?.status;
            const message = error.response?.data?.error;

            if (status === 400) {
                alert('Invalid input: ' + message);
            }
            if (status === 403 && message === 'Email not verified') {
                if (confirm('Your email is not verified. Would you like to resend the verification email?')) {
                    try {
                        await axios.post('/api/auth/resend-verification', { username: usernameInput }); // TODO: Allow email as well & let user choose different email
                        alert('Verification email resent. Please check your inbox.');
                    } catch (resendError: any) {
                        alert(
                            'Failed to resend verification email: ' +
                                (resendError.response?.data?.error ?? resendError.message)
                        );
                    }
                }
            } else if (status === 403) {
                alert('Invalid username or password');
            } else {
                console.error('Login error:', error);
                alert('Login failed');
            }
        }
    }
}

window.addEventListener('load', () => {
    // Reset username
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    usernameInputElement.value = '';

    // TODO: Enter key should also trigger login

    // Routing validation
    validateGuest('/static/html/add-song.html');
    validateAdmin('/static/html/admin.html');
});

window.login = login;
