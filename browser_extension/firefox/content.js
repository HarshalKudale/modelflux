// ModelFlux CORS Helper - Content Script (Firefox)
// Listens for messages from the landing site to confirm extension is installed

const EXTENSION_ID = 'modelflux-cors-helper';
const EXTENSION_VERSION = '1.0.0';

console.log('[ModelFlux Extension] Content script loaded on:', window.location.href);

// Listen for messages from the page
window.addEventListener('message', (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    // Only log relevant messages
    if (event.data && event.data.type && event.data.type.startsWith('LMHUB_')) {
        console.log('[ModelFlux Extension] Received message:', event.data);
    }

    // Check if it's a detection request from LMHub/ModelFlux site
    if (event.data && event.data.type === 'LMHUB_EXTENSION_CHECK') {
        console.log('[ModelFlux Extension] Received extension check request, sending response...');

        // Respond that extension is installed
        const response = {
            type: 'LMHUB_EXTENSION_RESPONSE',
            installed: true,
            id: EXTENSION_ID,
            version: EXTENSION_VERSION,
            browser: 'firefox'
        };

        console.log('[ModelFlux Extension] Sending response:', response);
        window.postMessage(response, '*');
    }
});

console.log('[ModelFlux Extension] Message listener registered');
