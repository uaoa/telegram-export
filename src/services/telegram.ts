import type {
  ApiCredentials,
  TelegramDialog,
  TelegramMessageData,
  ForumTopic,
} from '../types/auth';
import { saveSession, getSession } from '../utils/storage';

// Ленивий імпорт для GramJS
let TelegramClient: typeof import('telegram').TelegramClient;
let Api: typeof import('telegram').Api;
let passwordModule: typeof import('telegram').password;
let StringSession: typeof import('telegram/sessions').StringSession;

async function loadGramJS() {
  if (!TelegramClient) {
    const telegram = await import('telegram');
    const sessions = await import('telegram/sessions');
    TelegramClient = telegram.TelegramClient;
    Api = telegram.Api;
    passwordModule = telegram.password;
    StringSession = sessions.StringSession;
  }
}

class TelegramService {
  private client: InstanceType<typeof import('telegram').TelegramClient> | null = null;
  private credentials: ApiCredentials | null = null;

  async initialize(credentials: ApiCredentials): Promise<void> {
    await loadGramJS();

    this.credentials = credentials;

    const savedSession = getSession();
    const session = new StringSession(savedSession || '');

    this.client = new TelegramClient(session, credentials.apiId, credentials.apiHash, {
      connectionRetries: 5,
      useWSS: true,
    });

    await this.client.connect();
  }

  async isAuthorized(): Promise<boolean> {
    if (!this.client) return false;
    return this.client.isUserAuthorized();
  }

  async sendCode(phoneNumber: string): Promise<{ phoneCodeHash: string }> {
    if (!this.client) throw new Error('Клієнт не ініціалізовано');

    const result = await this.client.sendCode(
      { apiId: this.credentials!.apiId, apiHash: this.credentials!.apiHash },
      phoneNumber
    );

    return { phoneCodeHash: result.phoneCodeHash };
  }

