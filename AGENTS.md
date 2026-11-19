
# WhatsApp Translator — Development Guidelines

## Project Overview

WhatsApp Translator is a personal Chrome extension
that translates Brazilian Portuguese messages into
natural, conversational English inside WhatsApp Web.

## Tech Stack

- TypeScript
- Chrome Extension Manifest V3
- Node.js
- esbuild
- Gemini API (planned)
- No Angular or Laravel in the MVP

## Architecture

- src/content: WhatsApp Web DOM integration
- src/background: Extension messaging and orchestration
- src/services: Translation provider integration
- src/types: Shared TypeScript contracts

## Coding Conventions

- Use English for variables, functions and filenames.
- Use camelCase for variables and functions.
- Prefer small functions with clear responsibilities.
- Avoid unnecessary classes and abstractions.
- Keep business logic separate from DOM manipulation.
- Use strict TypeScript typing.
- Avoid unnecessary else statements.

## Functional Requirements

- Detect the active WhatsApp message composer.
- Add a Translate button near the composer.
- Translate Portuguese into natural English.
- Preserve meaning, humor, slang and emojis.
- Never send messages automatically.
- Let users review translations before sending.

## Security

- Never hardcode API keys.
- Never commit credentials.
- Do not store conversation histories.
- Only translate text after explicit user interaction.
- Prefer free-tier APIs.
- Keep API integration isolated for future replacement.

## Development Workflow

- Work incrementally.
- Explain significant architectural decisions.
- Do not introduce new dependencies unnecessarily.
- Run npm run build after implementing changes.
- Do not commit or push without user authorization.