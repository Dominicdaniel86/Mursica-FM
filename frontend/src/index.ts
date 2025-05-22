/* eslint-disable no-alert */
import type { GuestJoinResponse } from './interfaces/login';
import { setCookie } from './shared/cookie-management.js';
import { validateAdmin, validateGuest } from './shared/validations.js';

export {};

declare global {
    interface Window {
        joinSession: () => Promise<void>;
    }
}

// Global variables
let previousChars = 0;

/**
 * Validates the session ID input field.
 * The session ID should be in the format #XXX-XXX, where X is a letter or digit.
 * The function formats the input as the user types and manages the cursor position.
 *
 * @param {HTMLInputElement} sessionIDInputElement - The input element for the session ID.
 */
function sessionIDInputValidation(sessionIDInputElement: HTMLInputElement) {
    // Read required input
    const rawValue = sessionIDInputElement.value.replace(/[^a-zA-Z0-9]/g, '');
    let resultingValue = '#';
    const selectionStart = sessionIDInputElement.selectionStart ?? 0;
    let newCursorPos = selectionStart;

    // Calculate new value and curser position
    switch (rawValue.length) {
        case 1:
        case 2:
        case 3:
            // Input has 1-3 chars
            resultingValue += rawValue;
            if (selectionStart === 1) {
                newCursorPos++;
            }
            break;
        case 4:
        case 5:
        case 6:
            // Input has 4-6 chars
            resultingValue += rawValue.slice(0, 3) + '-' + rawValue.slice(3, 6);
            if (selectionStart === 1) {
                // Deals with writes before the #
                newCursorPos++;
            }
            if (selectionStart === 5 && previousChars < 6) {
                // Deals with writes before the -
                newCursorPos++;
            }
            break;
        case 7:
            // Input has overflowing characters
            if (selectionStart === 1) {
                // Writes before the # (should be ignored)
                resultingValue += rawValue.slice(1, 4) + '-' + rawValue.slice(4);
            } else if (selectionStart < 5) {
                // Writes between # and - (overwrites value)
                resultingValue += rawValue.slice(0, selectionStart - 1);
                resultingValue += rawValue.slice(selectionStart);
                resultingValue = resultingValue.slice(0, 4) + '-' + resultingValue.slice(4);
                if (selectionStart === 4) {
                    // Skip the -
                    newCursorPos++;
                }
            } else if (selectionStart === 5) {
                // Writes before the - (should be ignored)
                resultingValue += rawValue.slice(0, 3) + '-' + rawValue.slice(4);
            } else if (selectionStart < 9) {
                // Writes after the -
                resultingValue += rawValue.slice(0, selectionStart - 2);
                resultingValue += rawValue.slice(selectionStart - 1);
                resultingValue = resultingValue.slice(0, 4) + '-' + resultingValue.slice(4, 7);
            } else {
                // Writes that would be too long
                resultingValue += rawValue.slice(0, 3) + '-' + rawValue.slice(3, 6);
            }
            break;
        default:
            // empty input
            resultingValue = '';
    }

    // Set new values
    previousChars = rawValue.length;
    sessionIDInputElement.value = resultingValue.toUpperCase();
    sessionIDInputElement.setSelectionRange(newCursorPos, newCursorPos);
}

// TODO: Implement this function
/**
 * Joins a session with the given session ID.
 * The session ID is validated and if valid, the user is redirected to the add-song page.
 */
async function joinSession() {
    const sessionIDInputElement = document.getElementById('session-id-input') as HTMLInputElement;
    const guestNameInputElement = document.getElementById('username-input') as HTMLInputElement;
    // const sessionId = sessionIDInputElement.value.replace(/[^a-zA-Z0-9]/g, '');
    const sessionId = sessionIDInputElement.value;
    const guestName = guestNameInputElement.value;

    const body = {
        sessionId,
        username: guestName,
    };

    try {
        // Check if the session ID is valid
        if (sessionId.length !== 8) {
            // eslint-disable-next-line no-alert
            alert('Session-ID invalid!');
            return;
        }
        const result = await axios.post<GuestJoinResponse>('/api/guest/join', body);
        if (result.status !== 200) {
            // eslint-disable-next-line no-alert
            alert(result.data.message);
            return;
        }
        console.log('Session joined successfully:', result.data);
        // TODO: Use Enums for the cookies
        setCookie('mursica-fm-guest-token', result.data.guestToken, 7);
        setCookie('mursica-fm-guest-username', result.data.username, 7);
        setCookie('mursica-fm-guest-session-id', result.data.sessionId, 7);
    } catch (error: any) {
        if (error.response) {
            const status = error.response?.status;
            const message = error.response?.data?.error;

            if (status === 400) {
                alert('The input is invalid. Please check the session ID and try again.');
            } else if (status === 404) {
                alert('Invalid session ID');
            } else if (status === 409) {
                alert('Username already taken');
            }
            console.error('Error joining session:', status, message);
            return;
        }
        alert('Something went wrong. Please try again later.');
        return;
    }

    // TODO: Save cookies and stuff
    window.location.href = '/static/html/add-song.html';
}

window.addEventListener('load', () => {
    // Reset session-id value
    const sessionIDInputElement = document.getElementById('session-id-input') as HTMLInputElement;
    sessionIDInputElement.value = '';

    // Custom behaviour of the session-id-input Element
    sessionIDInputElement.addEventListener('input', () => {
        sessionIDInputValidation(sessionIDInputElement);
    });

    // Routing validation
    validateGuest('/static/html/add-song.html');
    validateAdmin('/static/html/admin.html');
});

window.joinSession = joinSession;
