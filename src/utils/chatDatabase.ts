import Dexie, { Table } from 'dexie';

export interface ChatMessage {
  _id: string; // Can be a temporary client-side ID or the final server-side ID
  channelId: string;
  text: string;
  timestamp: string;
  version: number;
  nickname: string;
  replyTo?: string;
  edited?: boolean;
  status: 'sending' | 'sent' | 'failed'; // NEW: To track the state of the message
}

export class ChatDatabase extends Dexie {
  messages!: Table<ChatMessage, string>;

  constructor() {
    super('ChatDatabase');
    // By incrementing the version, Dexie will automatically handle the schema migration.
    // We are indexing the 'status' field to make querying for failed messages efficient.
    this.version(2).stores({
      messages: '_id, channelId, timestamp, status'
    });
    // The old version definition must be kept for Dexie's upgrade process to work.
    this.version(1).stores({
      messages: '_id, channelId, timestamp, nickname, replyTo'
    });
  }
}

export const db = new ChatDatabase();