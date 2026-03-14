/**
 * DC (Discord-style) Chat Service
 * Real-time chat with PIN-based authentication and role-based permissions
 */

import { Databases, Query, ID, Storage } from 'appwrite';
import { appw, config } from '@/appwrite';
import { generateServerKey, generateInviteCode, encrypt, decrypt } from '@/utils/dcEncryption';

const DB = config.website_db;
const MESSAGES_COLL = config.dc_messages;
const BANS_COLL = config.dc_bans;
const REACTIONS_COLL = config.dc_reactions;
const ROLES_COLL = config.dc_roles;
const USERS_COLL = config.dc_users;
const SERVERS_COLL = config.dc_servers;
const SERVER_MEMBERS_COLL = config.dc_server_members;
const SERVER_CHANNELS_COLL = config.dc_server_channels;
const CUSTOM_EMOJIS_COLL = config.dc_custom_emojis;
const CONTACTS_COLL = config.dc_contacts;
const IMAGES_BUCKET = config.website_images;

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

export interface DcServer {
  $id?: string;
  name: string;
  icon: string;
  owner_id: string;
  description: string;
  invite_code: string;
  encryption_key: string;
  is_public: boolean;
  banner_color: string;
  created_at: string;
}

export interface DcServerMember {
  $id?: string;
  server_id: string;
  user_id: string;
  nickname: string;
  role: DcRoleType;
  joined_at: string;
}

export interface DcServerChannel {
  $id?: string;
  server_id: string;
  name: string;
  type: 'text' | 'voice';
  icon: string;
  order: number;
  view_role: string;
  write_role: string;
  topic: string;
  slowmode: number;
}

export interface DcCustomEmoji {
  $id?: string;
  server_id: string;
  name: string;
  file_id: string;
  uploaded_by: string;
  created_at: string;
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
  private storage: Storage;
  private unsubscribe: (() => void) | null = null;
  // Cache encryption keys in memory (never localStorage)
  private encryptionKeyCache: Map<string, string> = new Map();

  constructor() {
    this.databases = new Databases(appw);
    this.storage = new Storage(appw);
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
    } catch (error: any) {
      console.error('Login failed:', error);
      const msg = error?.message || error?.toString() || 'Ismeretlen hiba';
      return { success: false, error: `Hiba történt a bejelentkezésnél: ${msg}` };
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

  // ==================== SERVERS ====================

  /**
   * Create a new server with auto-generated encryption key and invite code
   */
  async createServer(name: string, icon: string, description: string, userId: string, nickname: string, isPublic: boolean = false): Promise<DcServer | null> {
    try {
      const encKey = await generateServerKey();
      const inviteCode = generateInviteCode();

      const doc = await this.databases.createDocument(
        DB, SERVERS_COLL, ID.unique(),
        {
          name,
          icon: icon || '🖥️',
          owner_id: userId,
          description,
          invite_code: inviteCode,
          encryption_key: encKey,
          is_public: isPublic,
          banner_color: '',
          created_at: new Date().toISOString()
        }
      );

      const server = doc as unknown as DcServer;

      // Add owner as member with 'owner' role
      await this.databases.createDocument(
        DB, SERVER_MEMBERS_COLL, ID.unique(),
        {
          server_id: doc.$id,
          user_id: userId,
          nickname,
          role: 'owner',
          joined_at: new Date().toISOString()
        }
      );

      // Create default channels
      await this.createChannel(doc.$id, 'általános', 'text', 'mdi-pound', 0);
      await this.createChannel(doc.$id, 'Általános', 'voice', 'mdi-volume-high', 0);

      // Cache encryption key
      this.encryptionKeyCache.set(doc.$id, encKey);

      return server;
    } catch (error) {
      console.error('Failed to create server:', error);
      return null;
    }
  }

  /**
   * Get servers the user is a member of
   */
  async getMyServers(userId: string): Promise<DcServer[]> {
    try {
      // First get memberships
      const memberships = await this.databases.listDocuments(
        DB, SERVER_MEMBERS_COLL,
        [Query.equal('user_id', userId), Query.limit(100)]
      );

      if (memberships.documents.length === 0) return [];

      const serverIds = memberships.documents.map(m => m.server_id);

      // Fetch all servers in parallel
      const results = await Promise.allSettled(
        serverIds.map(sid => this.databases.getDocument(DB, SERVERS_COLL, sid))
      );

      return results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value as unknown as DcServer);
    } catch (error) {
      console.error('Failed to get my servers:', error);
      return [];
    }
  }

