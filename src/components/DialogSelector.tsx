import { MessageSquare, Users, User, Hash, RefreshCw } from 'lucide-react';
import type { TelegramDialog } from '../types/auth';

interface DialogSelectorProps {
  dialogs: TelegramDialog[];
  onSelectDialog: (dialog: TelegramDialog) => void;
  selectedDialogId: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function DialogSelector({
  dialogs,
  onSelectDialog,
  selectedDialogId,
  isLoading,
  onRefresh,
}: DialogSelectorProps) {
  const getDialogIcon = (type: TelegramDialog['type']) => {
    switch (type) {
      case 'user':
        return <User size={24} />;
      case 'group':
        return <Users size={24} />;
      case 'channel':
        return <Hash size={24} />;
      default:
        return <MessageSquare size={24} />;
    }
  };

  const getTypeLabel = (type: TelegramDialog['type']): string => {
    const labels: Record<TelegramDialog['type'], string> = {
      user: 'Особистий чат',
      group: 'Група',
      channel: 'Канал',
      chat: 'Чат',
    };
    return labels[type] || type;
  };

  const formatDate = (date?: Date): string => {
    if (!date) return '';
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
    });
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="dialog-selector loading">
        <div className="spinner" />
        <p>Завантаження чатів...</p>
      </div>
    );
  }

  if (dialogs.length === 0) {
    return (
      <div className="no-chats">
        <MessageSquare size={48} />
        <p>Чатів не знайдено</p>
        <button type="button" className="refresh-btn" onClick={onRefresh}>
          <RefreshCw size={18} />
          Оновити
        </button>
      </div>
    );
  }

  return (
    <div className="chat-selector">
      <div className="chat-selector-header">
        <div>
          <h2>Виберіть чат для експорту</h2>
          <p className="chat-count">Знайдено чатів: {dialogs.length}</p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="chat-list">
        {dialogs.map((dialog) => (
          <div
            key={dialog.id}
            className={`chat-item ${selectedDialogId === dialog.id ? 'selected' : ''}`}
            onClick={() => onSelectDialog(dialog)}
          >
            <div className="chat-icon">{getDialogIcon(dialog.type)}</div>
            <div className="chat-info">
              <h3 className="chat-name">{dialog.name}</h3>
              <span className="chat-type">{getTypeLabel(dialog.type)}</span>
              {dialog.lastMessage && (
                <p className="last-message">
                  {truncateText(dialog.lastMessage, 50)}
                </p>
              )}
              <div className="chat-meta">
                {dialog.unreadCount > 0 && (
                  <span className="unread-count">{dialog.unreadCount} нових</span>
                )}
                {dialog.lastMessageDate && (
                  <span className="date">{formatDate(dialog.lastMessageDate)}</span>
                )}
              </div>
            </div>
            <div className="chat-select-indicator">
              {selectedDialogId === dialog.id && (
                <span className="checkmark">✓</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
