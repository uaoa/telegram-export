import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Smartphone,
  Monitor,
  Download,
  Settings,
  FolderOpen,
  CheckCircle,
} from 'lucide-react';

export function Guide() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="guide">
      <button
        className="guide-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>Як експортувати дані з Telegram?</span>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <div className="guide-content">
          <div className="guide-tabs">
            <button
              className={`tab ${activeTab === 'desktop' ? 'active' : ''}`}
              onClick={() => setActiveTab('desktop')}
            >
              <Monitor size={18} />
              Telegram Desktop
            </button>
            <button
              className={`tab ${activeTab === 'mobile' ? 'active' : ''}`}
              onClick={() => setActiveTab('mobile')}
            >
              <Smartphone size={18} />
              Мобільний додаток
            </button>
          </div>

          {activeTab === 'desktop' ? (
            <div className="guide-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Відкрийте Telegram Desktop</h4>
                  <p>Завантажте <a href="https://desktop.telegram.org/" target="_blank" rel="noopener noreferrer">Telegram Desktop</a> якщо ще не маєте</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>
                    <Settings size={16} /> Відкрийте налаштування
                  </h4>
                  <p>Натисніть на меню (☰) → Налаштування (Settings)</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>
                    <Download size={16} /> Знайдіть розділ "Розширені"
                  </h4>
                  <p>Перейдіть до: <strong>Розширені → Експорт даних Telegram</strong></p>
                  <p className="hint">Англійською: Advanced → Export Telegram data</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Налаштуйте експорт</h4>
                  <p>Виберіть що експортувати:</p>
                  <ul>
                    <li><CheckCircle size={14} /> Особисті чати</li>
                    <li><CheckCircle size={14} /> Групи</li>
                    <li><CheckCircle size={14} /> Канали</li>
                  </ul>
                  <p className="important">Важливо: Оберіть формат <strong>"Machine-readable JSON"</strong></p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h4>
                    <FolderOpen size={16} /> Експортуйте
                  </h4>
                  <p>Натисніть "Експортувати" та дочекайтесь завершення</p>
                  <p>Telegram створить папку з файлом <code>result.json</code></p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">6</div>
                <div className="step-content">
                  <h4>Завантажте сюди</h4>
                  <p>Перетягніть ZIP архів або файл <code>result.json</code> у поле завантаження вище</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="guide-steps">
              <div className="mobile-notice">
                <p>На жаль, мобільний додаток Telegram <strong>не підтримує</strong> повний експорт даних.</p>
                <p>Щоб експортувати чати, вам потрібно скористатися <strong>Telegram Desktop</strong> на комп'ютері.</p>
              </div>

              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Встановіть Telegram Desktop</h4>
                  <p>Завантажте з <a href="https://desktop.telegram.org/" target="_blank" rel="noopener noreferrer">desktop.telegram.org</a></p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Увійдіть у свій акаунт</h4>
                  <p>Використайте той самий номер телефону, що й у мобільному додатку</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Слідуйте інструкціям для Desktop</h4>
                  <p>Перейдіть на вкладку "Telegram Desktop" вище</p>
                </div>
              </div>
            </div>
          )}

          <div className="guide-footer">
            <p>Ваші дані обробляються лише у вашому браузері та не надсилаються на жодні сервери.</p>
          </div>
        </div>
      )}
    </div>
  );
}
