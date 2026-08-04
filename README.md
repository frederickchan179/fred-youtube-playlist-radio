# Fred YouTube Playlist Radio

Personal local-first radio: import a YouTube playlist as audio + thumbnails, then listen with themed UI and visualizers — no YouTube iframe at playback time.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io)
- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp)
- [`ffmpeg`](https://ffmpeg.org)

## Setup

```bash
pnpm install
```

## Dev

```bash
pnpm dev
```

- UI: http://127.0.0.1:5173  
- API: http://127.0.0.1:8787  

Paste a YouTube playlist URL in the UI and hit **Import**. Progress shows while tracks download.

## CLI (optional)

```bash
pnpm import -- "https://www.youtube.com/playlist?list=PLxxxx"
pnpm sync
```

## Notes

- YouTube is used only as an **import source**. Playback is local files.
- Respect copyright and YouTube ToS — personal private use only.
- Cloud sync / Firebase is intentionally out of scope for now.
