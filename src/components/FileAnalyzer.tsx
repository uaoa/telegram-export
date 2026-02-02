import { useState, useMemo, useCallback, useRef } from 'react';
import { Upload, Search, X, FileJson, MessageSquare, Calendar, User } from 'lucide-react';
import { createSearchIndex, searchIndex, highlightMatches } from '../utils/trigramSearch';

interface Message {
  id: number;
  date: string;
  text: string;
  from?: string;
  from_id?: string;
  reply_to_message_id?: number;
  forwarded_from?: string;
  media_type?: string;
}

interface ParsedChat {
  name: string;
  type?: string;
  messages: Message[];
}

interface FileAnalyzerProps {
  onBack: () => void;
}

export function FileAnalyzer({ onBack }: FileAnalyzerProps) {
  const [chat, setChat] = useState<ParsedChat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Створюємо індекс для пошуку
  const searchIndexMemo = useMemo(() => {
    if (!chat) return null;
    return createSearchIndex(chat.messages, (msg) => {
      const parts = [msg.text];
      if (msg.from) parts.push(msg.from);
      return parts.join(' ');
    });
  }, [chat]);

  // Фільтруємо повідомлення
  const filteredMessages = useMemo(() => {
    if (!chat) return [];
    if (!searchQuery.trim()) return chat.messages;
    if (!searchIndexMemo) return chat.messages;

    return searchIndex(searchIndexMemo, searchQuery, 500);
  }, [chat, searchQuery, searchIndexMemo]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Підтримуємо різні формати
      let parsed: ParsedChat;

      if (data.messages && Array.isArray(data.messages)) {
        // Стандартний формат Telegram Desktop або наш формат
        parsed = {
          name: data.name || data.chat_name || file.name.replace('.json', ''),
          type: data.type || data.chat_type,
          messages: data.messages.map((msg: Record<string, unknown>, idx: number) => ({
            id: msg.id ?? idx,
            date: msg.date || msg.timestamp || '',
            text: extractText(msg),
            from: msg.from || msg.from_name || msg.fromName || msg.actor || msg.a,
            from_id: msg.from_id || msg.fromId,
            reply_to_message_id: msg.reply_to_message_id || msg.replyToMsgId,
            forwarded_from: msg.forwarded_from || msg.forwardedFrom,
            media_type: extractMediaType(msg),
          })),
        };
      } else if (data.chat && Array.isArray(data.messages)) {
        // Наш AI формат
        parsed = {
          name: data.chat,
          messages: data.messages.map((msg: { t: string; a: string; m: string }, idx: number) => ({
            id: idx,
            date: msg.t || '',
            text: msg.m || '',
            from: msg.a || '',
          })),
        };
      } else {
        throw new Error('Невідомий формат файлу');
      }

      // Фільтруємо пусті повідомлення
      parsed.messages = parsed.messages.filter(m => m.text.trim());

      setChat(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка читання файлу');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  if (!chat) {
    return (
      <div className="file-analyzer">
        <div className="analyzer-header">
          <button type="button" className="back-btn" onClick={onBack}>
            ← Назад
          </button>
          <h2>Аналіз файлу експорту</h2>
        </div>

        <div
          className="file-drop-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {isLoading ? (
            <>
              <div className="spinner" />
              <p>Завантаження...</p>
            </>
          ) : (
            <>
              <Upload size={48} />
              <h3>Перетягніть JSON файл сюди</h3>
              <p>або натисніть для вибору</p>
              <div className="supported-formats-list">
                <span><FileJson size={16} /> Telegram Desktop export</span>
                <span><FileJson size={16} /> JSON export</span>
                <span><FileJson size={16} /> JSON для ШІ</span>
              </div>
            </>
          )}

          {error && <p className="error-text">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="file-analyzer">
      <div className="analyzer-header">
        <button type="button" className="back-btn" onClick={onBack}>
          ← Назад
        </button>
        <div className="analyzer-title">
          <h2>{chat.name}</h2>
          <span className="message-count">
            <MessageSquare size={16} />
            {chat.messages.length.toLocaleString('uk-UA')} повідомлень
          </span>
        </div>
        <button
          type="button"
          className="change-file-btn"
          onClick={() => {
            setChat(null);
            setSearchQuery('');
          }}
        >
          Інший файл
        </button>
      </div>

      <div className="search-box large">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Миттєвий пошук по повідомленнях..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          autoFocus
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear"
            onClick={() => setSearchQuery('')}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {searchQuery && (
        <div className="search-results-info">
          Знайдено: {filteredMessages.length.toLocaleString('uk-UA')} повідомлень
        </div>
      )}

      <div className="messages-list">
        {filteredMessages.length === 0 ? (
          <div className="no-results">
            <p>Повідомлень не знайдено</p>
          </div>
        ) : (
          filteredMessages.slice(0, 200).map((msg) => (
            <div key={msg.id} className="message-item">
              <div className="message-header">
                {msg.from && (
                  <span className="message-author">
                    <User size={14} />
                    {msg.from}
                  </span>
                )}
                {msg.date && (
                  <span className="message-date">
                    <Calendar size={14} />
                    {formatDate(msg.date)}
                  </span>
                )}
                {msg.forwarded_from && (
                  <span className="message-forwarded">
                    переслано від {msg.forwarded_from}
                  </span>
                )}
              </div>
              <div
                className="message-text"
                dangerouslySetInnerHTML={{
                  __html: searchQuery
                    ? highlightMatches(msg.text, searchQuery)
                    : escapeHtml(msg.text),
                }}
              />
              {msg.media_type && (
                <span className="message-media">[{msg.media_type}]</span>
              )}
            </div>
          ))
        )}
        {filteredMessages.length > 200 && (
          <div className="more-results">
            Показано перші 200 з {filteredMessages.length.toLocaleString('uk-UA')} результатів.
            Уточніть пошуковий запит.
          </div>
        )}
      </div>
    </div>
  );
}

// Допоміжні функції
function extractText(msg: Record<string, unknown>): string {
  // Текст може бути рядком або масивом (Telegram Desktop format)
  const text = msg.text || msg.message || msg.m || '';

  if (typeof text === 'string') {
    return text;
  }

  if (Array.isArray(text)) {
    return text
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          return (part as { text: string }).text;
        }
        return '';
      })
      .join('');
  }

  return '';
}

function extractMediaType(msg: Record<string, unknown>): string | undefined {
  if (msg.media_type) return msg.media_type as string;
  if (msg.media) {
    const media = msg.media as { type?: string };
    return media.type;
  }
  if (msg.photo) return 'photo';
  if (msg.file) return 'file';
  return undefined;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}
