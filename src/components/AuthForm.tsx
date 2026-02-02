import { useState } from 'react';
import { Phone, MessageSquare, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import type { AuthState } from '../types/auth';

interface AuthFormProps {
  authState: AuthState;
  onSendCode: (phoneNumber: string) => Promise<void>;
  onVerifyCode: (code: string) => Promise<void>;
  onVerifyPassword: (password: string) => Promise<void>;
  onBack: () => void;
}

export function AuthForm({
  authState,
  onSendCode,
  onVerifyCode,
  onVerifyPassword,
  onBack,
}: AuthFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    // Форматуємо номер телефону
    let formattedPhone = phoneNumber.replace(/\s/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    await onSendCode(formattedPhone);
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length < 5) return;
    await onVerifyCode(code);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    await onVerifyPassword(password);
  };

  return (
    <div className="auth-form">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={18} />
        Змінити API ключі
      </button>

      {authState.step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="auth-step">
          <div className="auth-icon">
            <Phone size={48} />
          </div>
          <h2>Введіть номер телефону</h2>
          <p>
            Введіть номер телефону, який прив'язаний до вашого Telegram акаунту.
            Ми надішлемо код підтвердження.
          </p>

          <div className="form-group">
            <label htmlFor="phone">
              <Phone size={18} />
              Номер телефону
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+380 XX XXX XXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={authState.isLoading}
              autoFocus
            />
          </div>

          {authState.error && (
            <div className="form-error">
              <AlertCircle size={18} />
              <span>{authState.error}</span>
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={!phoneNumber.trim() || authState.isLoading}
          >
            {authState.isLoading ? (
              <>
                <span className="spinner-small" />
                Надсилання коду...
              </>
            ) : (
              'Надіслати код'
            )}
          </button>
        </form>
      )}

      {authState.step === 'code' && (
        <form onSubmit={handleCodeSubmit} className="auth-step">
          <div className="auth-icon">
            <MessageSquare size={48} />
          </div>
          <h2>Введіть код з Telegram</h2>
          <p>
            Ми надіслали код на <strong>{authState.phoneNumber}</strong>.
            Перевірте повідомлення в Telegram.
          </p>

          <div className="form-group">
            <label htmlFor="code">
              <MessageSquare size={18} />
              Код підтвердження
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="12345"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              disabled={authState.isLoading}
              maxLength={6}
              autoFocus
            />
          </div>

          {authState.error && (
            <div className="form-error">
              <AlertCircle size={18} />
              <span>{authState.error}</span>
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={code.length < 5 || authState.isLoading}
          >
            {authState.isLoading ? (
              <>
                <span className="spinner-small" />
                Перевірка...
              </>
            ) : (
              'Підтвердити'
            )}
          </button>
        </form>
      )}

      {authState.step === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="auth-step">
          <div className="auth-icon">
            <Lock size={48} />
          </div>
          <h2>Двофакторна автентифікація</h2>
          <p>
            Ваш акаунт захищено паролем. Введіть пароль двофакторної
            автентифікації.
          </p>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Пароль 2FA
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={authState.isLoading}
              autoFocus
            />
          </div>

          {authState.error && (
            <div className="form-error">
              <AlertCircle size={18} />
              <span>{authState.error}</span>
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={!password.trim() || authState.isLoading}
          >
            {authState.isLoading ? (
              <>
                <span className="spinner-small" />
                Перевірка...
              </>
            ) : (
              'Увійти'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
