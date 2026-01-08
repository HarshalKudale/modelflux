// ModelFlux CORS Helper - Firefox Extension
// Enables the hosted ModelFlux app to communicate with local LLM services

const HOSTED_APP_URL = 'modelflux.io';

const LOCALHOST_PATTERNS = [
    '*://localhost/*',
    '*://127.0.0.1/*'
];

// Only process requests from the hosted app
function isFromHostedApp(details) {
    if (!details.originUrl) return false;
    try {
        const url = new URL(details.originUrl);
        return url.hostname === HOSTED_APP_URL || url.hostname.endsWith('.' + HOSTED_APP_URL);
    } catch {
        return false;
    }
}

// Modify request headers to remove Origin (prevents CORS check)
browser.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (!isFromHostedApp(details)) {
            return { requestHeaders: details.requestHeaders };
        }

        const requestHeaders = details.requestHeaders.filter(
            header => header.name.toLowerCase() !== 'origin'
        );
        return { requestHeaders };
    },
    { urls: LOCALHOST_PATTERNS },
    ['blocking', 'requestHeaders']
);

// Modify response headers to allow CORS
browser.webRequest.onHeadersReceived.addListener(
    (details) => {
        if (!isFromHostedApp(details)) {
            return { responseHeaders: details.responseHeaders };
        }

        const responseHeaders = details.responseHeaders || [];

        // Remove existing CORS headers to avoid conflicts
        const filteredHeaders = responseHeaders.filter(
            header => !header.name.toLowerCase().startsWith('access-control-')
        );

        // Add permissive CORS headers
        filteredHeaders.push(
            { name: 'Access-Control-Allow-Origin', value: '*' },
            { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD' },
            { name: 'Access-Control-Allow-Headers', value: '*' },
            { name: 'Access-Control-Allow-Credentials', value: 'true' },
            { name: 'Access-Control-Max-Age', value: '86400' },
            { name: 'Access-Control-Expose-Headers', value: '*' }
        );

        return { responseHeaders: filteredHeaders };
    },
    { urls: LOCALHOST_PATTERNS },
    ['blocking', 'responseHeaders']
);

console.log('ModelFlux CORS Helper loaded');
console.log(`CORS bypass enabled for requests from ${HOSTED_APP_URL} to localhost`);
