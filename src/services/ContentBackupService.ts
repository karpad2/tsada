/**
 * Content Backup Service
 * Automatikusan menti a tartalom változásokat, és 7 napig megőrzi őket
 */

import { Databases, Query, ID } from 'appwrite';
import { appw, config } from '@/appwrite';

export interface ContentBackup {
  $id?: string;
  $createdAt?: string;
  contentId: string;           // Az eredeti dokumentum ID-ja
  contentType: string;         // 'about_us', 'news', 'document', 'text_component', stb.
  collectionId: string;        // Az eredeti collection ID
  previousData: string;        // JSON stringified előző állapot
  changedFields: string;       // Mely mezők változtak (JSON array)
  changedBy?: string;          // Ki módosította (user ID)
  changeType: 'update' | 'delete' | 'create';
}

export class ContentBackupService {
  private static instance: ContentBackupService;
  private databases: Databases;
  private readonly RETENTION_DAYS = 7;

  static getInstance(): ContentBackupService {
    if (!ContentBackupService.instance) {
      ContentBackupService.instance = new ContentBackupService();
    }
    return ContentBackupService.instance;
  }

  private constructor() {
    this.databases = new Databases(appw);
  }

  /**
   * Mentés előtt hívd meg - elmenti az aktuális állapotot
   */
  async createBackup(
    contentId: string,
    contentType: string,
    collectionId: string,
    previousData: Record<string, any>,
    newData: Record<string, any>,
    changeType: 'update' | 'delete' | 'create' = 'update',
    userId?: string
  ): Promise<ContentBackup | null> {
    try {
      // Kiszámoljuk mely mezők változtak
      const changedFields = this.getChangedFields(previousData, newData);

      // Ha nincs változás, nem mentünk
      if (changedFields.length === 0 && changeType === 'update') {
        return null;
      }

      const backup: Omit<ContentBackup, '$id' | '$createdAt'> = {
        contentId,
        contentType,
        collectionId,
        previousData: JSON.stringify(previousData),
        changedFields: JSON.stringify(changedFields),
        changedBy: userId || '',
        changeType
      };

      const document = await this.databases.createDocument(
        config.website_db,
        config.content_backups,
        ID.unique(),
        backup
      );

      // Töröljük a régi backup-okat
      await this.cleanupOldBackups();

      return {
        ...backup,
        $id: document.$id,
        $createdAt: document.$createdAt
      };
    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  /**
   * Tartalom visszaállítása egy korábbi verzióra
   */
  async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const backup = await this.databases.getDocument(
        config.website_db,
        config.content_backups,
        backupId
      );

      const previousData = JSON.parse(backup.previousData);

      // Töröljük a Appwrite specifikus mezőket
      delete previousData.$id;
      delete previousData.$createdAt;
      delete previousData.$updatedAt;
      delete previousData.$permissions;
      delete previousData.$databaseId;
      delete previousData.$collectionId;

      // Visszaállítjuk az eredeti dokumentumot
      await this.databases.updateDocument(
        config.website_db,
        backup.collectionId,
        backup.contentId,
        previousData
      );

      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  /**
   * Egy tartalom összes backupjának lekérése
   */
  async getBackupsForContent(
    contentId: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<{ backups: ContentBackup[]; total: number }> {
    try {
      const result = await this.databases.listDocuments(
        config.website_db,
        config.content_backups,
        [
          Query.equal('contentId', contentId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      return {
        backups: result.documents.map(doc => ({
          $id: doc.$id,
          $createdAt: doc.$createdAt,
          contentId: doc.contentId,
          contentType: doc.contentType,
          collectionId: doc.collectionId,
          previousData: doc.previousData,
          changedFields: doc.changedFields,
          changedBy: doc.changedBy,
          changeType: doc.changeType
        })),
        total: result.total
      };
    } catch (error) {
      console.error('Failed to get backups:', error);
      return { backups: [], total: 0 };
    }
  }

  /**
   * Egy backup részleteinek lekérése
   */
  async getBackup(backupId: string): Promise<ContentBackup | null> {
    try {
      const doc = await this.databases.getDocument(
        config.website_db,
        config.content_backups,
        backupId
      );

      return {
        $id: doc.$id,
        $createdAt: doc.$createdAt,
        contentId: doc.contentId,
        contentType: doc.contentType,
        collectionId: doc.collectionId,
        previousData: doc.previousData,
        changedFields: doc.changedFields,
        changedBy: doc.changedBy,
        changeType: doc.changeType
      };
    } catch (error) {
      console.error('Failed to get backup:', error);
      return null;
    }
  }

  /**
   * 7 napnál régebbi backup-ok törlése
   */
  async cleanupOldBackups(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);
      const cutoffISO = cutoffDate.toISOString();

      const result = await this.databases.listDocuments(
        config.website_db,
        config.content_backups,
        [
          Query.lessThan('$createdAt', cutoffISO),
          Query.limit(100) // Batch törlés
        ]
      );

      let deletedCount = 0;
      for (const doc of result.documents) {
        try {
          await this.databases.deleteDocument(
            config.website_db,
            config.content_backups,
            doc.$id
          );
          deletedCount++;
        } catch (e) {
          console.error(`Failed to delete old backup ${doc.$id}:`, e);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      return 0;
    }
  }

  /**
   * Összes backup listázása (admin célokra)
   */
  async listAllBackups(
    limit: number = 50,
    offset: number = 0,
    contentType?: string
  ): Promise<{ backups: ContentBackup[]; total: number }> {
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ];

      if (contentType) {
        queries.unshift(Query.equal('contentType', contentType));
      }

      const result = await this.databases.listDocuments(
        config.website_db,
        config.content_backups,
        queries
      );

      return {
        backups: result.documents.map(doc => ({
          $id: doc.$id,
          $createdAt: doc.$createdAt,
          contentId: doc.contentId,
          contentType: doc.contentType,
          collectionId: doc.collectionId,
          previousData: doc.previousData,
          changedFields: doc.changedFields,
          changedBy: doc.changedBy,
          changeType: doc.changeType
        })),
        total: result.total
      };
    } catch (error) {
      console.error('Failed to list backups:', error);
      return { backups: [], total: 0 };
    }
  }

  /**
   * Mely mezők változtak
   */
  private getChangedFields(oldData: Record<string, any>, newData: Record<string, any>): string[] {
    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

    for (const key of allKeys) {
      // Skip Appwrite system fields
      if (key.startsWith('$')) continue;

      const oldValue = JSON.stringify(oldData?.[key]);
      const newValue = JSON.stringify(newData?.[key]);

      if (oldValue !== newValue) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  /**
   * Két verzió összehasonlítása (diff)
   */
  getDiff(backup: ContentBackup, currentData: Record<string, any>): Record<string, { old: any; new: any }> {
    const diff: Record<string, { old: any; new: any }> = {};
    const previousData = JSON.parse(backup.previousData);
    const changedFields = JSON.parse(backup.changedFields);

    for (const field of changedFields) {
      diff[field] = {
        old: previousData[field],
        new: currentData[field]
      };
    }

    return diff;
  }
}

export default ContentBackupService;
