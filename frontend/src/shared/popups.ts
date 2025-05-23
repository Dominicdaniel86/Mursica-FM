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
    const popupUpdateElement = document.getElementById('popup-update') as HTMLDivElement;
    popupUpdateElement.style.display = 'flex';
    const updateReason = document.getElementById('popup-update-text') as HTMLDivElement;
    updateReason.innerText = text;
}

export function closePopup(): void {
    const popupUpdateElement = document.getElementById('popup-update') as HTMLDivElement;
    popupUpdateElement.style.display = 'none';
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
