# DeskSort

**DeskSort** is a tiny desktop app for Windows and macOS that automatically sorts the clutter on your desktop into organized folders — in seconds.

Most people end up with dozens of random files piling up on their desktop: screenshots, downloads, invoices, zip files, code snippets. DeskSort scans your desktop and moves each file into the right folder based on rules you control. You can run it manually whenever you want, or set it to run automatically on a schedule.

It runs as a lightweight native app (under 6 MB), works fully offline, and never touches files outside your desktop.

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-blue)
![Version](https://img.shields.io/github/v/release/yizhang29/Desksort?label=latest)

---

## Quick start

### macOS

**Homebrew**
```bash
brew tap yizhang29/desksort
brew install --cask desksort
```

**Direct download**
1. Go to [Releases](https://github.com/yizhang29/Desksort/releases/latest)
2. Download `DeskSort_0.1.0_universal.dmg`
3. Open the file and drag DeskSort into Applications
4. First launch: right-click the app → **Open** (bypasses the macOS security warning)

### Windows

1. Go to [Releases](https://github.com/yizhang29/Desksort/releases/latest)
2. Download `DeskSort_0.1.0_x64-setup.exe`
3. Run the installer and follow the prompts
4. Find DeskSort in your Start Menu

---

## What it does

- **Organize now** — moves all loose desktop files into sorted folders instantly
- **Dry run** — previews exactly what will move before anything happens
- **Custom rules** — define your own: `.psd → Design/`, `invoice → Finance/`
- **Undo** — every session is logged and can be reversed in one click
- **Auto-schedule** — runs daily, weekly, or on login automatically
- **Clutter score** — a 0–100 score that shows how messy your desktop is

Files are moved into a `DeskSort/` folder on your desktop, organized like this:

```
Desktop/
  DeskSort/
    Images/       ← .jpg .png .gif .webp
    Documents/    ← .pdf .docx .xlsx .txt
    Archives/     ← .zip .rar .7z .tar .gz
    Code/         ← .js .py .rs .html .json
    Videos/       ← .mp4 .mov .mkv
    Other/        ← everything else
```

---

## How to use

1. Open DeskSort — the Dashboard shows your file count and clutter score
2. Click **Dry run** to see a preview of what will be moved
3. Click **Organize now** to sort your desktop
4. Visit **History** anytime to undo a session

To add a custom rule: go to **Rules** in the sidebar → click **Add new rule** → enter a file extension (e.g. `.psd`) or keyword (e.g. `invoice`) and the folder name to move it into.

---

## Build from source

Requires [Rust](https://rustup.rs) and [Tauri CLI v2](https://tauri.app/start/prerequisites/).

```bash
git clone https://github.com/yizhang29/Desksort.git
cd Desksort
cargo tauri dev
```

No `npm install` needed — the frontend is plain HTML, CSS, and JavaScript with no build step.

---

## Tech stack

| | |
|---|---|
| UI | HTML + CSS + Vanilla JS |
| Backend | Rust |
| Framework | Tauri v2 |
| Icons | Tabler Icons |
| CI/CD | GitHub Actions |

---

## License

MIT
