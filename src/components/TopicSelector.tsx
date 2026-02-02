import { MessageSquare, ChevronRight } from 'lucide-react';
import type { ForumTopic } from '../types/auth';

interface TopicSelectorProps {
  topics: ForumTopic[];
  onSelectTopic: (topic: ForumTopic | null) => void;
  selectedTopicId: number | null;
  isLoading: boolean;
  chatName: string;
  onExportAll: () => void;
}

export function TopicSelector({
  topics,
  onSelectTopic,
  selectedTopicId,
  isLoading,
  chatName,
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

  const getTopicColor = (colorId?: number) => {
    const colors: Record<number, string> = {
      0: '#6FB9F0',
      1: '#FFD67E',
      2: '#CB86DB',
      3: '#8EEE98',
      4: '#FF93B2',
      5: '#FB6F5F',
      6: '#FFD67E',
    };
    return colors[colorId || 0] || colors[0];
  };

  return (
    <div className="topic-selector">
      <div className="topic-selector-header">
        <h2>Топіки в "{chatName}"</h2>
        <p className="topic-count">
          {topics.length} {topics.length === 1 ? 'топік' : topics.length < 5 ? 'топіки' : 'топіків'}
        </p>
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
              {topic.iconEmojiId ? (
                <span className="topic-emoji">{topic.iconEmojiId}</span>
              ) : (
                <MessageSquare size={20} />
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
