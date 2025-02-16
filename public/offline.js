// offline.js
function handleRetry() {
    const button = document.getElementById('retryButton');
    const spinner = document.getElementById('loadingSpinner');
    const buttonText = button.querySelector('span');

    button.disabled = true;
    buttonText.textContent = 'Checking Connection...';
    spinner.style.display = 'block';

    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// Check connection status periodically
function checkConnection() {
    if (navigator.onLine) {
        window.location.reload();
    }
}

window.addEventListener('online', checkConnection);
setInterval(checkConnection, 5000);
