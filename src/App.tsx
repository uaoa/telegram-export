import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ApiSetupGuide } from './components/ApiSetupGuide';
import { AuthForm } from './components/AuthForm';
import { DialogSelector } from './components/DialogSelector';
import { ExportProgress } from './components/ExportProgress';
import { telegramService } from './services/telegram';
import {
  getApiCredentials,
  saveApiCredentials,
  clearAllData,
} from './utils/storage';
import { exportChatFromApi } from './utils/exporterApi';
import type {
  ApiCredentials,
  AuthState,
  TelegramDialog,
  TelegramMessageData,
  ExportState,
} from './types/auth';
import './App.css';

type AppStep = 'setup' | 'auth' | 'dialogs' | 'exporting';

function App() {
  const [step, setStep] = useState<AppStep>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [authState, setAuthState] = useState<AuthState>({
    step: 'phone',
    phoneNumber: '',
    phoneCodeHash: '',
    isLoading: false,
    error: null,
  });

  const [dialogs, setDialogs] = useState<TelegramDialog[]>([]);
  const [selectedDialog, setSelectedDialog] = useState<TelegramDialog | null>(null);
  const [messages, setMessages] = useState<TelegramMessageData[]>([]);

  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    totalMessages: 0,
    exportedMessages: 0,
    currentPhase: 'idle',
    error: null,
  });

  const loadDialogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedDialogs = await telegramService.getDialogs();
      setDialogs(loadedDialogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження чатів');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Перевіряємо збережені credentials при завантаженні
  useEffect(() => {
    const checkSavedCredentials = async () => {
      const credentials = getApiCredentials();
      if (credentials) {
        setIsLoading(true);
        try {
          await telegramService.initialize(credentials);
          const isAuthorized = await telegramService.isAuthorized();

          if (isAuthorized) {
            setStep('dialogs');
            await loadDialogs();
          } else {
            setStep('auth');
          }
        } catch (err) {
          console.error('Помилка ініціалізації:', err);
          setStep('setup');
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkSavedCredentials();
  }, [loadDialogs]);

  const handleApiSubmit = useCallback(async (credentials: ApiCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      saveApiCredentials(credentials);
      await telegramService.initialize(credentials);

      const isAuthorized = await telegramService.isAuthorized();

      if (isAuthorized) {
        setStep('dialogs');
        await loadDialogs();
      } else {
        setStep('auth');
        setAuthState((prev) => ({ ...prev, step: 'phone' }));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Помилка підключення до Telegram'
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadDialogs]);

  const handleSendCode = useCallback(async (phoneNumber: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await telegramService.sendCode(phoneNumber);

      setAuthState((prev) => ({
        ...prev,
        step: 'code',
        phoneNumber,
        phoneCodeHash: result.phoneCodeHash,
        isLoading: false,
      }));
    } catch (err) {
      let errorMessage = 'Помилка надсилання коду';

      if (err instanceof Error) {
        if (err.message.includes('PHONE_NUMBER_INVALID')) {
          errorMessage = 'Невірний номер телефону';
        } else if (err.message.includes('PHONE_NUMBER_BANNED')) {
          errorMessage = 'Цей номер заблоковано';
        } else if (err.message.includes('FLOOD')) {
          errorMessage = 'Забагато спроб. Спробуйте пізніше.';
        } else {
          errorMessage = err.message;
        }
      }

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const handleVerifyCode = useCallback(
    async (code: string) => {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await telegramService.signIn(
          authState.phoneNumber,
          authState.phoneCodeHash,
          code
        );

        if (result.requiresPassword) {
          setAuthState((prev) => ({
            ...prev,
            step: 'password',
            isLoading: false,
          }));
        } else {
          setAuthState((prev) => ({ ...prev, step: 'done', isLoading: false }));
          setStep('dialogs');
          await loadDialogs();
        }
      } catch (err) {
        let errorMessage = 'Помилка підтвердження коду';

        if (err instanceof Error) {
          if (err.message.includes('PHONE_CODE_INVALID')) {
            errorMessage = 'Невірний код';
          } else if (err.message.includes('PHONE_CODE_EXPIRED')) {
            errorMessage = 'Код застарів. Спробуйте ще раз.';
          } else {
            errorMessage = err.message;
          }
        }

        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    },
    [authState.phoneNumber, authState.phoneCodeHash, loadDialogs]
  );

  const handleVerifyPassword = useCallback(async (password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await telegramService.signInWithPassword(password);
      setAuthState((prev) => ({ ...prev, step: 'done', isLoading: false }));
      setStep('dialogs');
      await loadDialogs();
    } catch (err) {
      let errorMessage = 'Невірний пароль';

      if (err instanceof Error) {
        if (err.message.includes('PASSWORD_HASH_INVALID')) {
          errorMessage = 'Невірний пароль';
        } else {
          errorMessage = err.message;
        }
      }

      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [loadDialogs]);

  const handleBackToSetup = useCallback(() => {
    clearAllData();
    setStep('setup');
    setAuthState({
      step: 'phone',
      phoneNumber: '',
      phoneCodeHash: '',
      isLoading: false,
      error: null,
    });
    setDialogs([]);
    setSelectedDialog(null);
  }, []);

  const handleSelectDialog = useCallback(async (dialog: TelegramDialog) => {
    setSelectedDialog(dialog);
    setStep('exporting');
    setExportState({
      isExporting: true,
      totalMessages: 0,
      exportedMessages: 0,
      currentPhase: 'fetching',
      error: null,
    });

    try {
      const loadedMessages = await telegramService.getMessages(
        dialog.entity,
        (count, total) => {
          setExportState((prev) => ({
            ...prev,
            exportedMessages: count,
            totalMessages: total,
          }));
        }
      );

      setMessages(loadedMessages);
      setExportState((prev) => ({
        ...prev,
        currentPhase: 'done',
        isExporting: false,
        exportedMessages: loadedMessages.length,
        totalMessages: loadedMessages.length,
      }));
    } catch (err) {
      setExportState((prev) => ({
        ...prev,
        currentPhase: 'error',
        isExporting: false,
        error: err instanceof Error ? err.message : 'Помилка завантаження',
      }));
    }
  }, []);

  const handleCancelExport = useCallback(() => {
    setStep('dialogs');
    setSelectedDialog(null);
    setMessages([]);
    setExportState({
      isExporting: false,
      totalMessages: 0,
      exportedMessages: 0,
      currentPhase: 'idle',
      error: null,
    });
  }, []);

  const handleExport = useCallback(
    (format: 'html' | 'json') => {
      if (!selectedDialog || messages.length === 0) return;

      exportChatFromApi(
        {
          name: selectedDialog.name,
          type: selectedDialog.type,
          id: selectedDialog.id,
        },
        messages,
        format
      );
    },
    [selectedDialog, messages]
  );

  const handleLogout = useCallback(async () => {
    await telegramService.disconnect();
    clearAllData();
    setStep('setup');
    setDialogs([]);
    setSelectedDialog(null);
    setMessages([]);
  }, []);

  return (
    <div className="app">
      <Header />

      <main className="main">
        {step === 'setup' && (
          <ApiSetupGuide
            onSubmit={handleApiSubmit}
            isLoading={isLoading}
            error={error}
          />
        )}

        {step === 'auth' && (
          <AuthForm
            authState={authState}
            onSendCode={handleSendCode}
            onVerifyCode={handleVerifyCode}
            onVerifyPassword={handleVerifyPassword}
            onBack={handleBackToSetup}
          />
        )}

        {step === 'dialogs' && (
          <>
            <div className="step-header">
              <button type="button" className="back-btn logout" onClick={handleLogout}>
                Вийти з акаунту
              </button>
            </div>
            <DialogSelector
              dialogs={dialogs}
              onSelectDialog={handleSelectDialog}
              selectedDialogId={selectedDialog?.id ?? null}
              isLoading={isLoading}
              onRefresh={loadDialogs}
            />
          </>
        )}

        {step === 'exporting' && selectedDialog && (
          <>
            <div className="step-header">
              <button type="button" className="back-btn" onClick={handleCancelExport}>
                ← Назад до чатів
              </button>
            </div>
            <ExportProgress
              state={exportState}
              chatName={selectedDialog.name}
              onCancel={handleCancelExport}
              onExport={handleExport}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
