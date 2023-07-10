# Awake

Awake is a Chrome Extension that prevents your computer from going to sleep while downloads are in progress.

## Installation

1. Download and uncompress zip.
2. In Chrome, go to the extensions page at `chrome://extensions/`.
3. Enable Developer Mode.
4. Choose `Load Unpacked` and select the folder.

## Build

1. `npm install` to install the necessary dependencies.
2. Update `version` in `manifest.json`.
3. `npm run build`.

## Usage

Once installed, Awake works mostly passively by automatically activating while a download is in progress and deactivating when all downloads are complete.

- Click the extension icon or use the shortcut (`Ctrl/Command` + `Shift` + `O`) to activate/deactivate Awake.
- Right-click the extension for preferences.