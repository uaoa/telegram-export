import { MessageSquare, Users, User, Hash } from 'lucide-react';
import type { ChatSummary } from '../types/telegram';

interface ChatSelectorProps {
  chats: ChatSummary[];
  onSelectChat: (chatId: number) => void;
  selectedChatId: number | null;
}

export function ChatSelector({ chats, onSelectChat, selectedChatId }: ChatSelectorProps) {
  const getChatIcon = (type: string) => {
    switch (type) {
      case 'personal_chat':
        return <User size={24} />;
      case 'private_group':
      case 'public_group':
        return <Users size={24} />;
      case 'private_channel':
      case 'public_channel':
        return <Hash size={24} />;
      default:
        return <MessageSquare size={24} />;
    }
  };

  const getChatTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      personal_chat: 'Особистий чат',
      private_group: 'Приватна група',
      public_group: 'Публічна група',
      private_channel: 'Приватний канал',
      public_channel: 'Публічний канал',
      saved_messages: 'Збережені повідомлення',
      bot_chat: 'Бот',
    };
    return labels[type] || type;
  };

  const formatDateRange = (from: string, to: string): string => {
    try {
      const fromDate = new Date(from).toLocaleDateString('uk-UA');
      const toDate = new Date(to).toLocaleDateString('uk-UA');
      return `${fromDate} — ${toDate}`;
    } catch {
      return `${from} — ${to}`;
    }
  };

  if (chats.length === 0) {
    return (
      <div className="no-chats">
        <MessageSquare size={48} />
        <p>Чатів не знайдено в експорті</p>
      </div>
    );
  }

  return (
    <div className="chat-selector">
      <h2>Виберіть чат для експорту</h2>
      <p className="chat-count">Знайдено чатів: {chats.length}</p>

      <div className="chat-list">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${selectedChatId === chat.id ? 'selected' : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="chat-icon">{getChatIcon(chat.type)}</div>
            <div className="chat-info">
              <h3 className="chat-name">{chat.name}</h3>
              <span className="chat-type">{getChatTypeLabel(chat.type)}</span>
              <div className="chat-meta">
                <span className="message-count">{chat.messageCount.toLocaleString('uk-UA')} повідомлень</span>
                <span className="date-range">{formatDateRange(chat.dateRange.from, chat.dateRange.to)}</span>
              </div>
            </div>
            <div className="chat-select-indicator">
              {selectedChatId === chat.id && <span className="checkmark">✓</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
