# ModelFlux CORS Helper Extension

A lightweight browser extension that enables the hosted ModelFlux web app to communicate with local LLM services (Ollama, LM Studio, etc.) by bypassing CORS restrictions.

## How It Works

The extension intercepts requests from `app.modelflux.io` to `localhost` and:
1. Removes the `Origin` header from requests
2. Adds permissive CORS headers to responses

## Files

```
web/
├── chrome/
│   ├── manifest.json    # Manifest V3
│   ├── background.js    # Service worker
│   └── rules.json       # declarativeNetRequest rules
├── firefox/
│   ├── manifest.json    # Manifest V2
│   └── background.js    # webRequest handler
├── icons/               # Extension icons
├── build.js             # Build script
└── package.json
```

## Build

```bash
cd web
npm install
npm run build:all
```

**Output:** `dist/modelflux-cors-helper-chrome.zip` (~10KB) and `dist/modelflux-cors-helper-firefox.zip`

## Configuration

Update the URL in:
- `chrome/rules.json` → `initiatorDomains`
- `chrome/background.js` → `HOSTED_APP_URL`
- `firefox/background.js` → `HOSTED_APP_URL`