  /**
   * Get public servers
   */
  async getPublicServers(): Promise<DcServer[]> {
    try {
      const result = await this.databases.listDocuments(
        DB, SERVERS_COLL,
        [Query.equal('is_public', true), Query.limit(50), Query.orderDesc('$createdAt')]
      );
      return result.documents as unknown as DcServer[];
    } catch (error) {
      console.error('Failed to get public servers:', error);
      return [];
    }
  }

  /**
   * Get a single server by ID
   */
  async getServer(serverId: string): Promise<DcServer | null> {
    try {
      const doc = await this.databases.getDocument(DB, SERVERS_COLL, serverId);
      return doc as unknown as DcServer;
    } catch (error) {
      console.error('Failed to get server:', error);
      return null;
    }
  }

  /**
   * Join a server by invite code
   */
  async joinServer(inviteCode: string, userId: string, nickname: string): Promise<{ success: boolean; server?: DcServer; error?: string }> {
    try {
      const result = await this.databases.listDocuments(
        DB, SERVERS_COLL,
        [Query.equal('invite_code', inviteCode), Query.limit(1)]
      );

      if (result.documents.length === 0) {
        return { success: false, error: 'Érvénytelen meghívó kód!' };
      }

      const server = result.documents[0] as unknown as DcServer;

      // Check if already a member
      const existing = await this.databases.listDocuments(
        DB, SERVER_MEMBERS_COLL,
        [Query.equal('server_id', server.$id!), Query.equal('user_id', userId), Query.limit(1)]
      );

      if (existing.documents.length > 0) {
        return { success: false, error: 'Már tag vagy ezen a szerveren!' };
      }

      // Add as member
      await this.databases.createDocument(
        DB, SERVER_MEMBERS_COLL, ID.unique(),
        {
          server_id: server.$id,
          user_id: userId,
          nickname,
          role: 'member',
          joined_at: new Date().toISOString()
        }
      );

      return { success: true, server };
    } catch (error) {
      console.error('Failed to join server:', error);
      return { success: false, error: 'Hiba történt a csatlakozásnál!' };
    }
  }

