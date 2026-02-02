import { X, Download, Calendar, MessageSquare, Hash } from 'lucide-react';
import type { TelegramDialog, ForumTopic } from '../types/auth';
import type { DateRange } from './DateRangeSelector';

interface ExportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dialog: TelegramDialog;
  dateRange: DateRange;
  selectedTopic?: ForumTopic | null;
  isLoading: boolean;
}

export function ExportConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  dialog,
  dateRange,
  selectedTopic,
  isLoading,
}: ExportConfirmModalProps) {
  if (!isOpen) return null;

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDialogTypeLabel = (type: TelegramDialog['type']) => {
    switch (type) {
      case 'user':
        return 'Особистий чат';
      case 'group':
        return 'Група';
      case 'channel':
        return 'Канал';
      default:
        return 'Чат';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header">
          <Download size={32} className="modal-icon" />
          <h2>Підтвердження експорту</h2>
        </div>

        <div className="modal-body">
          <div className="export-summary">
            <div className="summary-item">
              <MessageSquare size={18} />
              <div>
                <span className="summary-label">Чат:</span>
                <span className="summary-value">{dialog.name}</span>
              </div>
            </div>

            <div className="summary-item">
              <Hash size={18} />
              <div>
                <span className="summary-label">Тип:</span>
                <span className="summary-value">{getDialogTypeLabel(dialog.type)}</span>
              </div>
            </div>

            {selectedTopic && (
              <div className="summary-item">
                <MessageSquare size={18} />
                <div>
                  <span className="summary-label">Топік:</span>
                  <span className="summary-value">{selectedTopic.title}</span>
                </div>
              </div>
            )}

            <div className="summary-item">
              <Calendar size={18} />
              <div>
                <span className="summary-label">Період:</span>
                <span className="summary-value">
                  {!dateRange.from && !dateRange.to
                    ? 'Всі повідомлення'
                    : `${formatDate(dateRange.from) || 'Початок'} — ${formatDate(dateRange.to) || 'Сьогодні'}`}
                </span>
              </div>
            </div>
          </div>

          <p className="modal-note">
            Експорт може зайняти деякий час залежно від кількості повідомлень.
            Не закривайте сторінку під час експорту.
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn secondary" onClick={onClose} disabled={isLoading}>
            Скасувати
          </button>
          <button type="button" className="modal-btn primary" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner-small" />
                Завантаження...
              </>
            ) : (
              <>
                <Download size={18} />
                Почати експорт
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
