# WhatsApp Translator 🌍

A Chrome extension that translates WhatsApp Web messages from Brazilian Portuguese into natural, conversational English.

## 📖 About

WhatsApp Translator is a personal project designed to make communication with international friends easier.

The extension allows users to write messages in Portuguese and translate them into natural English directly within WhatsApp Web, preserving the original meaning, humor, emojis, and informal expressions.

The goal is to make conversations more fluid without constantly switching between WhatsApp and external translation tools.

## ✨ Features

### Planned for MVP v0.1

- Detect the WhatsApp Web message composer.
- Add a translation button to the interface.
- Translate Brazilian Portuguese messages into natural English.
- Preserve informal expressions, humor, and emojis.
- Replace the original draft with its translation.
- Allow users to review messages before sending.
- Keep translation requests manual.

### Future Improvements

- Translate incoming messages.
- Support additional languages.
- Allow users to customize translation styles.
- Add keyboard shortcuts.
- Improve the extension's user interface.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript | Main programming language |
| Chrome Extension Manifest V3 | Browser integration |
| Node.js | Development environment |
| esbuild | TypeScript bundling |
| Gemini API | AI-powered translation |
| Chrome Storage API | Local configuration |

The initial architecture does not require Angular, Laravel, or a dedicated backend.

## 🏗️ Architecture

The extension follows a modular structure with separated responsibilities.

```text
whatsapp-translator/
├── public/
│   └── manifest.json
├── scripts/
│   └── build.mjs
├── src/
│   ├── background/
│   │   └── index.ts
│   ├── content/
│   │   ├── index.ts
│   │   ├── composer.ts
│   │   └── translateButton.ts
│   ├── services/
│   │   └── translationService.ts
│   └── types/
│       └── translation.ts
├── package.json
├── tsconfig.json
└── README.md
```

Some modules shown above are planned and have not yet been implemented.

### Responsibilities

**Content Scripts**
Interact with the WhatsApp Web interface, identify the message composer, and display translation controls.

**Background Service Worker**
Coordinate extension messages and translation requests.

**Translation Service**
Communicate with the selected translation provider.

**Types**
Define TypeScript contracts used across the application.

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm
- Google Chrome

### Installation

Clone the repository:

```bash
git clone https://github.com/Lucas-Lion/whatsapp-translator.git

cd whatsapp-translator
```

Install dependencies:

```bash
npm install
```

Build the extension:

```bash
npm run build
```

### Load the Extension

1. Open Google Chrome.
2. Navigate to `chrome://extensions`.
3. Enable Developer Mode.
4. Click **Load unpacked**.
5. Select the project's `dist/` directory.
6. Open WhatsApp Web.

The current bootstrap version only initializes the extension and logs a message in the browser console. Translation features are not yet available.

## 🔐 Security and Privacy

- Messages will only be translated when explicitly requested by the user.
- Messages will never be sent automatically.
- The extension will not intentionally store conversation histories.
- API credentials must never be committed to the repository.
- Translation requests will send the selected message text to the translation provider.
- Local API key storage does not provide the same security as a server-side secret.

## 🗺️ Roadmap

- [x] Initialize the project with TypeScript.
- [x] Configure Chrome Extension Manifest V3.
- [x] Configure the build process.
- [x] Validate Content Script execution.
- [ ] Detect the WhatsApp Web message composer.
- [ ] Implement the translation button.
- [ ] Implement draft replacement.
- [ ] Integrate the Gemini API.
- [ ] Configure local API key storage.
- [ ] Handle translation errors and loading states.
- [ ] Validate the complete translation workflow.

## ⚠️ Disclaimer

This is an independent personal project and is not affiliated with, endorsed by, or sponsored by WhatsApp, Meta, or Google.

WhatsApp Web interface changes may affect extension compatibility.

## 📄 License

License to be defined.

---

Developed by [Lucas Lion](https://github.com/Lucas-Lion).