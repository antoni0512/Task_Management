# PERT Atlas — Electron quick start

This web app ships with a ready-to-run Electron wrapper located in `frontend/electron/`.

## Run as a desktop app (on your local machine)

```bash
cd frontend
yarn install
# adds electron-related devDependencies if not already installed:
yarn add -D electron concurrently wait-on cross-env

# Dev mode (loads CRA dev server at http://localhost:3000):
yarn start            # in terminal 1
# terminal 2:
ELECTRON_START_URL=http://localhost:3000 npx electron electron/main.js

# Production build (loads frontend/build/index.html):
yarn build
npx electron electron/main.js
```

Attachments are saved under your OS user-data folder (Electron's
`app.getPath('userData')/attachments/<PERT-ID>/`), so they persist across
restarts and are scoped per task regardless of whether the upstream
title changes.

> In the hosted web preview there is no Electron runtime available, so the same
> code automatically falls back to IndexedDB storage.
