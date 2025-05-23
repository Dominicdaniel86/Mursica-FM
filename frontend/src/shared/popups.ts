export {};

declare global {
    interface Window {
        openPopup: (reason: string) => void;
        closePopup: () => void;
        openLoading: () => void;
        closeLoading: () => void;
    }
}

export function openPopup(text: string): void {
    const registrationUpdateElement = document.getElementById('registration-update') as HTMLDivElement;
    registrationUpdateElement.style.display = 'flex';
    const updateReason = document.getElementById('registration-update-text') as HTMLDivElement;
    updateReason.innerText = text;
}

export function closePopup(): void {
    const registrationUpdateElement = document.getElementById('registration-update') as HTMLDivElement;
    registrationUpdateElement.style.display = 'none';
}

export function openLoading(): void {
    const loadingElement = document.getElementById('loader') as HTMLDivElement;
    loadingElement.style.display = 'flex';
}

export function closeLoading(): void {
    const loadingElement = document.getElementById('loader') as HTMLDivElement;
    loadingElement.style.display = 'none';
}

window.openPopup = openPopup;
window.closePopup = closePopup;
window.openLoading = openLoading;
window.closeLoading = closeLoading;