  /**
   * Join a public server directly
   */
  async joinPublicServer(serverId: string, userId: string, nickname: string): Promise<{ success: boolean; error?: string }> {
    try {
      const server = await this.databases.getDocument(DB, SERVERS_COLL, serverId);
      if (!server.is_public) {
        return { success: false, error: 'Ez nem publikus szerver!' };
      }

      // Check if already a member
      const existing = await this.databases.listDocuments(
        DB, SERVER_MEMBERS_COLL,
        [Query.equal('server_id', serverId), Query.equal('user_id', userId), Query.limit(1)]
      );

      if (existing.documents.length > 0) {
        return { success: false, error: 'Már tag vagy ezen a szerveren!' };
      }

      await this.databases.createDocument(
        DB, SERVER_MEMBERS_COLL, ID.unique(),
        {
          server_id: serverId,
          user_id: userId,
          nickname,
          role: 'member',
          joined_at: new Date().toISOString()
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to join public server:', error);
      return { success: false, error: 'Hiba történt!' };
    }
  }

  /**
   * Leave a server
   */
  async leaveServer(serverId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.databases.listDocuments(
        DB, SERVER_MEMBERS_COLL,
        [Query.equal('server_id', serverId), Query.equal('user_id', userId), Query.limit(1)]
      );

      if (result.documents.length > 0) {
        await this.databases.deleteDocument(DB, SERVER_MEMBERS_COLL, result.documents[0].$id);
      }

      this.encryptionKeyCache.delete(serverId);
      return true;
    } catch (error) {
      console.error('Failed to leave server:', error);
      return false;
    }
  }

  /**
   * Delete a server and all its data (owner only)
   */
  async deleteServer(serverId: string): Promise<boolean> {
    try {
      // Fetch all related data in parallel
      const [members, channels, emojis] = await Promise.all([
        this.databases.listDocuments(DB, SERVER_MEMBERS_COLL, [Query.equal('server_id', serverId), Query.limit(500)]),
        this.databases.listDocuments(DB, SERVER_CHANNELS_COLL, [Query.equal('server_id', serverId), Query.limit(100)]),
        this.databases.listDocuments(DB, CUSTOM_EMOJIS_COLL, [Query.equal('server_id', serverId), Query.limit(500)])
      ]);

      // Delete all related data in parallel
      await Promise.all([
        ...members.documents.map(m => this.databases.deleteDocument(DB, SERVER_MEMBERS_COLL, m.$id)),
        ...channels.documents.map(c => this.databases.deleteDocument(DB, SERVER_CHANNELS_COLL, c.$id)),
        ...emojis.documents.map(async e => {
          try { await this.storage.deleteFile(IMAGES_BUCKET, e.file_id); } catch {}
          await this.databases.deleteDocument(DB, CUSTOM_EMOJIS_COLL, e.$id);
        })
      ]);

      // Delete server
      await this.databases.deleteDocument(DB, SERVERS_COLL, serverId);
      this.encryptionKeyCache.delete(serverId);

      return true;
    } catch (error) {
      console.error('Failed to delete server:', error);
      return false;
    }
  }

  /**
   * Update server settings (owner/admin)
   */
  async updateServer(serverId: string, data: Partial<Pick<DcServer, 'name' | 'icon' | 'description' | 'is_public' | 'banner_color'>>): Promise<boolean> {
    try {
      await this.databases.updateDocument(DB, SERVERS_COLL, serverId, data);
      return true;
    } catch (error) {
      console.error('Failed to update server:', error);
      return false;
    }
  }

  /**
   * Regenerate invite code (owner/admin)
   */
  async regenerateInviteCode(serverId: string): Promise<string | null> {
    try {
      const newCode = generateInviteCode();
      await this.databases.updateDocument(DB, SERVERS_COLL, serverId, { invite_code: newCode });
      return newCode;
    } catch (error) {
      console.error('Failed to regenerate invite code:', error);
      return null;
    }
  }

  // ==================== SERVER MEMBERS ====================

  /**
   * Get members of a server
   */
  async getServerMembers(serverId: string): Promise<DcServerMember[]> {
    try {
      const result = await this.databases.listDocuments(
        DB, SERVER_MEMBERS_COLL,
        [Query.equal('server_id', serverId), Query.limit(500)]
      );
      return result.documents as unknown as DcServerMember[];
    } catch (error) {
      console.error('Failed to get server members:', error);
      return [];
    }
  }

  /**
   * Get user's membership in a server
   */
  async getServerMembership(serverId: string, userId: string): Promise<DcServerMember | null> {
    try {
      const result = await this.databases.listDocuments(
        DB, SERVER_MEMBERS_COLL,
        [Query.equal('server_id', serverId), Query.equal('user_id', userId), Query.limit(1)]
      );
      return result.documents.length > 0 ? result.documents[0] as unknown as DcServerMember : null;
    } catch (error) {
      console.error('Failed to get membership:', error);
      return null;
    }
  }

  /**
   * Update member role (owner/admin only)
   */
  async setMemberRole(memberId: string, role: DcRoleType): Promise<boolean> {
    try {
      await this.databases.updateDocument(DB, SERVER_MEMBERS_COLL, memberId, { role });
      return true;
    } catch (error) {
      console.error('Failed to set member role:', error);
      return false;
    }
  }

  /**
   * Kick a member (owner/admin only)
   */
  async kickMember(memberId: string): Promise<boolean> {
    try {
      await this.databases.deleteDocument(DB, SERVER_MEMBERS_COLL, memberId);
      return true;
    } catch (error) {
      console.error('Failed to kick member:', error);
      return false;
    }
  }

  // ==================== SERVER CHANNELS ====================

  /**
   * Get channels of a server
   */
  async getServerChannels(serverId: string): Promise<DcServerChannel[]> {
    try {
      const result = await this.databases.listDocuments(
        DB, SERVER_CHANNELS_COLL,
        [Query.equal('server_id', serverId), Query.limit(100), Query.orderAsc('order')]
      );
      return result.documents as unknown as DcServerChannel[];
    } catch (error) {
      console.error('Failed to get server channels:', error);
      return [];
    }
  }

  /**
   * Create a channel in a server
   */
  async createChannel(serverId: string, name: string, type: 'text' | 'voice', icon: string, order: number = 0): Promise<DcServerChannel | null> {
    try {
      const doc = await this.databases.createDocument(
        DB, SERVER_CHANNELS_COLL, ID.unique(),
        {
          server_id: serverId,
          name,
          type,
          icon: icon || (type === 'text' ? 'mdi-pound' : 'mdi-volume-high'),
          order,
          view_role: 'member',
          write_role: 'member',
          topic: '',
          slowmode: 0
        }
      );
      return doc as unknown as DcServerChannel;
    } catch (error) {
      console.error('Failed to create channel:', error);
      return null;
    }
  }

  /**
   * Update a channel
   */
  async updateChannel(channelId: string, data: Partial<Pick<DcServerChannel, 'name' | 'icon' | 'order' | 'view_role' | 'write_role' | 'topic' | 'slowmode'>>): Promise<boolean> {
    try {
      await this.databases.updateDocument(DB, SERVER_CHANNELS_COLL, channelId, data);
      return true;
    } catch (error) {
      console.error('Failed to update channel:', error);
      return false;
    }
  }

  /**
   * Delete a channel
   */
  async deleteChannel(channelId: string): Promise<boolean> {
    try {
      await this.databases.deleteDocument(DB, SERVER_CHANNELS_COLL, channelId);
      return true;
    } catch (error) {
      console.error('Failed to delete channel:', error);
      return false;
    }
  }

  // ==================== CUSTOM EMOJIS ====================

  /**
   * Upload a custom emoji to a server
   */
  async uploadEmoji(serverId: string, name: string, file: File, uploadedBy: string): Promise<DcCustomEmoji | null> {
    try {
      // Upload file to storage
      const uploaded = await this.storage.createFile(IMAGES_BUCKET, ID.unique(), file);

      // Create emoji record
      const doc = await this.databases.createDocument(
        DB, CUSTOM_EMOJIS_COLL, ID.unique(),
        {
          server_id: serverId,
          name: name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          file_id: uploaded.$id,
          uploaded_by: uploadedBy,
          created_at: new Date().toISOString()
        }
      );

      return doc as unknown as DcCustomEmoji;
    } catch (error) {
      console.error('Failed to upload emoji:', error);
      return null;
    }
  }

  /**
   * Get all custom emojis for a server
   */
  async getServerEmojis(serverId: string): Promise<DcCustomEmoji[]> {
    try {
      const result = await this.databases.listDocuments(
        DB, CUSTOM_EMOJIS_COLL,
        [Query.equal('server_id', serverId), Query.limit(200)]
      );
      return result.documents as unknown as DcCustomEmoji[];
    } catch (error) {
      console.error('Failed to get server emojis:', error);
      return [];
    }
  }

  /**
   * Delete a custom emoji
   */
  async deleteEmoji(emojiId: string, fileId: string): Promise<boolean> {
    try {
      try { await this.storage.deleteFile(IMAGES_BUCKET, fileId); } catch {}
      await this.databases.deleteDocument(DB, CUSTOM_EMOJIS_COLL, emojiId);
      return true;
    } catch (error) {
      console.error('Failed to delete emoji:', error);
      return false;
    }
  }

  /**
   * Get the URL for a custom emoji image
   */
  getEmojiUrl(fileId: string): string {
    return `https://appwrite.tsada.edu.rs/v1/storage/buckets/${IMAGES_BUCKET}/files/${fileId}/view?project=659ea7f886cf55d4528a`;
  }

  // ==================== ENCRYPTED MESSAGES ====================

  /**
   * Get or cache encryption key for a server
   */
  async getEncryptionKey(serverId: string): Promise<string | null> {
    const cached = this.encryptionKeyCache.get(serverId);
    if (cached) return cached;

    try {
      const server = await this.databases.getDocument(DB, SERVERS_COLL, serverId);
      const key = server.encryption_key;
      if (key) {
        this.encryptionKeyCache.set(serverId, key);
      }
      return key || null;
    } catch (error) {
      console.error('Failed to get encryption key:', error);
      return null;
    }
  }

  /**
   * Send an encrypted message to a server channel
   */
  async sendServerMessage(nickname: string, text: string, serverId: string, channelId: string, replyTo?: string): Promise<DcMessage | null> {
    try {
      const encKey = await this.getEncryptionKey(serverId);
      const encryptedText = encKey ? await encrypt(text, encKey) : text;

      const data: any = {
        nickname,
        text: encryptedText,
        channel: channelId,
        server_id: serverId,
        timestamp: new Date().toISOString(),
        clientId: DcChatService.getClientId()
      };

      if (replyTo) {
        data.replyTo = replyTo;
      }

      const doc = await this.databases.createDocument(DB, MESSAGES_COLL, ID.unique(), data);
      // Return with decrypted text for local display
      const msg = this.parseMessage(doc);
      msg.text = text; // Show plaintext locally
      return msg;
    } catch (error) {
      console.error('Failed to send server message:', error);
      return null;
    }
  }

  /**
   * Load messages for a server channel (auto-decrypts)
   */
  async getServerMessages(serverId: string, channelId: string, limit: number = 50): Promise<DcMessage[]> {
    try {
      const result = await this.databases.listDocuments(
        DB, MESSAGES_COLL,
        [
          Query.equal('server_id', serverId),
          Query.equal('channel', channelId),
          Query.orderDesc('timestamp'),
          Query.limit(limit)
        ]
      );

      const encKey = await this.getEncryptionKey(serverId);
      const messages = result.documents.map(doc => this.parseMessage(doc)).reverse();

      // Decrypt messages
      if (encKey) {
        for (const msg of messages) {
          try {
            msg.text = await decrypt(msg.text, encKey);
          } catch {
            // Message might not be encrypted (old messages)
          }
        }
      }

      return messages;
    } catch (error) {
      console.error('Failed to load server messages:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time messages for a server channel (auto-decrypts)
   */
  subscribeToServerMessages(serverId: string, channelId: string, onMessage: (msg: DcMessage) => void): void {
    this.unsubscribe?.();
    this.unsubscribe = appw.subscribe(
      `databases.${DB}.collections.${MESSAGES_COLL}.documents`,
      async (response: any) => {
        if (response.events.some((e: string) => e.includes('.create'))) {
          const msg = this.parseMessage(response.payload);
          if (msg.channel === channelId && response.payload.server_id === serverId) {
            // Decrypt
            const encKey = await this.getEncryptionKey(serverId);
            if (encKey) {
              try {
                msg.text = await decrypt(msg.text, encKey);
              } catch {
                // Not encrypted or decryption failed
              }
            }
            onMessage(msg);
          }
        }
      }
    );
  }

  // ==================== VOICE SIGNALING ====================

  /**
   * Send a voice signaling message (offer, answer, ice candidate)
   */
  async sendVoiceSignal(nickname: string, type: string, target: string, data?: any): Promise<boolean> {
    const payload = data ? `__${type}__${target}__${JSON.stringify(data)}` : `__${type}__${target}`;
    const result = await this.sendMessage(nickname, payload, '__voice_signaling__');
    if (!result) {
      console.error('[VoiceSignal] Failed to send:', type, 'payload length:', payload.length);
    }
    return !!result;
  }

  /**
   * Subscribe to voice signaling channel
   * Returns unsubscribe function
   */
  subscribeToVoiceSignaling(
    myNickname: string,
    onSignal: (type: string, from: string, channelOrTarget: string, data?: any) => void
  ): () => void {
    return appw.subscribe(
      `databases.${DB}.collections.${MESSAGES_COLL}.documents`,
      (response: any) => {
        if (!response.events.some((e: string) => e.includes('.create'))) return;

        const msg = response.payload;
        if (msg.channel !== '__voice_signaling__') return;
        if (msg.nickname === myNickname) return; // Skip own messages

        const text: string = msg.text;

        // Broadcast types: __TYPE__channelId (no target filtering)
        const broadcastTypes = ['VOICE_JOIN', 'VOICE_LEAVE', 'VOICE_PING', 'VOICE_SCREEN_STOP', 'VOICE_CAMERA_STOP'];
        for (const t of broadcastTypes) {
          const prefix = `__${t}__`;
          if (text.startsWith(prefix)) {
            onSignal(t, msg.nickname, text.substring(prefix.length));
            return;
          }
        }

        // Targeted types: __TYPE__target__JSON (filtered to myNickname)
        const targetedTypes = ['VOICE_OFFER', 'VOICE_ANSWER', 'VOICE_ICE', 'VOICE_SOUNDBOARD'];
        for (const t of targetedTypes) {
          const prefix = `__${t}__`;
          if (!text.startsWith(prefix)) continue;
          const rest = text.substring(prefix.length);
          const sepIdx = rest.indexOf('__');
          if (sepIdx === -1) continue;
          const target = rest.substring(0, sepIdx);
          if (target !== myNickname) return;
          try {
            const data = JSON.parse(rest.substring(sepIdx + 2));
            onSignal(t, msg.nickname, target, data);
          } catch { /* ignore parse errors */ }
          return;
        }

        // Broadcast types with optional JSON data: __TYPE__channelId or __TYPE__channelId__JSON
        const broadcastWithDataTypes = ['VOICE_SCREEN_START', 'VOICE_CAMERA_START'];
        for (const t of broadcastWithDataTypes) {
          const prefix = `__${t}__`;
          if (!text.startsWith(prefix)) continue;
          const rest = text.substring(prefix.length);
          const sepIdx = rest.indexOf('__');
          if (sepIdx === -1) {
            onSignal(t, msg.nickname, rest);
          } else {
            const channelId = rest.substring(0, sepIdx);
            try {
              const data = JSON.parse(rest.substring(sepIdx + 2));
              onSignal(t, msg.nickname, channelId, data);
            } catch { onSignal(t, msg.nickname, channelId); }
          }
          return;
        }
      }
    );
  }

  /**
   * Subscribe to voice presence updates (JOIN/LEAVE/PING) - for sidebar display.
   * This runs independently of VoiceManager and updates the UI for all users.
   * Returns unsubscribe function.
   */
  subscribeToVoicePresence(
    onJoin: (nickname: string, channelId: string) => void,
    onLeave: (nickname: string, channelId: string) => void
  ): () => void {
    return appw.subscribe(
      `databases.${DB}.collections.${MESSAGES_COLL}.documents`,
      (response: any) => {
        if (!response.events.some((e: string) => e.includes('.create'))) return;

        const msg = response.payload;
        if (msg.channel !== '__voice_signaling__') return;

        const text: string = msg.text;

        if (text.startsWith('__VOICE_JOIN__')) {
          const channelId = text.replace('__VOICE_JOIN__', '');
          onJoin(msg.nickname, channelId);
        } else if (text.startsWith('__VOICE_LEAVE__')) {
          const channelId = text.replace('__VOICE_LEAVE__', '');
          onLeave(msg.nickname, channelId);
        } else if (text.startsWith('__VOICE_PING__')) {
          // Heartbeat - ensure user is shown as present
          const channelId = text.replace('__VOICE_PING__', '');
          onJoin(msg.nickname, channelId);
        }
      }
    );
  }

  // ==================== DM CONTACTS ====================

  /**
   * Add a contact (stores ECDH public key for E2EE)
   */
  async addContact(ownerId: string, contactId: string, contactNickname: string, ecdhPublicKey: string): Promise<boolean> {
    try {
      // Check if already exists
      const existing = await this.databases.listDocuments(DB, CONTACTS_COLL, [
        Query.equal('owner_id', ownerId),
        Query.equal('contact_id', contactId),
        Query.limit(1),
      ]);
      if (existing.documents.length > 0) return true;

      await this.databases.createDocument(DB, CONTACTS_COLL, ID.unique(), {
        owner_id: ownerId,
        contact_id: contactId,
        contact_nickname: contactNickname,
        ecdh_public_key: ecdhPublicKey,
        added_at: new Date().toISOString(),
        blocked: false,
      });
      return true;
    } catch (error) {
      console.error('Failed to add contact:', error);
      return false;
    }
  }

  /**
   * Get all contacts for a user
   */
  async getContacts(ownerId: string): Promise<any[]> {
    try {
      const result = await this.databases.listDocuments(DB, CONTACTS_COLL, [
        Query.equal('owner_id', ownerId),
        Query.limit(200),
        Query.orderDesc('added_at'),
      ]);
      return result.documents;
    } catch (error) {
      console.error('Failed to get contacts:', error);
      return [];
    }
  }

  /**
   * Get a specific contact by peer user ID
   */
  async getContactByPeer(ownerId: string, contactId: string): Promise<any | null> {
    try {
      const result = await this.databases.listDocuments(DB, CONTACTS_COLL, [
        Query.equal('owner_id', ownerId),
        Query.equal('contact_id', contactId),
        Query.limit(1),
      ]);
      return result.documents.length > 0 ? result.documents[0] : null;
    } catch (error) {
      console.error('Failed to get contact:', error);
      return null;
    }
  }

  /**
   * Update the ECDH public key on all contact records owned by this user
   */
  async updateContactsPublicKey(ownerId: string, newPublicKey: string): Promise<void> {
    try {
      const contacts = await this.databases.listDocuments(DB, CONTACTS_COLL, [
        Query.equal('owner_id', ownerId),
        Query.limit(200),
      ]);
      for (const doc of contacts.documents) {
        if (doc.ecdh_public_key !== newPublicKey) {
          await this.databases.updateDocument(DB, CONTACTS_COLL, doc.$id, {
            ecdh_public_key: newPublicKey,
          });
        }
      }
    } catch (error) {
      console.error('Failed to update contacts public key:', error);
    }
  }

  /**
   * Remove a contact
   */
  async removeContact(contactDocId: string): Promise<boolean> {
    try {
      await this.databases.deleteDocument(DB, CONTACTS_COLL, contactDocId);
      return true;
    } catch (error) {
      console.error('Failed to remove contact:', error);
      return false;
    }
  }

  /**
   * Update contact's ECDH public key
   */
  async updateContactKey(contactDocId: string, ecdhPublicKey: string): Promise<boolean> {
    try {
      await this.databases.updateDocument(DB, CONTACTS_COLL, contactDocId, {
        ecdh_public_key: ecdhPublicKey,
      });
      return true;
    } catch (error) {
      console.error('Failed to update contact key:', error);
      return false;
    }
  }

  /**
   * Search users by nickname (for adding contacts)
   */
  async searchUsers(query: string, limit: number = 20): Promise<DcUser[]> {
    try {
      const result = await this.databases.listDocuments(DB, USERS_COLL, [
        Query.startsWith('nickname', query),
        Query.limit(limit),
      ]);
      return result.documents as unknown as DcUser[];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  // ==================== DM SIGNALING ====================

  /**
   * Send a DM signaling message (offer, answer, ICE candidate)
   */
  async sendDmSignal(nickname: string, type: string, target: string, data?: any): Promise<boolean> {
    const payload = data ? `__${type}__${target}__${JSON.stringify(data)}` : `__${type}__${target}`;
    const result = await this.sendMessage(nickname, payload, '__dm_signaling__');
    if (!result) {
      console.error('[DmSignal] Failed to send:', type, 'payload length:', payload.length);
    }
    return !!result;
  }

  /**
   * Subscribe to DM signaling channel
   * Returns unsubscribe function
   */
  subscribeToDmSignaling(
    myNickname: string,
    onSignal: (type: string, from: string, data?: any) => void
  ): () => void {
    return appw.subscribe(
      `databases.${DB}.collections.${MESSAGES_COLL}.documents`,
      (response: any) => {
        if (!response.events.some((e: string) => e.includes('.create'))) return;

        const msg = response.payload;
        if (msg.channel !== '__dm_signaling__') return;
        if (msg.nickname === myNickname) return;

        const text: string = msg.text;

        // Parse: __TYPE__target__optionalJSON
        const types = [
          'DM_OFFER', 'DM_ANSWER', 'DM_ICE',
          'DM_CALL_REQUEST', 'DM_CALL_ACCEPT', 'DM_CALL_REJECT',
          'DM_CALL_HANGUP', 'DM_CALL_OFFER', 'DM_CALL_ANSWER', 'DM_CALL_ICE',
        ];
        for (const t of types) {
          const prefix = `__${t}__`;
          if (!text.startsWith(prefix)) continue;

          const rest = text.substring(prefix.length);
          const sepIdx = rest.indexOf('__');
          if (sepIdx === -1) continue;

          const target = rest.substring(0, sepIdx);
          if (target !== myNickname) continue;

          try {
            const data = JSON.parse(rest.substring(sepIdx + 2));
            onSignal(t, msg.nickname, data);
          } catch { /* ignore parse errors */ }
          return;
        }
      }
    );
  }

  /**
   * Get currently active voice users by querying recent voice signaling messages.
   * Returns a map of channelId -> list of nicknames
   */
  async getActiveVoiceUsers(): Promise<Record<string, string[]>> {
    const staleThreshold = new Date(Date.now() - 90 * 1000).toISOString(); // 90 seconds

    try {
      // Query recent voice signaling messages (JOIN, LEAVE, PING)
      const res = await this.databases.listDocuments(DB, MESSAGES_COLL, [
        Query.equal('channel', '__voice_signaling__'),
        Query.greaterThan('timestamp', staleThreshold),
        Query.orderDesc('timestamp'),
        Query.limit(200),
      ]);

      // Build per-user last known state
      const userState: Record<string, { action: string; channelId: string; time: string }> = {};

      for (const doc of res.documents) {
        const text: string = doc.text;
        const nickname: string = doc.nickname;

        // Only process if we haven't seen this user yet (most recent first)
        if (userState[nickname]) continue;

        if (text.startsWith('__VOICE_JOIN__')) {
          userState[nickname] = { action: 'JOIN', channelId: text.replace('__VOICE_JOIN__', ''), time: doc.timestamp };
        } else if (text.startsWith('__VOICE_LEAVE__')) {
          userState[nickname] = { action: 'LEAVE', channelId: '', time: doc.timestamp };
        } else if (text.startsWith('__VOICE_PING__')) {
          userState[nickname] = { action: 'PING', channelId: text.replace('__VOICE_PING__', ''), time: doc.timestamp };
        }
      }

      // Build channel -> users map (only for JOIN or PING, not LEAVE)
      const result: Record<string, string[]> = {};
      for (const [nickname, state] of Object.entries(userState)) {
        if (state.action === 'LEAVE') continue;
        if (!result[state.channelId]) result[state.channelId] = [];
        result[state.channelId].push(nickname);
      }

      return result;
    } catch (error) {
      console.error('Failed to get voice presence:', error);
      return {};
    }
  }
}

export default new DcChatService();
