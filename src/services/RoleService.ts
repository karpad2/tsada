/**
 * Role-Based Access Control Service
 * Felhasználói szerepkörök kezelése Appwrite User Labels alapján
 *
 * A role a user.labels mezőben van tárolva (pl. ['admin'] vagy ['photographer'])
 * Az assigned_classes a user_roles collection-ben marad (teacher role-nál)
 */

import { Account, Databases, Query, ID } from 'appwrite';
import { appw, config } from '@/appwrite';

const ROLES_DB = config.website_db;
const USER_ROLES_COLLECTION = config.user_roles;

// Appwrite Server API config
const APPWRITE_ENDPOINT = 'https://appwrite.tsada.edu.rs/v1';
const APPWRITE_PROJECT_ID = '659ea7f886cf55d4528a';
const APPWRITE_API_KEY = '8d162ece139831a5da8159ee244835dc07994f5cb164a86550187d0ac3621bbdafadfd48da81862d51fd4e9052a2eb9ad36c4dfec638b0cffa6277f95b05d503f426c49fd12ba202b7959649539bf583bc3743bdfea4213faef92650c12b8352dfa700131f9cc4c172722bd5448af9929d287ecf83091198212f71d4fdbfaa31';

// ============================================
// TYPES
// ============================================

export type UserRole = 'admin' | 'editor' | 'teacher' | 'photographer';

const VALID_ROLES: string[] = ['admin', 'editor', 'teacher', 'photographer'];

export interface UserRoleDocument {
  $id?: string;
  user_id: string;
  role: UserRole;
  assigned_classes?: string[];
  assigned_by?: string;
  created_at?: string;
}

// Jogosultság-mátrix: melyik role milyen route csoportokhoz fér hozzá
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'], // Mindenhez hozzáfér
  editor: [
    'content',      // Tartalom szerkesztés
    'documents',    // Dokumentumok
    'gallery',      // Galéria
    'workers',      // Alkalmazottak szerkesztése
    'classes',      // Osztály szerkesztés
    'slides',       // Prezentáció
    'messages',     // Üzenetek
    'forms',        // Űrlapok
    'erasmus',      // Erasmus
  ],
  teacher: [
    'erp',          // ERP rendszer (diákok, jegyek, nyomtatás, stb.)
  ],
  photographer: [
    'gallery',      // Galéria (album + képfeltöltés, de láthatóság nem állítható)
  ]
};

// Route-name → permission group mapping
export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  // Content/Editor routes
  'content_editor': 'content',
  'worker_editor': 'workers',
  'document_editor': 'documents',
  'text_document_editor': 'documents',
  'student_document_editor': 'documents',
  'gallery_editor': 'gallery',
  'class_editor': 'classes',
  'slide_editor': 'slides',

  // Messages
  'messages': 'messages',
  'message': 'messages',

  // Forms
  'forms_admin': 'forms',
  'form_builder': 'forms',
  'form_responses': 'forms',

  // Erasmus
  'ErAdApplies': 'erasmus',
  'ErasmusApplyEdit': 'erasmus',
  'ErDocViewer': 'erasmus',

  // Notifications (admin only)
  'send_notification': 'notifications',
  'messaging_center': 'notifications',

  // ERP
  'erp_subjects_admin': 'erp',
  'erp_study_programs_admin': 'erp',
  'erp_class_teacher': 'erp',
  'erp_print_manager': 'erp',
  'erp_template_editor': 'erp',

  // Role management (admin only)
  'role_manager': 'roles',
};

// ============================================
// ROLE SERVICE CLASS
// ============================================

export class RoleService {
  private static instance: RoleService;
  private account: Account;
  private databases: Databases;
  private cachedRole: UserRole | null = null;
  private cachedUserId: string | null = null;
  private cachedAssignedClasses: string[] = [];

  private constructor() {
    this.account = new Account(appw);
    this.databases = new Databases(appw);
  }

