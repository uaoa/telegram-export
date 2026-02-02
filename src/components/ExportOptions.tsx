import { useState } from 'react';
import { Download, FileJson, FileText, Check } from 'lucide-react';
import type { ExportFormat, TelegramChat } from '../types/telegram';
import { exportChat } from '../utils/exporter';

interface ExportOptionsProps {
  selectedChat: TelegramChat | null;
  onReset: () => void;
}

export function ExportOptions({ selectedChat, onReset }: ExportOptionsProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('html');
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    if (!selectedChat) return;

    setIsExporting(true);
    try {
      exportChat(selectedChat, selectedFormat);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      console.error('Помилка експорту:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!selectedChat) {
    return null;
  }

  return (
    <div className="export-options">
      <h2>Налаштування експорту</h2>

      <div className="selected-chat-info">
        <h3>{selectedChat.name}</h3>
        <p>{selectedChat.messages.length.toLocaleString('uk-UA')} повідомлень</p>
      </div>

      <div className="format-selector">
        <h4>Формат експорту:</h4>
        <div className="format-buttons">
          <button
            className={`format-btn ${selectedFormat === 'html' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('html')}
          >
            <FileText size={24} />
            <span>HTML</span>
            <small>Гарний вигляд, пошук</small>
          </button>
          <button
            className={`format-btn ${selectedFormat === 'json' ? 'active' : ''}`}
            onClick={() => setSelectedFormat('json')}
          >
            <FileJson size={24} />
            <span>JSON</span>
            <small>Для розробників</small>
          </button>
        </div>
      </div>

      <div className="format-description">
        {selectedFormat === 'html' ? (
          <p>HTML файл з красивим оформленням, вбудованим пошуком та адаптивним дизайном. Відкривається в будь-якому браузері.</p>
        ) : (
          <p>Структурований JSON файл з усіма даними повідомлень. Ідеально для обробки даних чи імпорту в інші сервіси.</p>
        )}
      </div>

      <div className="export-actions">
        <button
          className={`export-btn ${exported ? 'success' : ''}`}
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <span className="spinner-small"></span>
              Експортую...
            </>
          ) : exported ? (
            <>
              <Check size={20} />
              Завантажено!
            </>
          ) : (
            <>
              <Download size={20} />
              Завантажити {selectedFormat.toUpperCase()}
            </>
          )}
        </button>

        <button className="reset-btn" onClick={onReset}>
          Вибрати інший чат
        </button>
      </div>
    </div>
  );
}
