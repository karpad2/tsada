/**
 * DC (Discord-style) Chat Service
 * Real-time chat with PIN-based authentication and role-based permissions
 */

import { Databases, Query, ID } from 'appwrite';
import { appw, config } from '@/appwrite';

const DB = config.website_db;
const MESSAGES_COLL = config.dc_messages;
const BANS_COLL = config.dc_bans;
const REACTIONS_COLL = config.dc_reactions;
const ROLES_COLL = config.dc_roles;
const USERS_COLL = config.dc_users;

// ============================================
// TYPES
// ============================================

export interface DcMessage {
  $id?: string;
  nickname: string;
  text: string;
  channel: string;
  timestamp: string;
  clientId: string;
  replyTo?: string;
  replyToMsg?: DcMessage;
}

export interface DcBan {
  $id?: string;
  clientId: string;
  nickname: string;
  reason?: string;
  bannedBy: string;
  bannedAt: string;
}

export interface DcReaction {
  $id?: string;
  messageId: string;
  emoji: string;
  clientId: string;
  nickname: string;
}

export interface DcUser {
  $id?: string;
  nickname: string;
  pinHash: string;
  clientId: string;
  role?: DcRoleType;
  createdAt: string;
  lastSeen?: string;
}

// ============================================
// ROLES & PERMISSIONS
// ============================================

// DC Roles - hierarchikus sorrend (owner a legmagasabb)
export const DC_ROLES = {
  owner: {
    name: 'Owner',
    color: '#f44336',
    icon: 'mdi-crown',
    level: 100
  },
  admin: {
    name: 'Admin',
    color: '#ff9800',
    icon: 'mdi-shield-account',
    level: 80
  },
  moderator: {
    name: 'Moderátor',
    color: '#4caf50',
    icon: 'mdi-shield',
    level: 60
  },
  vip: {
    name: 'VIP',
    color: '#9c27b0',
    icon: 'mdi-star',
    level: 40
  },
  trusted: {
    name: 'Megbízható',
    color: '#2196f3',
    icon: 'mdi-account-check',
    level: 30
  },
  member: {
    name: 'Tag',
    color: '#607d8b',
    icon: 'mdi-account',
    level: 10
  }
} as const;

export type DcRoleType = keyof typeof DC_ROLES;

// Csatorna definíciók jogosultságokkal
export interface DcChannel {
  id: string;
  name: string;
  nameKey: string;
  icon: string;
  description?: string;
  descriptionKey?: string;
  // Minimum role ami láthatja a csatornát
  viewRole: DcRoleType;
  // Minimum role ami írhat a csatornába
  writeRole: DcRoleType;
  // Csak ezek a role-ok láthatják (override viewRole)
  restrictedTo?: DcRoleType[];
  // Lassú mód (másodperc)
  slowMode?: number;
}