  static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService();
    }
    return RoleService.instance;
  }

  /**
   * Felhasználó szerepkörének lekérdezése a user.labels mezőből
   * Az account.get() válasza tartalmazza a labels tömböt
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    // Cache ellenőrzés
    if (this.cachedUserId === userId && this.cachedRole) {
      return this.cachedRole;
    }

    try {
      const user = await this.account.get();

      if (user.labels && Array.isArray(user.labels)) {
        // A labels tömbben keresünk érvényes role-t
        const role = user.labels.find((label: string) => VALID_ROLES.includes(label)) as UserRole | undefined;

        if (role) {
          this.cachedRole = role;
          this.cachedUserId = userId;

          // Assigned classes betöltése a collection-ből (teacher-hez)
          if (role === 'teacher') {
            await this.loadAssignedClasses(userId);
          }

          return role;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get user role from labels:', error);
      return null;
    }
  }

  /**
   * Assigned classes betöltése a user_roles collection-ből
   */
  private async loadAssignedClasses(userId: string): Promise<void> {
    try {
      const result = await this.databases.listDocuments(
        ROLES_DB,
        USER_ROLES_COLLECTION,
        [Query.equal('user_id', userId), Query.limit(1)]
      );

      if (result.documents.length > 0) {
        this.cachedAssignedClasses = result.documents[0].assigned_classes || [];
      } else {
        this.cachedAssignedClasses = [];
      }
    } catch (error) {
      console.error('Failed to load assigned classes:', error);
      this.cachedAssignedClasses = [];
    }
  }

  /**
   * Felhasználóhoz rendelt osztályok lekérdezése
   */
  async getUserAssignedClasses(userId: string): Promise<string[]> {
    if (this.cachedUserId === userId) {
      return this.cachedAssignedClasses;
    }

    await this.getUserRole(userId);
    return this.cachedAssignedClasses;
  }

  /**
   * Ellenőrzi, hogy a felhasználó hozzáfér-e egy adott osztályhoz
   */
  canAccessClass(role: UserRole | null, classId: string): boolean {
    if (!role) return false;
    if (role === 'admin') return true;
    return this.cachedAssignedClasses.includes(classId);
  }

  /**
   * Ellenőrzi, hogy a felhasználó rendelkezik-e az adott jogosultsággal
   */
  hasPermission(role: UserRole | null, permissionGroup: string): boolean {
    if (!role) return false;

    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;

    if (permissions.includes('*')) return true;

    return permissions.includes(permissionGroup);
  }

  /**
   * Ellenőrzi, hogy a felhasználó hozzáfér-e egy adott route-hoz
   */
  canAccessRoute(role: UserRole | null, routeName: string): boolean {
    if (!role) return false;
    if (role === 'admin') return true;

    const permissionGroup = ROUTE_PERMISSION_MAP[routeName];
    if (!permissionGroup) {
      return role === 'admin';
    }

    return this.hasPermission(role, permissionGroup);
  }

  /**
   * Ellenőrzi, hogy a felhasználó rendelkezik-e az adott szerepkörök egyikével
   */
  hasRole(currentRole: UserRole | null, ...allowedRoles: UserRole[]): boolean {
    if (!currentRole) return false;
    return allowedRoles.includes(currentRole);
  }

  /**
   * Szerepkör beállítása - Appwrite Server API-val (labels módosítás)
   * + assigned_classes mentése a collection-be
   */
  async setUserRole(userId: string, role: UserRole, assignedBy: string, assignedClasses?: string[]): Promise<boolean> {
    try {
      // 1. User labels frissítése Server API-val
      const labelsUpdated = await this.updateUserLabels(userId, role);
      if (!labelsUpdated) {
        return false;
      }

      // 2. Role + assigned_classes mentése a user_roles collection-be (mindig)
      await this.saveUserRoleDoc(userId, role, assignedBy, assignedClasses || []);

      // Cache frissítés
      if (this.cachedUserId === userId) {
        this.cachedRole = role;
        this.cachedAssignedClasses = assignedClasses || [];
      }

      return true;
    } catch (error) {
      console.error('Failed to set user role:', error);
      return false;
    }
  }

  /**
   * User labels frissítése Appwrite Server REST API-val
   */
  private async updateUserLabels(userId: string, role: UserRole): Promise<boolean> {
    try {
      const response = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/labels`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': APPWRITE_API_KEY
        },
        body: JSON.stringify({
          labels: [role]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to update user labels:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update user labels:', error);
      return false;
    }
  }

  /**
   * Role dokumentum mentése a user_roles collection-be
   */
  private async saveUserRoleDoc(userId: string, role: UserRole, assignedBy: string, assignedClasses: string[]): Promise<void> {
    try {
      const existing = await this.databases.listDocuments(
        ROLES_DB,
        USER_ROLES_COLLECTION,
        [Query.equal('user_id', userId), Query.limit(1)]
      );

      const data: any = {
        role,
        assigned_classes: assignedClasses,
        assigned_by: assignedBy,
        created_at: new Date().toISOString()
      };

      if (existing.documents.length > 0) {
        await this.databases.updateDocument(
          ROLES_DB,
          USER_ROLES_COLLECTION,
          existing.documents[0].$id,
          data
        );
      } else {
        await this.databases.createDocument(
          ROLES_DB,
          USER_ROLES_COLLECTION,
          ID.unique(),
          {
            user_id: userId,
            ...data
          }
        );
      }
    } catch (error) {
      console.error('Failed to save user role doc:', error);
    }
  }

  /**
   * Assigned classes dokumentum törlése
   */
  private async removeAssignedClassesDoc(userId: string): Promise<void> {
    try {
      const existing = await this.databases.listDocuments(
        ROLES_DB,
        USER_ROLES_COLLECTION,
        [Query.equal('user_id', userId), Query.limit(1)]
      );

      if (existing.documents.length > 0) {
        await this.databases.deleteDocument(
          ROLES_DB,
          USER_ROLES_COLLECTION,
          existing.documents[0].$id
        );
      }
    } catch (error) {
      console.error('Failed to remove assigned classes doc:', error);
    }
  }

  /**
   * Szerepkör törlése - labels ürítése + collection doc törlése
   */
  async removeUserRole(userId: string): Promise<boolean> {
    try {
      // 1. Labels ürítése
      await this.updateUserLabelsRaw(userId, []);

      // 2. Collection doc törlése (assigned_classes)
      await this.removeAssignedClassesDoc(userId);

      if (this.cachedUserId === userId) {
        this.cachedRole = null;
        this.cachedUserId = null;
        this.cachedAssignedClasses = [];
      }

      return true;
    } catch (error) {
      console.error('Failed to remove user role:', error);
      return false;
    }
  }

  /**
   * User labels beállítása tetszőleges értékre
   */
  private async updateUserLabelsRaw(userId: string, labels: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${APPWRITE_ENDPOINT}/users/${userId}/labels`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': APPWRITE_PROJECT_ID,
          'X-Appwrite-Key': APPWRITE_API_KEY
        },
        body: JSON.stringify({ labels })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to update user labels:', error);
      return false;
    }
  }

  /**
   * Összes role lekérdezése a user_roles collection-ből (kliens SDK)
   */
  async getAllUserRoles(): Promise<UserRoleDocument[]> {
    try {
      const result = await this.databases.listDocuments(
        ROLES_DB,
        USER_ROLES_COLLECTION,
        [Query.limit(200)]
      );

      return result.documents.map((doc: any) => ({
        $id: doc.$id,
        user_id: doc.user_id,
        role: doc.role as UserRole,
        assigned_classes: doc.assigned_classes || [],
        assigned_by: doc.assigned_by || '',
        created_at: doc.created_at || doc.$createdAt || ''
      }));
    } catch (error) {
      console.error('Failed to get all user roles:', error);
      return [];
    }
  }

  /**
   * Cache törlése (logout-nál)
   */
  clearCache(): void {
    this.cachedRole = null;
    this.cachedUserId = null;
    this.cachedAssignedClasses = [];
  }
}

export default RoleService;
