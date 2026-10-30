<h1 align="center">📖 60-Day Quran Khatm</h1>

<p align="center">
  <b>Read and listen to the whole Quran in 60 days: half a juz (one hizb) a day, split into two sittings.</b>
</p>

<p align="center">
  <a href="https://hashrash-dev.github.io/khatm60/"><img src="https://img.shields.io/badge/Live%20Demo-Open%20App-1f6f54?style=for-the-badge&logo=githubpages&logoColor=white" alt="Live demo" /></a>
  <img src="https://img.shields.io/badge/PWA-Installable%20%26%20Offline-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Service%20Worker-Offline%20cache-333333?style=flat-square" alt="Service Worker" />
  <img src="https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-222222?style=flat-square&logo=github" alt="GitHub Pages" />
</p>

<p align="center">
  <img src="docs/screenshot-home.jpg" width="280" alt="Home screen with progress, next sitting and listening settings" />
  &nbsp;&nbsp;
  <img src="docs/screenshot-reader.jpg" width="280" alt="Reader showing a mushaf page with the audio player" />
</p>

---

## ✨ Features

- **Structured 60-day plan**: the 604-page Madani mushaf divided into 60 days × 2 sittings
- **Built-in mushaf pages**: no external page source needed
- **Verse-by-verse recitation** with a choice of reciters, via the [Al Quran Cloud](https://alquran.cloud) API
- **Auto page-follow**: pages turn along with the recitation
- **Playback controls**: speed, verse repeat, and optional Bismillah before each surah
- **Progress tracking** for all 60 days, saved locally on the device (no account needed)
- **Installable PWA**: add to your home screen on Android or iOS; pages you've opened work offline

## 🚀 Getting Started

### Use it
Open **[hashrash-dev.github.io/khatm60](https://hashrash-dev.github.io/khatm60/)** in your browser. On a phone, choose **Install app** (or *Add to Home Screen*) to use it like a native app.

### Run it locally
No build step or dependencies. It's plain HTML, CSS and JavaScript.

```bash
git clone https://github.com/Hashrash-dev/khatm60.git
cd khatm60
python3 -m http.server 8000
# then open http://localhost:8000
```

> A local web server is required (not `file://`) so the service worker and manifest load correctly.

## 🗂️ Project Structure

```
khatm60/
├── index.html             # App shell, layout and styles
├── app.js                 # Reading plan, player, progress tracking
├── sw.js                  # Service worker for offline caching
├── manifest.webmanifest   # PWA metadata (name, icons, theme)
├── icons/                 # App and home-screen icons
├── s/                     # Mushaf page images (WebP)
└── docs/                  # README screenshots
```

## 🛠️ How It Works

| Piece | Role |
|---|---|
| **Reading plan** | Maps each of the 60 days and 2 sittings to its juz, hizb, and page range |
| **Audio** | Streams verse-level recitation from the Al Quran Cloud API for the selected reciter |
| **Storage** | Saves progress and settings in the browser's `localStorage` |
| **Offline** | The service worker caches the app shell and every page you've viewed |

## 🙏 Acknowledgements

- Recitation audio and verse data: [Al Quran Cloud API](https://alquran.cloud)
- Fonts: [Amiri](https://fonts.google.com/specimen/Amiri) and [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts

## 👤 Author

**Hashim Abdul**: [@Hashrash-dev](https://github.com/Hashrash-dev)

If you find this useful, please consider giving the repo a ⭐.
