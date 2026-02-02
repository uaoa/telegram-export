import type {
  ApiCredentials,
  TelegramDialog,
  TelegramMessageData,
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

  async getDialogs(): Promise<TelegramDialog[]> {
    if (!this.client) throw new Error('Клієнт не ініціалізовано');

    const dialogs = await this.client.getDialogs({ limit: 100 });

    return dialogs.map((dialog) => {
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

      return {
        id: dialog.id?.toString() || '',
        name: dialog.title || dialog.name || 'Невідомий чат',
        type,
        unreadCount: dialog.unreadCount || 0,
        lastMessage: dialog.message?.message || undefined,
        lastMessageDate: dialog.message?.date
          ? new Date(dialog.message.date * 1000)
          : undefined,
        entity: dialog.entity,
      };
    });
  }

  async getMessages(
    entity: unknown,
    onProgress?: (count: number, total: number) => void,
    dateRange?: { from: Date | null; to: Date | null }
  ): Promise<TelegramMessageData[]> {
    if (!this.client) throw new Error('Клієнт не ініціалізовано');

    const messages: TelegramMessageData[] = [];
    let total = 0;

    // Конвертуємо дати в Unix timestamp для API
    const offsetDate = dateRange?.to ? Math.floor(dateRange.to.getTime() / 1000) : undefined;
    const minDate = dateRange?.from ? Math.floor(dateRange.from.getTime() / 1000) : undefined;

    // Спочатку отримаємо приблизну кількість повідомлень
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstBatch = await this.client.getMessages(entity as any, {
      limit: 1,
      offsetDate,
    });

    if (firstBatch.total) {
      total = typeof firstBatch.total === 'number' ? firstBatch.total : 0;
    }

    // Ітеруємо по всіх повідомленнях
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const message of this.client.iterMessages(entity as any, {
      limit: undefined, // Всі повідомлення
      offsetDate, // Починаємо з цієї дати (якщо вказано)
    })) {
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
