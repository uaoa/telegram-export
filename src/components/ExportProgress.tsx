import { AlertCircle, Bot, CheckCircle, Download, Image, X } from 'lucide-react';
import type { ExportState } from '../types/auth';

interface ExportProgressProps {
  state: ExportState;
  chatName: string;
  onCancel: () => void;
  onExport: (format: 'html' | 'json' | 'json-ai') => void;
}

export function ExportProgress({
  state,
  chatName,
  onCancel,
  onExport,
}: ExportProgressProps) {
  const progress =
    state.totalMessages > 0
      ? Math.round((state.exportedMessages / state.totalMessages) * 100)
      : 0;

  const mediaProgress =
    state.mediaProgress && state.mediaProgress.total > 0
      ? Math.round((state.mediaProgress.current / state.mediaProgress.total) * 100)
      : 0;

  const getPhaseTitle = () => {
    switch (state.currentPhase) {
      case 'done':
        return 'Експорт завершено!';
      case 'error':
        return 'Помилка експорту';
      case 'downloading_media':
        return 'Завантажую медіа';
      default:
        return 'Експортую чат';
    }
  };

  return (
    <div className="export-progress">
      <h2>{getPhaseTitle()}</h2>

      <div className="export-chat-name">{chatName}</div>

      {(state.currentPhase === 'fetching' ||
        state.currentPhase === 'processing') && (
        <>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="progress-stats">
            <span>
              {state.exportedMessages.toLocaleString('uk-UA')} /{' '}
              {state.totalMessages > 0
                ? state.totalMessages.toLocaleString('uk-UA')
                : '?'}{' '}
              повідомлень
            </span>
            <span>{progress}%</span>
          </div>

          <p className="progress-hint">
            {state.currentPhase === 'fetching'
              ? 'Завантажую повідомлення з Telegram...'
              : 'Обробляю дані...'}
          </p>

          <button type="button" className="cancel-btn" onClick={onCancel}>
            <X size={18} />
            Скасувати
          </button>
        </>
      )}

      {state.currentPhase === 'downloading_media' && state.mediaProgress && (
        <>
          <div className="media-progress-indicator">
            <Image size={24} />
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill media"
              style={{ width: `${mediaProgress}%` }}
            />
          </div>

          <div className="progress-stats">
            <span>
              {state.mediaProgress.current.toLocaleString('uk-UA')} /{' '}
              {state.mediaProgress.total.toLocaleString('uk-UA')}{' '}
              фото
            </span>
            <span>{mediaProgress}%</span>
          </div>

          <p className="progress-hint">
            Завантажую фото та медіафайли...
          </p>

          <button type="button" className="cancel-btn" onClick={onCancel}>
            <X size={18} />
            Скасувати
          </button>
        </>
      )}

      {state.currentPhase === 'done' && (
        <>
          <div className="success-icon">
            <CheckCircle size={64} />
          </div>

          <p className="success-text">
            Успішно завантажено {state.exportedMessages.toLocaleString('uk-UA')}{' '}
            повідомлень!
          </p>

          <div className="export-format-choice">
            <h4>Оберіть формат для завантаження:</h4>

            <div className="format-buttons">
              <button
                type="button"
                className="format-btn"
                onClick={() => onExport('html')}
              >
                <Download size={24} />
                <span>HTML</span>
                <small>Гарний вигляд, пошук</small>
              </button>

              <button
                type="button"
                className="format-btn"
                onClick={() => onExport('json')}
              >
                <Download size={24} />
                <span>JSON</span>
                <small>Для розробників</small>
              </button>

              <button
                type="button"
                className="format-btn ai-format"
                onClick={() => onExport('json-ai')}
              >
                <Bot size={24} />
                <span>JSON для ШІ</span>
                <small>Компактний, для аналізу</small>
              </button>
            </div>
          </div>
        </>
      )}

      {state.currentPhase === 'error' && (
        <>
          <div className="error-icon">
            <AlertCircle size={64} />
          </div>

          <p className="error-text">{state.error || 'Невідома помилка'}</p>

          <button type="button" className="retry-btn" onClick={onCancel}>
            Спробувати ще раз
          </button>
        </>
      )}
    </div>
  );
}
