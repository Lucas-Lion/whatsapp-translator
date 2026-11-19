# WhatsApp Translator 🌍

A Chrome extension that translates WhatsApp Web messages from Brazilian Portuguese into natural, conversational English.

## 📖 About

WhatsApp Translator is a personal project designed to make communication with international friends easier.

The extension allows users to write messages in Portuguese and translate them into natural English directly within WhatsApp Web, preserving the original meaning, humor, emojis, and informal expressions.

The goal is to make conversations more fluid without constantly switching between WhatsApp and external translation tools.

## ✨ Features

### MVP v0.1

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
│   ├── manifest.json
│   └── options.html
├── scripts/
│   └── build.mjs
├── src/
│   ├── background/
│   │   └── index.ts
│   ├── content/
│   │   ├── index.ts
│   │   ├── composer.ts
│   │   └── translateButton.ts
│   ├── options/
│   │   └── index.ts
│   ├── services/
│   │   └── translationService.ts
│   ├── storage/
│   │   └── apiKey.ts
│   └── types/
│       └── translation.ts
├── package.json
├── tsconfig.json
└── README.md
```

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
- Google Chrome 130 or later

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
6. Open **Extension options** from the extension's **Details** page and save a key from a [Google AI Studio](https://aistudio.google.com/api-keys) project on the free tier.
7. Open or refresh WhatsApp Web, type a draft in Brazilian Portuguese and click **Traduzir**. Review the English draft before sending it manually.

The extension uses `gemini-3.5-flash-lite`. Google lists standard text requests under its [free tier](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite). Model access and quota depend on the project. The extension reports API errors and keeps the configured model.

## 🔐 Security and Privacy

- Messages will only be translated when explicitly requested by the user.
- Messages will never be sent automatically.
- The extension does not store conversation histories.
- API credentials must never be committed to the repository.
- Translation requests send only the current draft to Gemini. Google describes how it handles requests in its [Gemini API terms](https://ai.google.dev/gemini-api/terms).
- The API key is stored locally in the current Chrome profile. Chrome limits access to trusted extension contexts.
- Local API key storage does not provide the same security as a server-side secret.

## 🗺️ Roadmap

- [x] Initialize the project with TypeScript.
- [x] Configure Chrome Extension Manifest V3.
- [x] Configure the build process.
- [x] Validate Content Script execution.
- [x] Detect the WhatsApp Web message composer.
- [x] Implement the translation button.
- [x] Implement draft replacement.
- [x] Integrate the Gemini API.
- [x] Configure local API key storage.
- [x] Handle translation errors and loading states.
- [ ] Validate the complete translation workflow.

## ⚠️ Disclaimer

This is an independent personal project and is not affiliated with, endorsed by, or sponsored by WhatsApp, Meta, or Google.

WhatsApp Web interface changes may affect extension compatibility.

## 📄 License

License to be defined.

---

Developed by [Lucas Lion](https://github.com/Lucas-Lion).
