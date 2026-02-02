import { useState, useMemo } from 'react';
import { MessageSquare, Users, User, Hash, RefreshCw, Search, X } from 'lucide-react';
import type { TelegramDialog } from '../types/auth';

export type DialogLimit = 50 | 100 | 200 | 500 | 'all';

interface DialogSelectorProps {
  dialogs: TelegramDialog[];
  onSelectDialog: (dialog: TelegramDialog) => void;
  selectedDialogId: string | null;
  isLoading: boolean;
  onRefresh: (limit: DialogLimit) => void;
  currentLimit: DialogLimit;
}

export function DialogSelector({
  dialogs,
  onSelectDialog,
  selectedDialogId,
  isLoading,
  onRefresh,
  currentLimit,
}: DialogSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDialogs = useMemo(() => {
    if (!searchQuery.trim()) return dialogs;
    const query = searchQuery.toLowerCase();
    return dialogs.filter((dialog) =>
      dialog.name.toLowerCase().includes(query)
    );
  }, [dialogs, searchQuery]);

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

  const getTypeLabel = (dialog: TelegramDialog): string => {
    const labels: Record<TelegramDialog['type'], string> = {
      user: 'Особистий чат',
      group: 'Група',
      channel: 'Канал',
      chat: 'Чат',
    };
    let label = labels[dialog.type] || dialog.type;
    if (dialog.isForum) {
      label += ' (форум)';
    }
    return label;
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

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Показуємо спіннер тільки якщо немає чатів і йде завантаження
  if (isLoading && dialogs.length === 0) {
    return (
      <div className="dialog-selector loading">
        <div className="spinner" />
        <p>Завантаження чатів...</p>
      </div>
    );
  }

  const limitOptions: { value: DialogLimit; label: string }[] = [
    { value: 50, label: '50' },
    { value: 100, label: '100' },
    { value: 200, label: '200' },
    { value: 500, label: '500' },
    { value: 'all', label: 'Всі' },
  ];

  const handleLimitChange = (newLimit: DialogLimit) => {
    if (newLimit !== currentLimit) {
      onRefresh(newLimit);
    }
  };

  if (dialogs.length === 0 && !isLoading) {
    return (
      <div className="no-chats">
        <MessageSquare size={48} />
        <p>Чатів не знайдено</p>
        <button type="button" className="refresh-btn" onClick={() => onRefresh(currentLimit)}>
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
          <p className="chat-count">
            {isLoading ? 'Завантаження...' : `Знайдено чатів: ${dialogs.length}`}
          </p>
        </div>
        <div className="header-actions">
          <div className="limit-selector">
            <span className="limit-label">Показати:</span>
            <div className="limit-buttons">
              {limitOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`limit-btn ${currentLimit === option.value ? 'active' : ''}`}
                  onClick={() => handleLimitChange(option.value)}
                  disabled={isLoading}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="refresh-btn"
            onClick={() => onRefresh(currentLimit)}
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Пошук чатів..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
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

      {searchQuery && filteredDialogs.length === 0 && (
        <div className="no-results">
          <p>Чатів не знайдено за запитом "{searchQuery}"</p>
        </div>
      )}

      <div className="chat-list">
        {filteredDialogs.map((dialog) => (
          <div
            key={dialog.id}
            className={`chat-item ${selectedDialogId === dialog.id ? 'selected' : ''}`}
            onClick={() => onSelectDialog(dialog)}
          >
            {dialog.photoUrl ? (
              <img
                src={dialog.photoUrl}
                alt={dialog.name}
                className="chat-avatar"
              />
            ) : (
              <div className="chat-icon">{getDialogIcon(dialog.type)}</div>
            )}
            <div className="chat-info">
              <h3 className="chat-name">{dialog.name}</h3>
              <div className="chat-type-row">
                <span className="chat-type">{getTypeLabel(dialog)}</span>
                {dialog.messagesCount !== undefined && dialog.messagesCount > 0 && (
                  <span className="members-count">
                    <Users size={12} />
                    {formatNumber(dialog.messagesCount)}
                  </span>
                )}
              </div>
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
