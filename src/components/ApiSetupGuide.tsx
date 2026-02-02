import { useState } from 'react';
import { ExternalLink, Key, Copy, Check, AlertCircle } from 'lucide-react';
import type { ApiCredentials } from '../types/auth';

interface ApiSetupGuideProps {
  onSubmit: (credentials: ApiCredentials) => void;
  isLoading: boolean;
  error: string | null;
}

export function ApiSetupGuide({ onSubmit, isLoading, error }: ApiSetupGuideProps) {
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const id = parseInt(apiId, 10);
    if (isNaN(id) || id <= 0) {
      return;
    }

    if (!apiHash.trim() || apiHash.length < 20) {
      return;
    }

    onSubmit({ apiId: id, apiHash: apiHash.trim() });
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText('https://my.telegram.org/apps');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isValid =
    apiId.length > 0 &&
    !isNaN(parseInt(apiId, 10)) &&
    apiHash.length >= 20;

  return (
    <div className="api-setup">
      <h2>Налаштування API</h2>
      <p className="api-setup-intro">
        Для експорту чатів потрібні ключі Telegram API. Це безпечно — ключі
        зберігаються тільки у вашому браузері.
      </p>

      <div className="api-setup-steps">
        <div className="setup-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Відкрийте сторінку Telegram API</h4>
            <p>
              Перейдіть на{' '}
              <a
                href="https://my.telegram.org/apps"
                target="_blank"
                rel="noopener noreferrer"
              >
                my.telegram.org/apps
                <ExternalLink size={14} />
              </a>
            </p>
            <button type="button" className="copy-btn" onClick={copyUrl}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Скопійовано!' : 'Копіювати посилання'}
            </button>
          </div>
        </div>

        <div className="setup-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Увійдіть з вашим номером телефону</h4>
            <p>
              Введіть номер телефону вашого Telegram акаунту та код підтвердження.
            </p>
          </div>
        </div>

        <div className="setup-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Скопіюйте API ID та API Hash</h4>
            <p>
              На сторінці "App configuration" ви побачите <strong>App api_id</strong> та{' '}
              <strong>App api_hash</strong>. Скопіюйте їх в поля нижче.
            </p>
            <p className="hint">
              Якщо у вас ще немає додатку — натисніть "API development tools" та створіть його (назва може бути будь-якою).
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="api-form">
        <div className="form-group">
          <label htmlFor="apiId">
            <Key size={18} />
            API ID
          </label>
          <input
            id="apiId"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Наприклад: 12345678"
            value={apiId}
            onChange={(e) => setApiId(e.target.value.replace(/\D/g, ''))}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="apiHash">
            <Key size={18} />
            API Hash
          </label>
          <input
            id="apiHash"
            type="text"
            placeholder="Наприклад: a1b2c3d4e5f6g7h8i9j0..."
            value={apiHash}
            onChange={(e) => setApiHash(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="form-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="submit-btn"
          disabled={!isValid || isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-small" />
              Підключення...
            </>
          ) : (
            'Продовжити'
          )}
        </button>
      </form>

      <div className="api-setup-footer">
        <p>
          <strong>Безпека:</strong> Ваші API ключі зберігаються лише локально у
          вашому браузері. Ми не маємо доступу до них і не передаємо на сервери.
        </p>
      </div>
    </div>
  );
}
