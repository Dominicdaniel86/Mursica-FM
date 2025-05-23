import { validateAdmin, validateGuest } from './shared/validations.js';
import { closeLoading, openLoading, openPopup } from './shared/popups.js';
import type { AuthenticationReq } from './interfaces/req/auth.js';
import type { BaseRes } from './interfaces/base.js';

export {};

declare global {
    interface Window {
        registration: () => Promise<void>;
    }
}

/**
 * Clears the input fields for email, username, and password.
 * This function is used to reset the input fields after a successful registration.
 */
function emptyInput(): void {
    const emailInputElement = document.getElementById('email-input') as HTMLInputElement;
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    const passwordInputElement = document.getElementById('password-input') as HTMLInputElement;
    emailInputElement.value = '';
    usernameInputElement.value = '';
    passwordInputElement.value = '';
}

/**
 * This function handles the registration process. It collects the input values for email, username, and password,
 * validates them, and sends a registration request to the server. If the registration is successful, it clears the input fields
 * and shows a success message. If there is an error, it shows an appropriate error message.
 *
 */
async function registration() {
    const emailInputElement = document.getElementById('email-input') as HTMLInputElement;
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    const passwordInputElement = document.getElementById('password-input') as HTMLInputElement;

    const emailInput = emailInputElement.value;
    const usernameInput = usernameInputElement.value;
    const passwordInput = passwordInputElement.value;

    if (emailInput.length === 0 || usernameInput.length === 0 || passwordInput.length === 0) {
        openPopup('Registration failed: Please fill in all fields.');
        return;
    }

    try {
        const url = '/api/auth/register';
        const body: AuthenticationReq = {
            username: usernameInput,
            email: emailInput,
            password: passwordInput,
        };
        openLoading();
        const response = await axios.post<BaseRes>(url, body);
        if (response.status !== 200) {
            console.error('Registration failed:', response.data.message, '[status: ' + response.data.code + ']');
            openPopup('Registration failed: Please try again later.');
            return;
        }

        closeLoading();
        openPopup('Registration successful! Please verify your email address.');
        emptyInput();
    } catch (error: any) {
        if (error.response) {
            const status = error.response?.status;
            const message = error.response?.data?.error;

            closeLoading();
            if (status === 400) {
                openPopup('Invalid input: ' + message);
            } else if (status === 409) {
                openPopup('Username or email already taken: ' + message);
            } else {
                openPopup('Something went wrong. Please try again later');
            }
        }
    }
}

window.addEventListener('load', () => {
    // Reset email and username
    emptyInput();

    // Pressing the enter key will trigger the registration
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            void registration();
        }
    });

    // Routing validation
    validateGuest('/static/html/add-song.html');
    validateAdmin('/static/html/admin.html');
});

window.registration = registration;
