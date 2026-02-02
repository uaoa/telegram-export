import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ApiSetupGuide } from './components/ApiSetupGuide';
import { AuthForm } from './components/AuthForm';
import { DialogSelector, type DialogLimit } from './components/DialogSelector';
import { ExportProgress } from './components/ExportProgress';
import { DateRangeSelector, type DateRange } from './components/DateRangeSelector';
import { TopicSelector } from './components/TopicSelector';
import { ExportConfirmModal } from './components/ExportConfirmModal';
import { FileAnalyzer } from './components/FileAnalyzer';
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
  ForumTopic,
} from './types/auth';
import './App.css';

type AppMode = 'export' | 'analyze';
type AppStep = 'setup' | 'auth' | 'dialogs' | 'topics' | 'exporting';

function App() {
  const [mode, setMode] = useState<AppMode>('export');
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
  const [dialogLimit, setDialogLimit] = useState<DialogLimit>(100);
  const [selectedDialog, setSelectedDialog] = useState<TelegramDialog | null>(null);
  const [messages, setMessages] = useState<TelegramMessageData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  // Топіки
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDialog, setPendingDialog] = useState<TelegramDialog | null>(null);

  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    totalMessages: 0,
    exportedMessages: 0,
    currentPhase: 'idle',
    error: null,
  });

  const loadDialogs = useCallback(async (limit: DialogLimit = 100) => {
    setIsLoading(true);
    setDialogLimit(limit);
    setDialogs([]); // Очищуємо старі чати перед завантаженням
    try {
      const apiLimit = limit === 'all' ? undefined : limit;
      let isFirstUpdate = true;
      // Поступове завантаження - спочатку без фото, потім з фото
      await telegramService.getDialogs((progressDialogs) => {
        setDialogs(progressDialogs);
        // Після першого оновлення прибираємо індикатор завантаження
        if (isFirstUpdate) {
          setIsLoading(false);
          isFirstUpdate = false;
        }
      }, apiLimit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження чатів');
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

  // Обробка вибору діалогу
  const handleSelectDialog = useCallback(async (dialog: TelegramDialog) => {
    // Якщо це форум - показуємо топіки
    if (dialog.isForum) {
      setSelectedDialog(dialog);
      setIsLoadingTopics(true);
      setStep('topics');

      try {
        const loadedTopics = await telegramService.getForumTopics(dialog.entity);
        setTopics(loadedTopics);
      } catch (err) {
        console.error('Помилка завантаження топіків:', err);
        setTopics([]);
      } finally {
        setIsLoadingTopics(false);
      }
    } else {
      // Звичайний чат - показуємо modal підтвердження
      setPendingDialog(dialog);
      setSelectedDialog(dialog);
      setSelectedTopic(null);
      setShowConfirmModal(true);
    }
  }, []);

  // Вибір топіка
  const handleSelectTopic = useCallback((topic: ForumTopic | null) => {
    setSelectedTopic(topic);
    setShowConfirmModal(true);
  }, []);

  // Експорт всього чату (без вибору топіка)
  const handleExportAll = useCallback(() => {
    setSelectedTopic(null);
    setShowConfirmModal(true);
  }, []);

  // Підтвердження експорту
  const handleConfirmExport = useCallback(async () => {
    const dialog = pendingDialog || selectedDialog;
    if (!dialog) return;

    setShowConfirmModal(false);
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
        },
        dateRange,
        selectedTopic?.id
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
  }, [pendingDialog, selectedDialog, dateRange, selectedTopic]);

  const handleCancelExport = useCallback(() => {
    setStep('dialogs');
    setSelectedDialog(null);
    setPendingDialog(null);
    setSelectedTopic(null);
    setTopics([]);
    setMessages([]);
    setExportState({
      isExporting: false,
      totalMessages: 0,
      exportedMessages: 0,
      currentPhase: 'idle',
      error: null,
    });
  }, []);

  const handleBackToDialogs = useCallback(() => {
    setStep('dialogs');
    setSelectedDialog(null);
    setPendingDialog(null);
    setSelectedTopic(null);
    setTopics([]);
  }, []);

  const handleExport = useCallback(
    (format: 'html' | 'json' | 'json-ai') => {
      if (!selectedDialog || messages.length === 0) return;

      const exportName = selectedTopic
        ? `${selectedDialog.name} - ${selectedTopic.title}`
        : selectedDialog.name;

      exportChatFromApi(
        {
          name: exportName,
          type: selectedDialog.type,
          id: selectedDialog.id,
        },
        messages,
        format
      );
    },
    [selectedDialog, selectedTopic, messages]
  );

  const handleLogout = useCallback(async () => {
    await telegramService.disconnect();
    clearAllData();
    setStep('setup');
    setDialogs([]);
    setSelectedDialog(null);
    setMessages([]);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowConfirmModal(false);
    setPendingDialog(null);
  }, []);

  // Режим аналізу файлу
  if (mode === 'analyze') {
    return (
      <div className="app">
        <Header />
        <main className="main">
          <FileAnalyzer onBack={() => setMode('export')} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      <main className="main">
        {step === 'setup' && (
          <ApiSetupGuide
            onSubmit={handleApiSubmit}
            isLoading={isLoading}
            error={error}
            onAnalyzeFile={() => setMode('analyze')}
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
              <button type="button" className="analyze-link-btn" onClick={() => setMode('analyze')}>
                Аналіз файлу
              </button>
            </div>
            <DateRangeSelector
              dateRange={dateRange}
              onChange={setDateRange}
            />
            <DialogSelector
              dialogs={dialogs}
              onSelectDialog={handleSelectDialog}
              selectedDialogId={selectedDialog?.id ?? null}
              isLoading={isLoading}
              onRefresh={loadDialogs}
              currentLimit={dialogLimit}
            />
          </>
        )}

        {step === 'topics' && selectedDialog && (
          <>
            <div className="step-header">
              <button type="button" className="back-btn" onClick={handleBackToDialogs}>
                ← Назад до чатів
              </button>
            </div>
            <DateRangeSelector
              dateRange={dateRange}
              onChange={setDateRange}
            />
            <TopicSelector
              topics={topics}
              onSelectTopic={handleSelectTopic}
              selectedTopicId={selectedTopic?.id ?? null}
              isLoading={isLoadingTopics}
              chatName={selectedDialog.name}
              chatPhotoUrl={selectedDialog.photoUrl}
              onExportAll={handleExportAll}
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
              chatName={selectedTopic ? `${selectedDialog.name} - ${selectedTopic.title}` : selectedDialog.name}
              onCancel={handleCancelExport}
              onExport={handleExport}
            />
          </>
        )}
      </main>

      <Footer />

      {/* Modal підтвердження експорту */}
      {showConfirmModal && (pendingDialog ?? selectedDialog) && (
        <ExportConfirmModal
          isOpen={showConfirmModal}
          onClose={handleCloseModal}
          onConfirm={handleConfirmExport}
          dialog={pendingDialog ?? selectedDialog ?? dialogs[0]}
          dateRange={dateRange}
          selectedTopic={selectedTopic}
          isLoading={false}
        />
      )}
    </div>
  );
}

export default App;
