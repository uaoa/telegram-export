# Telegram Chat Export

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![License](https://img.shields.io/github/license/uaoa/telegram-export?style=for-the-badge)](LICENSE)

[![Open App](https://img.shields.io/badge/Open_App-uaoa.github.io-2AABEE?style=for-the-badge&logo=telegram)](https://uaoa.github.io/telegram-export/)

Export your Telegram chats directly from the browser using the official Telegram API.

## Features

- **Direct API Access** — Connect using your own Telegram API credentials (no third-party servers)
- **All Chat Types** — Export personal chats, groups, channels, and forum topics
- **Date Filtering** — Export messages from a specific time period
- **Search** — Quickly find chats by name
- **Three Export Formats:**
  - **HTML** — Beautiful, searchable view for reading
  - **JSON** — Full data export for developers
  - **JSON for AI** — Compact format optimized for AI analysis

## File Analyzer

Already have an exported JSON file? Use the built-in File Analyzer:

- **Instant Trigram Search** — Find messages instantly as you type, powered by trigram indexing
- **Fuzzy Matching** — Finds results even with typos or partial matches
- **Highlighted Results** — Search terms are highlighted in matching messages
- **Multiple Formats** — Works with Telegram Desktop exports, our JSON, and AI-optimized JSON

No API connection needed — just drag and drop your file.

## Quick Start

### Export from Telegram
1. Get your API credentials at [my.telegram.org](https://my.telegram.org)
2. Enter your `api_id` and `api_hash`
3. Log in with your phone number
4. Select a chat and export

### Analyze Existing File
1. Click "Analyze export file"
2. Drop your JSON file
3. Search through messages instantly

## Privacy

All data is processed locally in your browser. Your credentials and messages never leave your device.
