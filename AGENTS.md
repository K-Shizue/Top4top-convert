# Repository Guide

## Runtime

- Use Node.js 20.18.1 or newer: the lockfile resolves `cheerio@1.2.0`, which requires that version even though `package.json` declares no engine.
- Install exactly from the npm lockfile with `npm ci`; start the ESM service with `npm start`. It listens on `PORT`, defaulting to `3000`.
- The conversion path requires `yt-dlp`, `ffmpeg`, `curl`, and outbound access to YouTube, GitHub releases, and `top4top.io`. Docker installs these tools; Nixpacks declares `yt-dlp` and `ffmpeg`.
- `server.js` assumes a Unix-like runtime (`which`, `/tmp`, `chmod`, shell redirection). The checked-in `yt-dlp.exe` is not referenced. Use Linux/Docker for end-to-end conversion unless intentionally making this path portable.
- The Dockerfile exposes `8080`, but the app still defaults to `3000`. Either run with `-p 3000:3000` or set `-e PORT=8080` and map port 8080.

## Structure

- `server.js` is the entire application: inline HTML/CSS/client JavaScript, Express routes, YouTube download strategies, and Top4Top scraping/upload logic. UI changes belong in its `HTML` template.
- `public/` is mounted at the site root with `express.static`; `public/assets/background.mp4` is the fullscreen video used by the inline UI.
- `POST /api/generate` validates an 11-character YouTube ID, queries metadata, tries four `yt-dlp` strategies, uploads the temporary audio through a cookie-backed Top4Top client, resolves a direct media URL, and deletes the selected temporary file.
- Top4Top result extraction depends on remote HTML structure. Preserve the ordered fallbacks in `parseResultUrl` and `resolveDirectUrl` when changing upload handling.

## Verification

- There are no test, lint, format, or typecheck scripts. Run `node --check server.js` as the focused local check.
- For a server smoke test, run `npm start` and request `GET /api/health`; the expected JSON is `{ "ok": true }`.
- Treat `POST /api/generate` as a live integration check: it downloads real media, updates/installs `yt-dlp`, and uploads to an external host. Do not use it as a routine test or assume it is deterministic.
