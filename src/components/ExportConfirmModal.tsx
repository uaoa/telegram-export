import { Calendar, Download, Hash, Image, MessageSquare, X } from 'lucide-react';
import type { TelegramDialog, ForumTopic } from '../types/auth';
import type { DateRange } from './DateRangeSelector';

export interface ExportOptions {
  includeMedia: boolean;
}

interface ExportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ExportOptions) => void;
  dialog: TelegramDialog;
  dateRange: DateRange;
  selectedTopic?: ForumTopic | null;
  isLoading: boolean;
  exportOptions: ExportOptions;
  onOptionsChange: (options: ExportOptions) => void;
}

export function ExportConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  dialog,
  dateRange,
  selectedTopic,
  isLoading,
  exportOptions,
  onOptionsChange,
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

          <div className="export-options">
            <label className="option-checkbox">
              <input
                type="checkbox"
                checked={exportOptions.includeMedia}
                onChange={(e) => onOptionsChange({ ...exportOptions, includeMedia: e.target.checked })}
                disabled={isLoading}
              />
              <Image size={18} />
              <span>Завантажити фото та медіа</span>
            </label>
            {exportOptions.includeMedia && (
              <p className="option-hint">
                Медіафайли будуть збережені в окремій папці. Експорт займе більше часу.
              </p>
            )}
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
          <button type="button" className="modal-btn primary" onClick={() => onConfirm(exportOptions)} disabled={isLoading}>
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
