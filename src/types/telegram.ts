export interface TelegramMessage {
  id: number;
  type: string;
  date: string;
  date_unixtime: string;
  from?: string;
  from_id?: string;
  text: string | TextEntity[];
  text_entities?: TextEntity[];
  photo?: string;
  file?: string;
  media_type?: string;
  forwarded_from?: string;
  reply_to_message_id?: number;
}

export interface TextEntity {
  type: string;
  text: string;
  href?: string;
}

export interface TelegramChat {
  name: string;
  type: string;
  id: number;
  messages: TelegramMessage[];
}

export interface TelegramExport {
  about?: string;
  chats?: {
    about?: string;
    list: TelegramChat[];
  };
  personal_information?: unknown;
  contacts?: unknown;
}

export interface ChatSummary {
  name: string;
  type: string;
  id: number;
  messageCount: number;
  dateRange: {
    from: string;
    to: string;
  };
}

export type ExportFormat = 'html' | 'json';
