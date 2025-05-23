/* eslint-disable no-alert */
import type { BaseRes } from './interfaces/base';
import type { AuthenticationReq } from './interfaces/req/auth';
import type { AuthenticationRes } from './interfaces/res/auth';
import { CookieList, setCookie } from './shared/cookie-management.js';
import { closeLoading, closePopup, openLoading, openPopup } from './shared/popups.js';
import { validateAdmin, validateGuest } from './shared/validations.js';

declare global {
    interface Window {
        login: () => Promise<void>;
        resendEmailInit: () => Promise<void>;
        resendEmail: () => Promise<void>;
    }
}

// Global variables
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function closeAllPopups(): void {
    const popupUpdateElement = document.getElementById('popup-update') as HTMLDivElement;
    popupUpdateElement.style.display = 'none';
    const resendEmailElement = document.getElementById('popup-request-resend') as HTMLDivElement;
    resendEmailElement.style.display = 'none';
    const emailInputSection = document.getElementById('popup-resend-email') as HTMLDivElement;
    emailInputSection.style.display = 'none';
    closePopup();
}

function emptyInput(): void {
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    const passwordInputElement = document.getElementById('password-input') as HTMLInputElement;
    const emailInputElement = document.getElementById('email-input') as HTMLInputElement;
    usernameInputElement.value = '';
    passwordInputElement.value = '';
    emailInputElement.value = '';
}

async function login(): Promise<void> {
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    const passwordInputElement = document.getElementById('password-input') as HTMLInputElement;

    const usernameInput = usernameInputElement.value;
    const passwordInput = passwordInputElement.value;

    if (usernameInput.length === 0 || passwordInput.length === 0) {
        openPopup('Login failed: Please fill in all fields.');
        return;
    }

    // Check if the input is an email address
    let isEmail = false;
    if (emailRegex.test(usernameInput)) {
        isEmail = true;
    }

    try {
        const url = '/api/auth/login';
        let body: AuthenticationReq;
        if (isEmail) {
            body = { email: usernameInput, password: passwordInput };
        } else {
            body = { username: usernameInput, password: passwordInput };
        }
        const response = await axios.post<AuthenticationRes>(url, body);
        if (response.status !== 200) {
            // ? Should normall never happen
            openPopup('Login failed: ' + response.data.message);
            return;
        }
        const token = response.data.token;
        const user = response.data.user;
        setCookie(CookieList.ADMIN_TOKEN, token, 7); // TODO: Invalidate the token in the backend after 7 days
        setCookie(CookieList.ADMIN_EMAIL, user.email, 7);
        setCookie(CookieList.ADMIN_USERNAME, user.username, 7);

        window.location.href = '/static/html/admin.html';
    } catch (error: any) {
        if (error.response) {
            closeAllPopups();
            const status = error.response?.status;
            const message = error.response?.data?.error;
            if (status === 400) {
                openPopup('Invalid input: ' + message);
            } else if (status === 403 && message === 'Email not verified') {
                openPopup('Your email is not verified. Please check your inbox for a verification link.');
                const resendEmailElement = document.getElementById('popup-request-resend');
                if (resendEmailElement) {
                    resendEmailElement.style.display = 'unset';
                }
            } else if (status === 403 || status === 404) {
                openPopup('Invalid username or password');
            } else {
                console.error('Login error:', error);
                openPopup('Login failed due to an unknown error. Please try again later.');
            }
        }
    }
}

async function resendEmailInit() {
    closeAllPopups();

    openPopup('Enter your email address to resend the verification email.');
    const emailInputSection = document.getElementById('popup-resend-email');
    if (emailInputSection) {
        emailInputSection.style.display = 'unset';
    }
    const emailInputElement = document.getElementById('email-input') as HTMLInputElement;
    const usernameInputElement = document.getElementById('username-input') as HTMLInputElement;
    if (usernameInputElement && emailInputElement) {
        if (emailRegex.test(usernameInputElement.value)) {
            emailInputElement.value = usernameInputElement.value;
        }
    }
}

async function resendEmail(): Promise<void> {
    closeAllPopups();

    openLoading();

    try {
        const body: AuthenticationReq = {
            email: (document.getElementById('email-input') as HTMLInputElement).value,
            username: (document.getElementById('username-input') as HTMLInputElement).value,
            password: (document.getElementById('password-input') as HTMLInputElement).value,
        };
        await axios.post<BaseRes>('/api/auth/resend-verification', body);
        openPopup('Email verification link sent. Please check your inbox.');
    } catch (error: any) {
        if (error.response) {
            const message = error.response?.data?.error;
            console.error('Resend email error:', error.response);
            openPopup('Failed to resend verification email: ' + message);
        } else {
            console.error('Resend email error:', error);
            openPopup('Failed to resend verification email due to an unknown error. Please try again later.');
        }
    }

    closeLoading();
}

window.addEventListener('load', () => {
    // Reset input fields
    emptyInput();

    // Pressing the enter key will trigger the login
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            void login();
        }
    });

    // Routing validation
    validateGuest('/static/html/add-song.html');
    validateAdmin('/static/html/admin.html');
});

window.login = login;
window.resendEmailInit = resendEmailInit;
window.resendEmail = resendEmail;