export const DC_TEXT_CHANNELS: DcChannel[] = [
  {
    id: 'általános',
    name: 'általános',
    nameKey: 'dc_channel_altalanos',
    icon: 'mdi-pound',
    description: 'Általános beszélgetés',
    descriptionKey: 'dc_channel_desc_altalanos',
    viewRole: 'member',
    writeRole: 'member'
  },
  {
    id: 'bemutatkozás',
    name: 'bemutatkozás',
    nameKey: 'dc_channel_bemutatkozas',
    icon: 'mdi-hand-wave',
    description: 'Mutatkozz be!',
    descriptionKey: 'dc_channel_desc_bemutatkozas',
    viewRole: 'member',
    writeRole: 'member'
  },
  {
    id: 'mémek',
    name: 'mémek',
    nameKey: 'dc_channel_memek',
    icon: 'mdi-emoticon-lol',
    description: 'Mémek és vicces tartalmak',
    descriptionKey: 'dc_channel_desc_memek',
    viewRole: 'member',
    writeRole: 'member'
  },
  {
    id: 'tanulás',
    name: 'tanulás',
    nameKey: 'dc_channel_tanulas',
    icon: 'mdi-school',
    description: 'Tanulással kapcsolatos témák',
    descriptionKey: 'dc_channel_desc_tanulas',
    viewRole: 'member',
    writeRole: 'member'
  },
  {
    id: 'gaming',
    name: 'gaming',
    nameKey: 'dc_channel_gaming',
    icon: 'mdi-gamepad-variant',
    description: 'Játékokról beszélgetés',
    descriptionKey: 'dc_channel_desc_gaming',
    viewRole: 'member',
    writeRole: 'member'
  },
  {
    id: 'zene',
    name: 'zene',
    nameKey: 'dc_channel_zene',
    icon: 'mdi-music',
    description: 'Zenei ajánlók',
    descriptionKey: 'dc_channel_desc_zene',
    viewRole: 'member',
    writeRole: 'member'
  },
  // VIP+ csatornák
  {
    id: 'vip-lounge',
    name: 'vip-lounge',
    nameKey: 'dc_channel_vip_lounge',
    icon: 'mdi-star',
    description: 'VIP tagok exkluzív csatornája',
    descriptionKey: 'dc_channel_desc_vip_lounge',
    viewRole: 'vip',
    writeRole: 'vip'
  },
  // Staff csatornák
  {
    id: 'staff-chat',
    name: 'staff-chat',
    nameKey: 'dc_channel_staff_chat',
    icon: 'mdi-shield',
    description: 'Moderátorok és adminok csatornája',
    descriptionKey: 'dc_channel_desc_staff_chat',
    viewRole: 'moderator',
    writeRole: 'moderator'
  },
  {
    id: 'admin-only',
    name: 'admin-only',
    nameKey: 'dc_channel_admin_only',
    icon: 'mdi-shield-account',
    description: 'Csak adminok',
    descriptionKey: 'dc_channel_desc_admin_only',
    viewRole: 'admin',
    writeRole: 'admin'
  }
];

