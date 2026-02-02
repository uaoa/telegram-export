import JSZip from 'jszip';
import type {
  TelegramExport,
  TelegramChat,
  ChatSummary,
  TelegramMessage,
} from '../types/telegram';

export async function parseZipFile(file: File): Promise<TelegramExport | null> {
  try {
    const zip = await JSZip.loadAsync(file);

    // Шукаємо result.json у корені або в підпапках
    let resultJson: JSZip.JSZipObject | undefined;

    zip.forEach((relativePath, zipEntry) => {
      if (relativePath.endsWith('result.json') && !zipEntry.dir) {
        resultJson = zipEntry;
      }
    });

    if (!resultJson) {
      throw new Error('Файл result.json не знайдено в архіві');
    }

    const content = await resultJson.async('string');
    return JSON.parse(content) as TelegramExport;
  } catch (error) {
    console.error('Помилка парсингу ZIP:', error);
    throw error;
  }
}

export async function parseJsonFile(file: File): Promise<TelegramExport | null> {
  try {
    const content = await file.text();
    return JSON.parse(content) as TelegramExport;
  } catch (error) {
    console.error('Помилка парсингу JSON:', error);
    throw error;
  }
}

export function extractChats(data: TelegramExport): TelegramChat[] {
  if (data.chats?.list) {
    return data.chats.list.filter(chat => chat.messages && chat.messages.length > 0);
  }
  return [];
}

export function getChatSummaries(chats: TelegramChat[]): ChatSummary[] {
  return chats.map(chat => {
    const messages = chat.messages || [];
    const dates = messages
      .map(m => m.date)
      .filter(Boolean)
      .sort();

    return {
      name: chat.name || 'Невідомий чат',
      type: chat.type || 'unknown',
      id: chat.id,
      messageCount: messages.length,
      dateRange: {
        from: dates[0] || 'Невідомо',
        to: dates[dates.length - 1] || 'Невідомо',
      },
    };
  });
}

export function getMessageText(message: TelegramMessage): string {
  if (typeof message.text === 'string') {
    return message.text;
  }
  if (Array.isArray(message.text)) {
    return message.text.map(entity => {
      if (typeof entity === 'string') return entity;
      return entity.text || '';
    }).join('');
  }
  return '';
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
