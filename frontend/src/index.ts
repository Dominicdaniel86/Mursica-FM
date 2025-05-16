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

window.addEventListener('load', () => {
    // Reset session-id value
    const sessionIDInputElement = document.getElementById('session-id-input') as HTMLInputElement;
    sessionIDInputElement.value = '';

    // Custom behaviour of the session-id-input Element
    sessionIDInputElement.addEventListener('input', () => {
        sessionIDInputValidation(sessionIDInputElement);
    });
});

// TODO: Implement and use this function
/**
 * Joins a session with the given session ID.
 * The session ID is validated and if valid, the user is redirected to the add-song page.
 */
function joinSession() {
    const sessionIDInputElement = document.getElementById('session-id-input') as HTMLInputElement;
    const sessionID = sessionIDInputElement.value.replace(/[^a-zA-Z0-9]/g, '');

    if (sessionID.length !== 6) {
        // TODO: Implement better solution than alerting
        // eslint-disable-next-line no-alert
        alert('Session-ID invalid!');
    } else {
        window.location.href = '/static/html/add-song.html';
    }
}
