import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Guide } from './components/Guide';
import { FileUploader } from './components/FileUploader';
import { ChatSelector } from './components/ChatSelector';
import { ExportOptions } from './components/ExportOptions';
import {
  parseZipFile,
  parseJsonFile,
  extractChats,
  getChatSummaries,
} from './utils/parser';
import type { TelegramChat, ChatSummary } from './types/telegram';
import './App.css';

type AppStep = 'upload' | 'select' | 'export';

function App() {
  const [step, setStep] = useState<AppStep>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [selectedChat, setSelectedChat] = useState<TelegramChat | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = file.name.toLowerCase().endsWith('.zip')
        ? await parseZipFile(file)
        : await parseJsonFile(file);

      if (!data) {
        throw new Error('Не вдалося прочитати файл');
      }

      const extractedChats = extractChats(data);

      if (extractedChats.length === 0) {
        throw new Error(
          'У файлі не знайдено чатів. Переконайтесь, що ви експортували дані у форматі JSON.'
        );
      }

      setChats(extractedChats);
      setChatSummaries(getChatSummaries(extractedChats));
      setStep('select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectChat = useCallback(
    (chatId: number) => {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
        setStep('export');
      }
    },
    [chats]
  );

  const handleReset = useCallback(() => {
    setSelectedChat(null);
    setStep('select');
  }, []);

  const handleFullReset = useCallback(() => {
    setStep('upload');
    setChats([]);
    setChatSummaries([]);
    setSelectedChat(null);
    setError(null);
  }, []);

  return (
    <div className="app">
      <Header />

      <main className="main">
        {step === 'upload' && (
          <>
            <Guide />
            <FileUploader onFileSelect={handleFileSelect} isLoading={isLoading} />
            {error && (
              <div className="global-error">
                <p>{error}</p>
                <button type="button" onClick={() => setError(null)}>Спробувати ще</button>
              </div>
            )}
          </>
        )}

        {step === 'select' && (
          <>
            <div className="step-header">
              <button type="button" className="back-btn" onClick={handleFullReset}>
                ← Завантажити інший файл
              </button>
            </div>
            <ChatSelector
              chats={chatSummaries}
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChat?.id ?? null}
            />
          </>
        )}

        {step === 'export' && (
          <>
            <div className="step-header">
              <button type="button" className="back-btn" onClick={handleFullReset}>
                ← Завантажити інший файл
              </button>
            </div>
            <ExportOptions selectedChat={selectedChat} onReset={handleReset} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
