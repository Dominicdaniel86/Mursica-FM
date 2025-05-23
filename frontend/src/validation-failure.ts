window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
        const message = decodeURIComponent(error);
        document.getElementById('error-message')!.innerText = message;
        document.getElementById('error-message')!.style.display = 'block';
        if (message === 'Your email is already verified. You can log in now.') {
            setTimeout(() => {
                window.location.href = `${window.location.origin}/static/html/login.html`;
            }, 3000);
        }
    } else {
        document.getElementById('error-message')!.innerText = 'Email could not be verified. An unknown error occurred.';
        document.getElementById('error-message')!.style.display = 'block';
    }
});
