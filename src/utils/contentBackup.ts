import { Databases, ID } from 'appwrite'
import { appw, config } from '@/appwrite'

export interface ContentBackup {
  $id?: string
  original_document_id: string
  document_type: string
  backup_timestamp: string
  backup_reason: 'conversion' | 'manual' | 'auto_save'
  original_data: string // JSON stringified document
  backup_metadata: {
    version: string
    created_by: string
    original_mode: 'legacy' | 'modular'
    backup_size: number
  }
}

export class ContentBackupService {
  private static database = new Databases(appw)

  /**
   * Create a backup of the current document content
   */
  static async createBackup(
    documentId: string,
    documentType: string,
    originalData: any,
    reason: 'conversion' | 'manual' | 'auto_save' = 'manual',
    createdBy: string = 'system'
  ): Promise<string> {
    try {
      const backupData: Omit<ContentBackup, '$id'> = {
        original_document_id: documentId,
        document_type: documentType,
        backup_timestamp: new Date().toISOString(),
        backup_reason: reason,
        original_data: JSON.stringify(originalData),
        backup_metadata: {
          version: '1.0',
          created_by: createdBy,
          original_mode: originalData.use_legacy_content !== false ? 'legacy' : 'modular',
          backup_size: JSON.stringify(originalData).length
        }
      }

      const backup = await this.database.createDocument(
        config.website_db,
        config.content_backups || 'content_backups',
        ID.unique(),
        backupData
      )

      console.log('Backup created successfully:', backup.$id)
      return backup.$id
    } catch (error) {
      console.error('Failed to create backup:', error)
      throw new Error(`Backup creation failed: ${error.message || error}`)
    }
  }

  /**
   * List all backups for a document
   */
  static async listBackups(documentId: string): Promise<ContentBackup[]> {
    try {
      const response = await this.database.listDocuments(
        config.website_db,
        config.content_backups || 'content_backups',
        [
          `equal("original_document_id", "${documentId}")`,
          'orderDesc("$createdAt")'
        ]
      )

      return response.documents.map(doc => ({
        $id: doc.$id,
        original_document_id: doc.original_document_id,
        document_type: doc.document_type,
        backup_timestamp: doc.backup_timestamp,
        backup_reason: doc.backup_reason,
        original_data: doc.original_data,
        backup_metadata: typeof doc.backup_metadata === 'string'
          ? JSON.parse(doc.backup_metadata)
          : doc.backup_metadata
      }))
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  }

  /**
   * Restore content from a backup
   */
  static async restoreFromBackup(
    backupId: string,
    targetDocumentId: string,
    targetCollection: string
  ): Promise<boolean> {
    try {
      // Get backup data
      const backup = await this.database.getDocument(
        config.website_db,
        config.content_backups || 'content_backups',
        backupId
      )

      if (!backup) {
        throw new Error('Backup not found')
      }

      // Parse original data
      const originalData = JSON.parse(backup.original_data)
      delete originalData.$id // Remove the old ID
      delete originalData.$createdAt
      delete originalData.$updatedAt

      // Update the target document
      await this.database.updateDocument(
        config.website_db,
        targetCollection,
        targetDocumentId,
        originalData
      )

      console.log('Content restored from backup:', backupId)
      return true
    } catch (error) {
      console.error('Failed to restore from backup:', error)
      throw new Error(`Restore failed: ${error.message || error}`)
    }
  }

  /**
   * Delete old backups (cleanup)
   */
  static async cleanupOldBackups(documentId: string, keepCount: number = 5): Promise<void> {
    try {
      const backups = await this.listBackups(documentId)

      if (backups.length > keepCount) {
        const backupsToDelete = backups.slice(keepCount)

        for (const backup of backupsToDelete) {
          if (backup.$id) {
            await this.database.deleteDocument(
              config.website_db,
              config.content_backups || 'content_backups',
              backup.$id
            )
          }
        }

        console.log(`Cleaned up ${backupsToDelete.length} old backups`)
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error)
    }
  }

  /**
   * Export backup as downloadable file
   */
  static exportBackup(backup: ContentBackup): void {
    const exportData = {
      backup_info: {
        id: backup.$id,
        timestamp: backup.backup_timestamp,
        reason: backup.backup_reason,
        metadata: backup.backup_metadata
      },
      content: JSON.parse(backup.original_data)
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `content_backup_${backup.original_document_id}_${backup.backup_timestamp.slice(0, 10)}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  /**
   * Create automatic backup before risky operations
   */
  static async createAutoBackup(
    documentId: string,
    documentType: string,
    originalData: any,
    operation: string
  ): Promise<string | null> {
    try {
      return await this.createBackup(
        documentId,
        documentType,
        originalData,
        'conversion',
        `auto_${operation}`
      )
    } catch (error) {
      // Don't fail the main operation if backup fails
      console.warn('Auto backup failed, continuing with operation:', error)
      return null
    }
  }
}

// Export utility function for easy imports
export const createContentBackup = ContentBackupService.createAutoBackup
export const restoreContentFromBackup = ContentBackupService.restoreFromBackup
export const listContentBackups = ContentBackupService.listBackups
export const exportContentBackup = ContentBackupService.exportBackup