  async signIn(
    phoneNumber: string,
    phoneCodeHash: string,
    phoneCode: string
  ): Promise<{ requiresPassword: boolean }> {
    if (!this.client) throw new Error('Клієнт не ініціалізовано');

    try {
      await this.client.invoke(
        new Api.auth.SignIn({
          phoneNumber,
          phoneCodeHash,
          phoneCode,
        })
      );

      await this.saveCurrentSession();
      return { requiresPassword: false };
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('SESSION_PASSWORD_NEEDED')) {
        return { requiresPassword: true };
      }
      throw error;
    }
  }

  async signInWithPassword(password: string): Promise<void> {
    if (!this.client) throw new Error('Клієнт не ініціалізовано');

    const passwordSrpResult = await this.client.invoke(new Api.account.GetPassword());

    const srpCheck = await passwordModule.computeCheck(passwordSrpResult, password);

    const result = await this.client.invoke(
      new Api.auth.CheckPassword({
        password: srpCheck,
      })
    );

    if (result) {
      await this.saveCurrentSession();
    }
  }

  private async saveCurrentSession(): Promise<void> {
    if (!this.client) return;
    const sessionString = this.client.session.save() as unknown as string;
    saveSession(sessionString);
  }

  // Швидке завантаження чатів без фото
  async getDialogs(onProgress?: (dialogs: TelegramDialog[]) => void): Promise<TelegramDialog[]> {
    if (!this.client) throw new Error('Клієнт не ініціалізовано');

    const dialogs = await this.client.getDialogs({ limit: 100 });

    const results: TelegramDialog[] = [];

    // Спочатку швидко створюємо список без фото
    for (const dialog of dialogs) {
      let type: TelegramDialog['type'] = 'chat';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entity = dialog.entity as any;

      if (entity) {
        if ('className' in entity) {
          if (entity.className === 'User') {
            type = 'user';
          } else if (entity.className === 'Channel') {
            type = entity.megagroup ? 'group' : 'channel';
          } else if (entity.className === 'Chat') {
            type = 'group';
          }
        }
      }

      // Отримуємо кількість учасників (якщо доступно)
      let messagesCount: number | undefined;
      if (entity?.participantsCount !== undefined) {
        messagesCount = entity.participantsCount;
      }

      results.push({
        id: dialog.id?.toString() || '',
        name: dialog.title || dialog.name || 'Невідомий чат',
        type,
        unreadCount: dialog.unreadCount || 0,
        lastMessage: dialog.message?.message || undefined,
        lastMessageDate: dialog.message?.date
          ? new Date(dialog.message.date * 1000)
          : undefined,
        entity: dialog.entity,
        isForum: entity?.forum === true,
        photoUrl: undefined, // Фото завантажимо потім
        messagesCount,
      });
    }

    // Відразу повертаємо результат без фото
    if (onProgress) {
      onProgress([...results]);
    }

    // Завантажуємо фото паралельно у фоні (батчами по 5)
    const batchSize = 5;
    for (let i = 0; i < dialogs.length; i += batchSize) {
      const batch = dialogs.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (dialog, batchIndex) => {
          const index = i + batchIndex;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const entity = dialog.entity as any;

          if (entity?.photo && this.client) {
            try {
              const photoBuffer = await this.client.downloadProfilePhoto(entity, {
                isBig: false,
              });
              if (photoBuffer && typeof photoBuffer !== 'string' && photoBuffer.length > 0) {
                const uint8Array = new Uint8Array(photoBuffer);
                let binary = '';
                uint8Array.forEach((byte) => {
                  binary += String.fromCharCode(byte);
                });
                const base64 = btoa(binary);
                results[index].photoUrl = `data:image/jpeg;base64,${base64}`;
              }
            } catch {
              // Ігноруємо помилки завантаження фото
            }
          }
        })
      );

      // Оновлюємо UI після кожного батчу
      if (onProgress) {
        onProgress([...results]);
      }
    }

    return results;
  }

  async getForumTopics(entity: unknown): Promise<ForumTopic[]> {
    if (!this.client) throw new Error('Клієнт не ініціалізовано');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await this.client.invoke(
        new Api.channels.GetForumTopics({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          channel: entity as any,
          limit: 100,
        })
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const topics = (result as any).topics || [];

      return topics.map((topic: {
        id: number;
        title: string;
        iconColor?: number;
        iconEmojiId?: { value: string };
        date?: number;
      }) => ({
        id: topic.id,
        title: topic.title,
        iconColor: topic.iconColor,
        iconEmojiId: topic.iconEmojiId?.value,
        creationDate: topic.date ? new Date(topic.date * 1000) : undefined,
      }));
    } catch (error) {
      console.error('Помилка отримання топіків:', error);
      return [];
    }
  }

  async getMessages(
    entity: unknown,
    onProgress?: (count: number, total: number) => void,
    dateRange?: { from: Date | null; to: Date | null },
    topicId?: number
  ): Promise<TelegramMessageData[]> {
    if (!this.client) throw new Error('Клієнт не ініціалізовано');

    const messages: TelegramMessageData[] = [];
    let total = 0;

    // Конвертуємо дати в Unix timestamp для API
    const offsetDate = dateRange?.to ? Math.floor(dateRange.to.getTime() / 1000) : undefined;
    const minDate = dateRange?.from ? Math.floor(dateRange.from.getTime() / 1000) : undefined;

    // Параметри для запиту
    const iterParams: {
      limit?: number;
      offsetDate?: number;
      replyTo?: number;
    } = {
      limit: undefined, // Всі повідомлення
      offsetDate, // Починаємо з цієї дати (якщо вказано)
    };

    // Якщо вказано топік, фільтруємо по ньому
    if (topicId) {
      iterParams.replyTo = topicId;
    }

    // Спочатку отримаємо приблизну кількість повідомлень
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstBatch = await this.client.getMessages(entity as any, {
      limit: 1,
      offsetDate,
      replyTo: topicId,
    });

    if (firstBatch.total) {
      total = typeof firstBatch.total === 'number' ? firstBatch.total : 0;
    }

    // Ітеруємо по всіх повідомленнях
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const message of this.client.iterMessages(entity as any, iterParams)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = message as any;

      // Перевіряємо чи повідомлення не старіше мінімальної дати
      if (minDate && msg.date < minDate) {
        // Повідомлення відсортовані від нових до старих, тому можемо зупинитись
        break;
      }

      let fromName: string | undefined;
      let fromId: string | undefined;

      if (msg.fromId) {
        if ('userId' in msg.fromId) {
          fromId = String(msg.fromId.userId);
        } else if ('channelId' in msg.fromId) {
          fromId = String(msg.fromId.channelId);
        }
      }

      // Спробуємо отримати ім'я відправника
      if (msg.sender) {
        if ('firstName' in msg.sender) {
          fromName = [(msg.sender as { firstName?: string }).firstName, (msg.sender as { lastName?: string }).lastName]
            .filter(Boolean)
            .join(' ');
        } else if ('title' in msg.sender) {
          fromName = (msg.sender as { title: string }).title;
        }
      }

      let mediaInfo: TelegramMessageData['media'] | undefined;
      if (msg.media) {
        if (msg.media.className === 'MessageMediaPhoto') {
          mediaInfo = { type: 'photo' };
        } else if (msg.media.className === 'MessageMediaDocument') {
          const docMedia = msg.media as { document?: { mimeType?: string; attributes?: Array<{ className: string; fileName?: string }> } };
          const doc = docMedia.document;
          if (doc) {
            const fileAttr = doc.attributes?.find(
              (attr) => attr.className === 'DocumentAttributeFilename'
            );
            mediaInfo = {
              type: doc.mimeType || 'document',
              fileName: fileAttr?.fileName,
            };
          }
        } else if (msg.media.className === 'MessageMediaWebPage') {
          mediaInfo = { type: 'webpage' };
        }
      }

      messages.push({
        id: msg.id,
        date: new Date(msg.date * 1000),
        text: msg.message || '',
        fromId,
        fromName,
        media: mediaInfo,
        replyToMsgId: msg.replyTo?.replyToMsgId,
        forwardedFrom: msg.fwdFrom?.fromName || undefined,
      });

      if (onProgress) {
        onProgress(messages.length, total);
      }

      // Невелика затримка щоб не перевищити rate limit
      if (messages.length % 100 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return messages;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  getClient() {
    return this.client;
  }
}

export const telegramService = new TelegramService();
