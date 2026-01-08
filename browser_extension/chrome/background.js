// ModelFlux CORS Helper - Chrome Extension
// Enables the hosted ModelFlux app to communicate with local LLM services

const HOSTED_APP_URL = 'https://modelflux.io';

chrome.runtime.onInstalled.addListener(() => {
    console.log('ModelFlux CORS Helper installed');
    console.log(`CORS bypass enabled for requests from ${HOSTED_APP_URL} to localhost`);
});
