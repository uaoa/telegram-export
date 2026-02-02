export interface ApiCredentials {
  apiId: number;
  apiHash: string;
}

export interface AuthState {
  step: 'idle' | 'phone' | 'code' | 'password' | 'done';
  phoneNumber: string;
  phoneCodeHash: string;
  isLoading: boolean;
  error: string | null;
}

export interface TelegramDialog {
  id: string;
  name: string;
  type: 'user' | 'group' | 'channel' | 'chat';
  unreadCount: number;
  lastMessage?: string;
  lastMessageDate?: Date;
  entity: unknown;
  isForum?: boolean;
  photoUrl?: string;
  messagesCount?: number;
}

export interface ForumTopic {
  id: number;
  title: string;
  iconColor?: number;
  iconEmojiId?: string;
  creationDate?: Date;
  messagesCount?: number;
}

export interface TelegramMessageData {
  id: number;
  date: Date;
  text: string;
  fromId?: string;
  fromName?: string;
  media?: {
    type: string;
    fileName?: string;
  };
  replyToMsgId?: number;
  forwardedFrom?: string;
}

export interface ExportState {
  isExporting: boolean;
  totalMessages: number;
  exportedMessages: number;
  currentPhase: 'idle' | 'fetching' | 'processing' | 'done' | 'error';
  error: string | null;
}
