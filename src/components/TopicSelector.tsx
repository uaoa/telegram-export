import { MessageSquare, ChevronRight, Users, Hash } from 'lucide-react';
import type { ForumTopic } from '../types/auth';

interface TopicSelectorProps {
  topics: ForumTopic[];
  onSelectTopic: (topic: ForumTopic | null) => void;
  selectedTopicId: number | null;
  isLoading: boolean;
  chatName: string;
  chatPhotoUrl?: string;
  onExportAll: () => void;
}

export function TopicSelector({
  topics,
  onSelectTopic,
  selectedTopicId,
  isLoading,
  chatName,
  chatPhotoUrl,
  onExportAll,
}: TopicSelectorProps) {
  if (isLoading) {
    return (
      <div className="topic-selector loading">
        <div className="spinner" />
        <p>Завантаження топіків...</p>
      </div>
    );
  }

  // Кольори топіків Telegram
  const getTopicColor = (colorId?: number) => {
    const colors: Record<number, string> = {
      0: '#6FB9F0', // блакитний
      1: '#FFD67E', // жовтий
      2: '#CB86DB', // фіолетовий
      3: '#8EEE98', // зелений
      4: '#FF93B2', // рожевий
      5: '#FB6F5F', // червоний
      6: '#FFD67E', // жовтий (дублікат)
    };
    return colors[colorId ?? 0] || colors[0];
  };

  // Емоджі для топіків на основі кольору
  const getTopicEmoji = (colorId?: number) => {
    const emojis: Record<number, string> = {
      0: '💬', // блакитний
      1: '⭐', // жовтий
      2: '💜', // фіолетовий
      3: '💚', // зелений
      4: '💖', // рожевий
      5: '🔥', // червоний
      6: '✨', // жовтий
    };
    return emojis[colorId ?? 0] || '💬';
  };

  // Перевіряємо чи це "General" топік (id = 1)
  const isGeneralTopic = (topicId: number) => topicId === 1;

  return (
    <div className="topic-selector">
      <div className="topic-selector-header">
        <div className="topic-chat-info">
          {chatPhotoUrl ? (
            <img src={chatPhotoUrl} alt={chatName} className="topic-chat-avatar" />
          ) : (
            <div className="topic-chat-icon">
              <Users size={24} />
            </div>
          )}
          <div>
            <h2>Топіки в "{chatName}"</h2>
            <p className="topic-count">
              {topics.length} {topics.length === 1 ? 'топік' : topics.length < 5 ? 'топіки' : 'топіків'}
            </p>
          </div>
        </div>
      </div>

      <div className="topic-list">
        <div
          className={`topic-item export-all ${selectedTopicId === null ? 'selected' : ''}`}
          onClick={onExportAll}
        >
          <div className="topic-icon all">
            <MessageSquare size={20} />
          </div>
          <div className="topic-info">
            <span className="topic-name">Експортувати весь чат</span>
            <span className="topic-hint">Всі повідомлення з усіх топіків</span>
          </div>
          <ChevronRight size={20} className="topic-arrow" />
        </div>

        {topics.map((topic) => (
          <div
            key={topic.id}
            className={`topic-item ${selectedTopicId === topic.id ? 'selected' : ''}`}
            onClick={() => onSelectTopic(topic)}
          >
            <div
              className="topic-icon"
              style={{ backgroundColor: getTopicColor(topic.iconColor) }}
            >
              {isGeneralTopic(topic.id) ? (
                <Hash size={20} />
              ) : (
                <span className="topic-emoji">{getTopicEmoji(topic.iconColor)}</span>
              )}
            </div>
            <div className="topic-info">
              <span className="topic-name">{topic.title}</span>
              {topic.creationDate && (
                <span className="topic-date">
                  Створено: {topic.creationDate.toLocaleDateString('uk-UA')}
                </span>
              )}
            </div>
            <ChevronRight size={20} className="topic-arrow" />
          </div>
        ))}
      </div>
    </div>
  );
}
