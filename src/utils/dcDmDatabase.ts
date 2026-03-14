/**
 * P2P DM IndexedDB Database (Dexie.js)
 * Per-user isolated database for local message storage
 */

import Dexie, { type Table } from 'dexie';
import type { DcDmMessage, DcDmConversation, DcDmKeyPair } from '@/types/DcDmTypes';

export class DcDmDatabase extends Dexie {
  messages!: Table<DcDmMessage, number>;
  conversations!: Table<DcDmConversation, string>;
  keyPairs!: Table<DcDmKeyPair, string>;

  constructor(userId: string) {
    super(`dcDm_${userId}`);

    this.version(1).stores({
      messages: '++id, conversationId, timestamp',
      conversations: 'id, peerUserId, lastTimestamp',
      keyPairs: 'id',
    });
  }
}

let currentDb: DcDmDatabase | null = null;
let currentUserId: string | null = null;

/** Get or create per-user database instance */
export function getDmDatabase(userId: string): DcDmDatabase {
  if (currentDb && currentUserId === userId) return currentDb;

  if (currentDb) {
    currentDb.close();
  }

  currentDb = new DcDmDatabase(userId);
  currentUserId = userId;
  return currentDb;
}

/** Close current database */
export function closeDmDatabase(): void {
  if (currentDb) {
    currentDb.close();
    currentDb = null;
    currentUserId = null;
  }
}
