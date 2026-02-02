import { saveAs } from 'file-saver';
import type { TelegramMessageData } from '../types/auth';

interface ChatInfo {
  name: string;
  type: string;
  id: string;
}

export function exportChatFromApi(
  chat: ChatInfo,
  messages: TelegramMessageData[],
  format: 'html' | 'json' | 'json-ai'
): void {
  if (format === 'json') {
    exportAsJson(chat, messages);
  } else if (format === 'json-ai') {
    exportAsJsonForAI(chat, messages);
  } else {
    exportAsHtml(chat, messages);
  }
}

function exportAsJson(chat: ChatInfo, messages: TelegramMessageData[]): void {
  const exportData = {
    chat_name: chat.name,
    chat_type: chat.type,
    chat_id: chat.id,
    exported_at: new Date().toISOString(),
    total_messages: messages.length,
    messages: messages.map((msg) => ({
      id: msg.id,
      date: msg.date.toISOString(),
      from: msg.fromName || msg.fromId || 'Невідомий',
      text: msg.text,
      media: msg.media,
      reply_to: msg.replyToMsgId,
      forwarded_from: msg.forwardedFrom,
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json;charset=utf-8',
  });

  const fileName = sanitizeFileName(chat.name) + '_export.json';
  saveAs(blob, fileName);
}

// Компактний формат для аналізу ШІ - мінімум метаданих, максимум контенту
function exportAsJsonForAI(chat: ChatInfo, messages: TelegramMessageData[]): void {
  // Сортуємо повідомлення хронологічно
  const sortedMessages = [...messages].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Форматуємо дату коротко
  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }) + ' ' + date.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Компактний формат: тільки автор, час та текст
  const compactMessages = sortedMessages
    .filter(msg => msg.text.trim()) // Пропускаємо пусті повідомлення
    .map((msg) => {
      const author = msg.fromName || 'Анонім';
      const time = formatShortDate(msg.date);
      const text = msg.text.trim();

      // Додаємо інфо про медіа якщо є
      let mediaNote = '';
      if (msg.media) {
        if (msg.media.type === 'photo') {
          mediaNote = ' [фото]';
        } else if (msg.media.fileName) {
          mediaNote = ` [файл: ${msg.media.fileName}]`;
        } else if (msg.media.type !== 'webpage') {
          mediaNote = ` [${msg.media.type}]`;
        }
      }

      // Позначаємо пересилання
      const fwdNote = msg.forwardedFrom ? ` (переслано від ${msg.forwardedFrom})` : '';

      return {
        t: time,
        a: author,
        m: text + mediaNote + fwdNote,
      };
    });

  const exportData = {
    _info: 'Експорт чату для аналізу ШІ. Поля: t=час, a=автор, m=повідомлення',
    chat: chat.name,
    period: compactMessages.length > 0
      ? `${compactMessages[0].t} — ${compactMessages[compactMessages.length - 1].t}`
      : 'немає повідомлень',
    count: compactMessages.length,
    messages: compactMessages,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json;charset=utf-8',
  });

  const fileName = sanitizeFileName(chat.name) + '_ai.json';
  saveAs(blob, fileName);
}

function exportAsHtml(chat: ChatInfo, messages: TelegramMessageData[]): void {
  const html = generateHtml(chat, messages);
  const blob = new Blob([html], {
    type: 'text/html;charset=utf-8',
  });

  const fileName = sanitizeFileName(chat.name) + '_export.html';
  saveAs(blob, fileName);
}

function generateHtml(chat: ChatInfo, messages: TelegramMessageData[]): string {
  const messagesHtml = messages
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((msg) => generateMessageHtml(msg))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(chat.name)} - Telegram Export</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .header h1 {
      color: #1a1a2e;
      font-size: 24px;
      margin-bottom: 8px;
    }

    .header .meta {
      color: #666;
      font-size: 14px;
    }

    .messages {
      background: white;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .message {
      padding: 12px 16px;
      margin: 8px 0;
      border-radius: 12px;
      background: #f5f7fa;
    }

    .message.service {
      background: #fff3cd;
      text-align: center;
      font-style: italic;
      color: #856404;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .sender {
      font-weight: 600;
      color: #667eea;
    }

    .date {
      color: #999;
      font-size: 12px;
    }

    .text {
      color: #333;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .media-indicator {
      color: #999;
      font-style: italic;
      font-size: 13px;
      margin-top: 4px;
    }

    .forwarded {
      color: #999;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .search-box {
      padding: 12px 16px;
      margin-bottom: 16px;
      border: none;
      border-radius: 8px;
      width: 100%;
      font-size: 14px;
      background: #f5f7fa;
    }

    .search-box:focus {
      outline: 2px solid #667eea;
    }

    @media (max-width: 600px) {
      body {
        padding: 10px;
      }

      .header, .messages {
        border-radius: 12px;
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(chat.name)}</h1>
      <p class="meta">
        Тип: ${escapeHtml(chat.type)} |
        Повідомлень: ${messages.length.toLocaleString('uk-UA')} |
        Експортовано: ${formatDate(new Date())}
      </p>
    </div>

    <div class="messages">
      <input type="text" class="search-box" placeholder="Пошук повідомлень..." onkeyup="filterMessages(this.value)">
      <div id="messages-list">
        ${messagesHtml}
      </div>
    </div>
  </div>

  <script>
    function filterMessages(query) {
      const messages = document.querySelectorAll('.message');
      const lowerQuery = query.toLowerCase();

      messages.forEach(msg => {
        const text = msg.textContent.toLowerCase();
        msg.style.display = text.includes(lowerQuery) ? 'block' : 'none';
      });
    }
  </script>
</body>
</html>`;
}

function generateMessageHtml(message: TelegramMessageData): string {
  let mediaIndicator = '';
  if (message.media) {
    if (message.media.type === 'photo') {
      mediaIndicator = '<div class="media-indicator">[Фото]</div>';
    } else if (message.media.fileName) {
      mediaIndicator = `<div class="media-indicator">[Файл: ${escapeHtml(message.media.fileName)}]</div>`;
    } else {
      mediaIndicator = `<div class="media-indicator">[${escapeHtml(message.media.type)}]</div>`;
    }
  }

  let forwardedIndicator = '';
  if (message.forwardedFrom) {
    forwardedIndicator = `<div class="forwarded">Переслано від: ${escapeHtml(message.forwardedFrom)}</div>`;
  }

  const senderName = message.fromName || message.fromId || 'Невідомий';

  return `
    <div class="message" data-id="${message.id}">
      ${forwardedIndicator}
      <div class="message-header">
        <span class="sender">${escapeHtml(senderName)}</span>
        <span class="date">${formatDate(message.date)}</span>
      </div>
      <div class="text">${escapeHtml(message.text)}</div>
      ${mediaIndicator}
    </div>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(date: Date): string {
  return date.toLocaleString('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}