export const DC_VOICE_CHANNELS: DcChannel[] = [
  {
    id: 'voice-general',
    name: 'Általános',
    nameKey: 'dc_voice_general',
    icon: 'mdi-volume-high',
    viewRole: 'member',
    writeRole: 'member'
  },
  {
    id: 'voice-tanulas',
    name: 'Tanulás',
    nameKey: 'dc_voice_tanulas',
    icon: 'mdi-volume-high',
    viewRole: 'member',
    writeRole: 'member'
  },
  {
    id: 'voice-gaming',
    name: 'Gaming',
    nameKey: 'dc_voice_gaming',
    icon: 'mdi-volume-high',
    viewRole: 'member',
    writeRole: 'member'
  },
  {
    id: 'voice-vip',
    name: 'VIP Voice',
    nameKey: 'dc_voice_vip',
    icon: 'mdi-star',
    viewRole: 'vip',
    writeRole: 'vip'
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Egyszerű hash függvény PIN-hez (nem kriptográfiailag biztonságos, de elég erre a célra)
 */
export function hashPin(pin: string): string {
  let hash = 0;
  const str = pin + 'tsada_dc_salt_2024';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36) + '_' + pin.length;
}

/**
 * Ellenőrzi, hogy a role-nak van-e jogosultsága
 */
export function hasPermission(userRole: DcRoleType | undefined, requiredRole: DcRoleType): boolean {
  if (!userRole) return false;
  const userLevel = DC_ROLES[userRole]?.level || 0;
  const requiredLevel = DC_ROLES[requiredRole]?.level || 0;
  return userLevel >= requiredLevel;
}

/**
 * Ellenőrzi, hogy a felhasználó láthatja-e a csatornát
 */
export function canViewChannel(userRole: DcRoleType | undefined, channel: DcChannel): boolean {
  if (!userRole) return false;

  // Ha van restrictedTo, csak azok láthatják
  if (channel.restrictedTo && channel.restrictedTo.length > 0) {
    return channel.restrictedTo.includes(userRole);
  }

  return hasPermission(userRole, channel.viewRole);
}

/**
 * Ellenőrzi, hogy a felhasználó írhat-e a csatornába
 */
export function canWriteChannel(userRole: DcRoleType | undefined, channel: DcChannel): boolean {
  if (!userRole) return false;

  // Ha van restrictedTo, csak azok írhatnak
  if (channel.restrictedTo && channel.restrictedTo.length > 0) {
    return channel.restrictedTo.includes(userRole);
  }

  return hasPermission(userRole, channel.writeRole);
}

/**
 * Ellenőrzi, hogy a felhasználónak van-e moderálási joga
 */
export function canModerate(userRole: DcRoleType | undefined): boolean {
  return hasPermission(userRole, 'moderator');
}

/**
 * Ellenőrzi, hogy a felhasználó admin-e
 */
export function isAdmin(userRole: DcRoleType | undefined): boolean {
  return hasPermission(userRole, 'admin');
}

// ============================================
// SERVICE CLASS
// ============================================

export class DcChatService {
  private databases: Databases;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.databases = new Databases(appw);
  }

  // ==================== CLIENT ID ====================

  /**
   * Get or create a persistent client ID (stored in localStorage)
   */
  static getClientId(): string {
    let id = localStorage.getItem('dc_client_id');
    if (!id) {
      id = 'dc_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('dc_client_id', id);
    }
    return id;
  }

  // ==================== USER AUTHENTICATION ====================

  /**
   * Regisztrál egy új felhasználót
   */
  async register(nickname: string, pin: string): Promise<{ success: boolean; error?: string; user?: DcUser }> {
    try {
      // Ellenőrizzük, hogy a nickname foglalt-e
      const existing = await this.databases.listDocuments(
        DB,
        USERS_COLL,
        [Query.equal('nickname', nickname), Query.limit(1)]
      );

      if (existing.documents.length > 0) {
        return { success: false, error: 'Ez a név már foglalt!' };
      }

      // PIN validáció (4-8 karakter)
      if (pin.length < 4 || pin.length > 8) {
        return { success: false, error: 'A PIN-nek 4-8 karakter hosszúnak kell lennie!' };
      }

      // Létrehozzuk a felhasználót
      const clientId = DcChatService.getClientId();
      const doc = await this.databases.createDocument(
        DB,
        USERS_COLL,
        ID.unique(),
        {
          nickname,
          pinHash: hashPin(pin),
          clientId,
          role: 'member',
          createdAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        }
      );

      const user = doc as unknown as DcUser;

      // Mentjük localStorage-ba
      localStorage.setItem('dc_nickname', nickname);
      localStorage.setItem('dc_user_id', doc.$id);

      return { success: true, user };
    } catch (error: any) {
      console.error('Registration failed:', error);
      if (error.code === 409) {
        return { success: false, error: 'Ez a név már foglalt!' };
      }
      return { success: false, error: 'Hiba történt a regisztráció során!' };
    }
  }

  /**
   * Bejelentkezés PIN-nel
   */
  async login(nickname: string, pin: string): Promise<{ success: boolean; error?: string; user?: DcUser }> {
    try {
      const result = await this.databases.listDocuments(
        DB,
        USERS_COLL,
        [Query.equal('nickname', nickname), Query.limit(1)]
      );

      if (result.documents.length === 0) {
        return { success: false, error: 'Nincs ilyen felhasználó!' };
      }

      const user = result.documents[0] as unknown as DcUser;

      // PIN ellenőrzés
      if (user.pinHash !== hashPin(pin)) {
        return { success: false, error: 'Hibás PIN!' };
      }

      // Frissítjük a clientId-t és lastSeen-t
      const clientId = DcChatService.getClientId();
      await this.databases.updateDocument(
        DB,
        USERS_COLL,
        user.$id!,
        {
          clientId,
          lastSeen: new Date().toISOString()
        }
      );

      // Mentjük localStorage-ba
      localStorage.setItem('dc_nickname', nickname);
      localStorage.setItem('dc_user_id', user.$id!);

      return { success: true, user: { ...user, clientId } };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Hiba történt a bejelentkezés során!' };
    }
  }

  /**
   * Kijelentkezés
   */
  logout(): void {
    localStorage.removeItem('dc_nickname');
    localStorage.removeItem('dc_user_id');
  }

  /**
   * Aktuális felhasználó lekérése (localStorage + DB)
   */
  async getCurrentUser(): Promise<DcUser | null> {
    const nickname = localStorage.getItem('dc_nickname');
    const userId = localStorage.getItem('dc_user_id');

    if (!nickname || !userId) {
      return null;
    }

    try {
      const doc = await this.databases.getDocument(DB, USERS_COLL, userId);
      return doc as unknown as DcUser;
    } catch (error) {
      // Ha nem találja, töröljük a localStorage-t
      this.logout();
      return null;
    }
  }

  /**
   * Felhasználó lekérése nickname alapján
   */
  async getUserByNickname(nickname: string): Promise<DcUser | null> {
    try {
      const result = await this.databases.listDocuments(
        DB,
        USERS_COLL,
        [Query.equal('nickname', nickname), Query.limit(1)]
      );

      if (result.documents.length > 0) {
        return result.documents[0] as unknown as DcUser;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  /**
   * Összes felhasználó lekérése
   */
  async getAllUsers(): Promise<DcUser[]> {
    try {
      const result = await this.databases.listDocuments(
        DB,
        USERS_COLL,
        [Query.limit(500), Query.orderDesc('lastSeen')]
      );
      return result.documents as unknown as DcUser[];
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  /**
   * Felhasználó role-jának módosítása (admin/owner only)
   */
  async setUserRole(userId: string, role: DcRoleType): Promise<boolean> {
    try {
      await this.databases.updateDocument(
        DB,
        USERS_COLL,
        userId,
        { role }
      );
      return true;
    } catch (error) {
      console.error('Failed to set user role:', error);
      return false;
    }
  }

  // ==================== MESSAGES ====================

  /**
   * Send a message
   */
  async sendMessage(nickname: string, text: string, channel: string, replyTo?: string): Promise<DcMessage | null> {
    try {
      const data: any = {
        nickname,
        text,
        channel,
        timestamp: new Date().toISOString(),
        clientId: DcChatService.getClientId()
      };

      if (replyTo) {
        data.replyTo = replyTo;
      }

      const doc = await this.databases.createDocument(
        DB,
        MESSAGES_COLL,
        ID.unique(),
        data
      );
      return this.parseMessage(doc);
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }

  /**
   * Load recent messages for a channel
   */
  async getMessages(channel: string, limit: number = 50): Promise<DcMessage[]> {
    try {
      const result = await this.databases.listDocuments(
        DB,
        MESSAGES_COLL,
        [
          Query.equal('channel', channel),
          Query.orderDesc('timestamp'),
          Query.limit(limit)
        ]
      );
      return result.documents.map(doc => this.parseMessage(doc)).reverse();
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time messages
   */
  subscribeToMessages(channel: string, onMessage: (msg: DcMessage) => void): void {
    this.unsubscribe?.();
    this.unsubscribe = appw.subscribe(
      `databases.${DB}.collections.${MESSAGES_COLL}.documents`,
      (response: any) => {
        if (response.events.some((e: string) => e.includes('.create'))) {
          const msg = this.parseMessage(response.payload);
          if (msg.channel === channel) {
            onMessage(msg);
          }
        }
      }
    );
  }

  /**
   * Unsubscribe from real-time
   */
  unsubscribeFromMessages(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /**
   * Delete a message (moderator+)
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      await this.databases.deleteDocument(DB, MESSAGES_COLL, messageId);
      return true;
    } catch (error) {
      console.error('Failed to delete message:', error);
      return false;
    }
  }

  private parseMessage(doc: any): DcMessage {
    return {
      $id: doc.$id,
      nickname: doc.nickname,
      text: doc.text,
      channel: doc.channel,
      timestamp: doc.timestamp || doc.$createdAt,
      clientId: doc.clientId,
      replyTo: doc.replyTo || undefined
    };
  }

  // ==================== BANS ====================

  /**
   * Check if client is banned
   */
  async isBanned(clientId: string): Promise<DcBan | null> {
    try {
      const result = await this.databases.listDocuments(
        DB,
        BANS_COLL,
        [Query.equal('clientId', clientId), Query.limit(1)]
      );
      if (result.documents.length > 0) {
        return result.documents[0] as unknown as DcBan;
      }
      return null;
    } catch (error) {
      console.error('Failed to check ban:', error);
      return null;
    }
  }

  /**
   * Check if nickname is banned
   */
  async isNicknameBanned(nickname: string): Promise<DcBan | null> {
    try {
      const result = await this.databases.listDocuments(
        DB,
        BANS_COLL,
        [Query.equal('nickname', nickname), Query.limit(1)]
      );
      if (result.documents.length > 0) {
        return result.documents[0] as unknown as DcBan;
      }
      return null;
    } catch (error) {
      console.error('Failed to check ban:', error);
      return null;
    }
  }

  /**
   * Ban a user (moderator+)
   */
  async banUser(user: DcUser, reason: string, bannedBy: string): Promise<boolean> {
    try {
      await this.databases.createDocument(
        DB,
        BANS_COLL,
        ID.unique(),
        {
          clientId: user.clientId,
          nickname: user.nickname,
          reason,
          bannedBy,
          bannedAt: new Date().toISOString()
        }
      );
      return true;
    } catch (error) {
      console.error('Failed to ban user:', error);
      return false;
    }
  }

  /**
   * Unban a user (moderator+)
   */
  async unbanUser(banId: string): Promise<boolean> {
    try {
      await this.databases.deleteDocument(DB, BANS_COLL, banId);
      return true;
    } catch (error) {
      console.error('Failed to unban:', error);
      return false;
    }
  }

  /**
   * Get all bans (moderator+)
   */
  async getAllBans(): Promise<DcBan[]> {
    try {
      const result = await this.databases.listDocuments(
        DB,
        BANS_COLL,
        [Query.limit(200)]
      );
      return result.documents as unknown as DcBan[];
    } catch (error) {
      console.error('Failed to get bans:', error);
      return [];
    }
  }

  // ==================== REACTIONS ====================

  /**
   * Add/remove reaction to a message
   */
  async toggleReaction(messageId: string, emoji: string, nickname: string): Promise<DcReaction | null> {
    try {
      const clientId = DcChatService.getClientId();

      // Check if already reacted with this emoji
      const existing = await this.databases.listDocuments(
        DB,
        REACTIONS_COLL,
        [
          Query.equal('messageId', messageId),
          Query.equal('emoji', emoji),
          Query.equal('clientId', clientId),
          Query.limit(1)
        ]
      );

      if (existing.documents.length > 0) {
        // Toggle off - remove reaction
        await this.databases.deleteDocument(DB, REACTIONS_COLL, existing.documents[0].$id);
        return null;
      }

      // Add new reaction
      const doc = await this.databases.createDocument(
        DB,
        REACTIONS_COLL,
        ID.unique(),
        { messageId, emoji, clientId, nickname }
      );
      return doc as unknown as DcReaction;
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
      return null;
    }
  }

  /**
   * Get reactions for messages (batched)
   */
  async getReactionsForMessages(messageIds: string[]): Promise<Record<string, DcReaction[]>> {
    try {
      if (messageIds.length === 0) return {};

      const result = await this.databases.listDocuments(
        DB,
        REACTIONS_COLL,
        [Query.equal('messageId', messageIds), Query.limit(500)]
      );

      const grouped: Record<string, DcReaction[]> = {};
      for (const doc of result.documents) {
        const reaction = doc as unknown as DcReaction;
        if (!grouped[reaction.messageId]) {
          grouped[reaction.messageId] = [];
        }
        grouped[reaction.messageId].push(reaction);
      }
      return grouped;
    } catch (error) {
      console.error('Failed to get reactions:', error);
      return {};
    }
  }

  /**
   * Subscribe to reactions changes
   */
  subscribeToReactions(onReaction: (reaction: DcReaction, isDelete: boolean) => void): () => void {
    return appw.subscribe(
      `databases.${DB}.collections.${REACTIONS_COLL}.documents`,
      (response: any) => {
        const isDelete = response.events.some((e: string) => e.includes('.delete'));
        const isCreate = response.events.some((e: string) => e.includes('.create'));
        if (isCreate || isDelete) {
          onReaction(response.payload as DcReaction, isDelete);
        }
      }
    );
  }
}

export default new DcChatService();
