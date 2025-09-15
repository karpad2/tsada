import { Query } from 'appwrite'
import { BaseApiService } from './BaseApiService'
import { storageService } from '../storage/StorageService'
import { i18nService } from '../i18n/I18nService'
import { validationService } from '../validation/ValidationService'
import { trackUserInteraction, trackError } from '@/utils/analytics'
import { appwriteService } from '@/appwrite'
import type { ApiResponse } from './BaseApiService'

export interface WorkerSchedule {
  day: string
  period: number
  time?: string
  room?: string
}

export interface Worker {
  id: string
  worker_name_hu?: string
  worker_name_rs?: string
  worker_name_en?: string
  contact?: string
  worker_img?: string
  roles: string[]
  has_receiving_hour?: boolean
  p_receiving_schedules?: WorkerSchedule[]
  receiving_schedules?: WorkerSchedule[]
  archived?: boolean
  visible?: boolean
  created_at: string
  updated_at: string
}

export interface WorkerRole {
  id: string
  role_name_hu?: string
  role_name_rs?: string
  role_name_en?: string
  sorrend?: number
  archived?: boolean
  created_at: string
  updated_at: string
}

export interface WorkerInput {
  worker_name_hu?: string
  worker_name_rs?: string
  worker_name_en?: string
  contact?: string
  worker_img?: string
  roles: string[]
  has_receiving_hour?: boolean
  p_receiving_schedules?: WorkerSchedule[]
  receiving_schedules?: WorkerSchedule[]
  archived?: boolean
  visible?: boolean
}

export interface WorkerRoleInput {
  role_name_hu?: string
  role_name_rs?: string
  role_name_en?: string
  sorrend?: number
  archived?: boolean
}

export interface WorkerStats {
  total_workers: number
  visible_workers: number
  archived_workers: number
  total_roles: number
  archived_roles: number
  workers_with_receiving_hours: number
  workers_by_role: Record<string, number>
}

export interface WorkerSearchOptions {
  query?: string
  roles?: string[]
  has_receiving_hour?: boolean
  archived?: boolean
  visible_only?: boolean
  sort_by?: 'created' | 'updated' | 'name' | 'role'
  sort_order?: 'asc' | 'desc'
}

/**
 * Service for managing workers and worker roles
 */
export class WorkerService extends BaseApiService<Worker> {
  private static instance: WorkerService
  private config = appwriteService.config

  constructor() {
    super(appwriteService.config.website_db, appwriteService.config.workers)
  }

  static getInstance(): WorkerService {
    if (!WorkerService.instance) {
      WorkerService.instance = new WorkerService()
    }
    return WorkerService.instance
  }

  /**
   * Get all workers with optional filtering
   */
  async getWorkers(options: WorkerSearchOptions = {}): Promise<ApiResponse<Worker[]>> {
    try {
      trackUserInteraction('workers_list_view', 'workers', { options })

      const queries: string[] = [
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ]

      if (options.roles && options.roles.length > 0) {
        queries.push(Query.equal('roles', options.roles))
      }

      if (options.has_receiving_hour !== undefined) {
        queries.push(Query.equal('has_receiving_hour', options.has_receiving_hour))
      }

      if (options.archived !== undefined) {
        queries.push(Query.equal('archived', options.archived))
      }

      if (options.visible_only) {
        queries.push(Query.equal('visible', true))
      }

      const response = await this.getAll({ queries })

      if (response.success && response.data) {
        return {
          success: true,
          data: this.sortWorkers(response.data, options)
        }
      }

      return response
    } catch (error: any) {
      trackError('workers_list_error', error, { options })
      return this.handleError('Failed to fetch workers', error)
    }
  }

  /**
   * Get workers by role
   */
  async getWorkersByRole(roleId: string): Promise<ApiResponse<Worker[]>> {
    try {
      trackUserInteraction('workers_role_view', 'workers', { role_id: roleId })

      const queries = [
        Query.equal('roles', [roleId]),
        Query.orderAsc('worker_name_hu')
      ]

      const response = await this.getAll({ queries })

      return response
    } catch (error: any) {
      trackError('workers_role_error', error, { role_id: roleId })
      return this.handleError('Failed to fetch workers for role', error)
    }
  }

  /**
   * Get workers with receiving hours
   */
  async getWorkersWithReceivingHours(): Promise<ApiResponse<Worker[]>> {
    try {
      trackUserInteraction('workers_receiving_hours_view', 'workers', {})

      const queries = [
        Query.equal('has_receiving_hour', true),
        Query.orderAsc('worker_name_hu')
      ]

      const response = await this.getAll({ queries })

      return response
    } catch (error: any) {
      trackError('workers_receiving_hours_error', error, {})
      return this.handleError('Failed to fetch workers with receiving hours', error)
    }
  }

  /**
   * Create new worker
   */
  async createWorker(workerData: WorkerInput): Promise<ApiResponse<Worker>> {
    try {
      trackUserInteraction('worker_create_attempt', 'workers', 1)

      // Validate input data
      const validationResult = this.validateWorkerInput(workerData)
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', ')
        }
      }

      const preparedData = this.prepareWorkerData(workerData)
      const response = await this.create(preparedData)

      if (response.success) {
        trackUserInteraction('worker_created', 'workers', 1)
      }

      return response
    } catch (error: any) {
      trackError('worker_create_error', error, workerData)
      return this.handleError('Failed to create worker', error)
    }
  }

  /**
   * Update worker
   */
  async updateWorker(id: string, workerData: Partial<WorkerInput>): Promise<ApiResponse<Worker>> {
    try {
      trackUserInteraction('worker_update_attempt', 'workers', 1)

      const validationResult = this.validateWorkerInput(workerData, false)
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', ')
        }
      }

      const preparedData = this.prepareWorkerData(workerData)
      const response = await this.update(id, preparedData)

      if (response.success) {
        trackUserInteraction('worker_updated', 'workers', 1)
      }

      return response
    } catch (error: any) {
      trackError('worker_update_error', error, { worker_id: id, data: workerData })
      return this.handleError('Failed to update worker', error)
    }
  }

  /**
   * Delete worker (and associated image if exists)
   */
  async deleteWorker(id: string, deleteImage = true): Promise<ApiResponse<void>> {
    try {
      trackUserInteraction('worker_delete_attempt', 'workers', 1)

      if (deleteImage) {
        // Get worker first to find worker_img
        const workerResponse = await this.getById(id)
        if (workerResponse.success && workerResponse.data?.worker_img) {
          await storageService.deleteFile(
            workerResponse.data.worker_img,
            this.config.website_images
          )
        }
      }

      const response = await this.delete(id)

      if (response.success) {
        trackUserInteraction('worker_deleted', 'workers', 1)
      }

      return response
    } catch (error: any) {
      trackError('worker_delete_error', error, { worker_id: id })
      return this.handleError('Failed to delete worker', error)
    }
  }

  /**
   * Archive/Unarchive worker
   */
  async toggleWorkerArchive(id: string): Promise<ApiResponse<Worker>> {
    try {
      const workerResponse = await this.getById(id)

      if (!workerResponse.success || !workerResponse.data) {
        return workerResponse
      }

      const newArchivedState = !workerResponse.data.archived
      const response = await this.update(id, { archived: newArchivedState })

      if (response.success) {
        trackUserInteraction(
          'worker_archive_toggled',
          'workers',
          1,
          { archived: newArchivedState }
        )
      }

      return response
    } catch (error: any) {
      trackError('worker_archive_error', error, { worker_id: id })
      return this.handleError('Failed to toggle worker archive status', error)
    }
  }

  /**
   * Search workers
   */
  async searchWorkers(searchTerm: string, options: WorkerSearchOptions = {}): Promise<ApiResponse<Worker[]>> {
    try {
      trackUserInteraction('worker_search', 'search', { term: searchTerm, options })

      const searchFields = [
        'worker_name_hu', 'worker_name_rs', 'worker_name_en', 'contact'
      ]

      const response = await this.search(searchTerm, searchFields)

      if (response.success && response.data) {
        let filteredResults = response.data

        if (options.roles && options.roles.length > 0) {
          filteredResults = filteredResults.filter(worker =>
            worker.roles.some(role => options.roles!.includes(role))
          )
        }

        if (options.has_receiving_hour !== undefined) {
          filteredResults = filteredResults.filter(worker =>
            worker.has_receiving_hour === options.has_receiving_hour
          )
        }

        if (options.archived !== undefined) {
          filteredResults = filteredResults.filter(worker => worker.archived === options.archived)
        }

        if (options.visible_only) {
          filteredResults = filteredResults.filter(worker => worker.visible)
        }

        return {
          success: true,
          data: this.sortWorkers(filteredResults, options)
        }
      }

      return response
    } catch (error: any) {
      trackError('worker_search_error', error, { term: searchTerm, options })
      return this.handleError('Failed to search workers', error)
    }
  }

  // Worker Roles

  /**
   * Get all worker roles
   */
  async getRoles(includeArchived = false): Promise<ApiResponse<WorkerRole[]>> {
    try {
      trackUserInteraction('worker_roles_view', 'workers', { include_archived: includeArchived })

      const databases = appwriteService.getDatabases()

      const queries = [
        Query.orderAsc('sorrend')
      ]

      if (!includeArchived) {
        queries.push(Query.equal('archived', false))
      }

      const response = await databases.listDocuments(
        this.config.website_db,
        this.config.roles_db,
        queries
      )

      const roles = response.documents.map(doc => this.transformRoleDocument(doc))

      return {
        success: true,
        data: roles
      }
    } catch (error: any) {
      trackError('worker_roles_error', error, { include_archived: includeArchived })
      return this.handleError('Failed to fetch worker roles', error)
    }
  }

  /**
   * Create new worker role
   */
  async createRole(roleData: WorkerRoleInput): Promise<ApiResponse<WorkerRole>> {
    try {
      trackUserInteraction('worker_role_create_attempt', 'workers', 1)

      const validationResult = this.validateRoleInput(roleData)
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', ')
        }
      }

      const databases = appwriteService.getDatabases()

      const document = await databases.createDocument(
        this.config.website_db,
        this.config.roles_db,
        undefined,
        this.prepareRoleData(roleData)
      )

      const role = this.transformRoleDocument(document)

      trackUserInteraction('worker_role_created', 'workers', 1)

      return {
        success: true,
        data: role
      }
    } catch (error: any) {
      trackError('worker_role_create_error', error, roleData)
      return this.handleError('Failed to create worker role', error)
    }
  }

  /**
   * Update worker role
   */
  async updateRole(id: string, roleData: Partial<WorkerRoleInput>): Promise<ApiResponse<WorkerRole>> {
    try {
      trackUserInteraction('worker_role_update_attempt', 'workers', 1)

      const validationResult = this.validateRoleInput(roleData, false)
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', ')
        }
      }

      const databases = appwriteService.getDatabases()

      const document = await databases.updateDocument(
        this.config.website_db,
        this.config.roles_db,
        id,
        this.prepareRoleData(roleData)
      )

      const role = this.transformRoleDocument(document)

      trackUserInteraction('worker_role_updated', 'workers', 1)

      return {
        success: true,
        data: role
      }
    } catch (error: any) {
      trackError('worker_role_update_error', error, { role_id: id, data: roleData })
      return this.handleError('Failed to update worker role', error)
    }
  }

  /**
   * Delete worker role
   */
  async deleteRole(id: string, reassignWorkers = false, newRoleId?: string): Promise<ApiResponse<void>> {
    try {
      trackUserInteraction('worker_role_delete_attempt', 'workers', 1)

      if (reassignWorkers && newRoleId) {
        // Reassign workers to new role
        const workersResponse = await this.getWorkersByRole(id)
        if (workersResponse.success && workersResponse.data) {
          for (const worker of workersResponse.data) {
            const updatedRoles = worker.roles.filter(roleId => roleId !== id)
            if (!updatedRoles.includes(newRoleId)) {
              updatedRoles.push(newRoleId)
            }
            await this.updateWorker(worker.id, { roles: updatedRoles })
          }
        }
      }

      const databases = appwriteService.getDatabases()
      await databases.deleteDocument(
        this.config.website_db,
        this.config.roles_db,
        id
      )

      trackUserInteraction('worker_role_deleted', 'workers', 1)

      return {
        success: true
      }
    } catch (error: any) {
      trackError('worker_role_delete_error', error, { role_id: id })
      return this.handleError('Failed to delete worker role', error)
    }
  }

  /**
   * Get worker statistics
   */
  async getWorkerStats(): Promise<ApiResponse<WorkerStats>> {
    try {
      trackUserInteraction('worker_stats_view', 'analytics', {})

      const [workersResponse, rolesResponse] = await Promise.all([
        this.getWorkers({ archived: undefined }),
        this.getRoles(true)
      ])

      if (!workersResponse.success || !rolesResponse.success) {
        throw new Error('Failed to fetch data for statistics')
      }

      const workers = workersResponse.data!
      const roles = rolesResponse.data!

      const stats: WorkerStats = {
        total_workers: workers.length,
        visible_workers: workers.filter(w => w.visible).length,
        archived_workers: workers.filter(w => w.archived).length,
        total_roles: roles.length,
        archived_roles: roles.filter(r => r.archived).length,
        workers_with_receiving_hours: workers.filter(w => w.has_receiving_hour).length,
        workers_by_role: {}
      }

      // Count workers by role
      for (const role of roles) {
        const roleWorkers = workers.filter(worker =>
          worker.roles.includes(role.id)
        )
        const roleName = i18nService.getLocalizedContent({
          role_name_hu: role.role_name_hu,
          role_name_rs: role.role_name_rs,
          role_name_en: role.role_name_en
        })
        stats.workers_by_role[roleName] = roleWorkers.length
      }

      return {
        success: true,
        data: stats
      }
    } catch (error: any) {
      trackError('worker_stats_error', error, {})
      return this.handleError('Failed to get worker statistics', error)
    }
  }

  // Private helper methods

  private validateWorkerInput(data: Partial<WorkerInput>, requireName = true): { isValid: boolean, errors: string[] } {
    if (requireName) {
      const mlValidation = validationService.validateMultiLanguageContent(
        data as any,
        ['hu'],
        'worker_name_'
      )

      if (!mlValidation.isValid) {
        return {
          isValid: false,
          errors: mlValidation.errors.map(e => e.message)
        }
      }
    }

    if (!data.roles || data.roles.length === 0) {
      return {
        isValid: false,
        errors: ['At least one role is required']
      }
    }

    return {
      isValid: true,
      errors: []
    }
  }

  private validateRoleInput(data: Partial<WorkerRoleInput>, requireName = true): { isValid: boolean, errors: string[] } {
    if (requireName) {
      const mlValidation = validationService.validateMultiLanguageContent(
        data as any,
        ['hu'],
        'role_name_'
      )

      if (!mlValidation.isValid) {
        return {
          isValid: false,
          errors: mlValidation.errors.map(e => e.message)
        }
      }
    }

    return {
      isValid: true,
      errors: []
    }
  }

  private prepareWorkerData(data: Partial<WorkerInput>): Record<string, any> {
    const prepared: Record<string, any> = {}

    // Multi-language fields
    if (data.worker_name_hu !== undefined) prepared.worker_name_hu = data.worker_name_hu.trim()
    if (data.worker_name_rs !== undefined) prepared.worker_name_rs = data.worker_name_rs.trim()
    if (data.worker_name_en !== undefined) prepared.worker_name_en = data.worker_name_en.trim()

    // Other fields
    if (data.contact !== undefined) prepared.contact = data.contact.trim()
    if (data.worker_img !== undefined) prepared.worker_img = data.worker_img
    if (data.roles) prepared.roles = data.roles
    if (data.has_receiving_hour !== undefined) prepared.has_receiving_hour = data.has_receiving_hour
    if (data.p_receiving_schedules) prepared.p_receiving_schedules = JSON.stringify(data.p_receiving_schedules)
    if (data.receiving_schedules) prepared.receiving_schedules = JSON.stringify(data.receiving_schedules)
    if (data.archived !== undefined) prepared.archived = data.archived
    if (data.visible !== undefined) prepared.visible = data.visible

    return prepared
  }

  private prepareRoleData(data: Partial<WorkerRoleInput>): Record<string, any> {
    const prepared: Record<string, any> = {}

    // Multi-language fields
    if (data.role_name_hu !== undefined) prepared.role_name_hu = data.role_name_hu.trim()
    if (data.role_name_rs !== undefined) prepared.role_name_rs = data.role_name_rs.trim()
    if (data.role_name_en !== undefined) prepared.role_name_en = data.role_name_en.trim()

    // Other fields
    if (data.sorrend !== undefined) prepared.sorrend = data.sorrend
    if (data.archived !== undefined) prepared.archived = data.archived

    return prepared
  }

  private sortWorkers(workers: Worker[], options: WorkerSearchOptions): Worker[] {
    const sortBy = options.sort_by || 'name'
    const sortOrder = options.sort_order || 'asc'

    return workers.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          const nameA = i18nService.getLocalizedContent({
            worker_name_hu: a.worker_name_hu,
            worker_name_rs: a.worker_name_rs,
            worker_name_en: a.worker_name_en
          })
          const nameB = i18nService.getLocalizedContent({
            worker_name_hu: b.worker_name_hu,
            worker_name_rs: b.worker_name_rs,
            worker_name_en: b.worker_name_en
          })
          comparison = nameA.localeCompare(nameB)
          break
        case 'updated':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'role':
          // Sort by first role name
          const roleA = a.roles[0] || ''
          const roleB = b.roles[0] || ''
          comparison = roleA.localeCompare(roleB)
          break
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  private transformRoleDocument(doc: any): WorkerRole {
    return {
      id: doc.$id,
      role_name_hu: doc.role_name_hu || '',
      role_name_rs: doc.role_name_rs || '',
      role_name_en: doc.role_name_en || '',
      sorrend: doc.sorrend || 0,
      archived: doc.archived || false,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt
    }
  }

  protected transformDocument(doc: any): Worker {
    return {
      id: doc.$id,
      worker_name_hu: doc.worker_name_hu || '',
      worker_name_rs: doc.worker_name_rs || '',
      worker_name_en: doc.worker_name_en || '',
      contact: doc.contact || '',
      worker_img: doc.worker_img || '',
      roles: doc.roles || [],
      has_receiving_hour: doc.has_receiving_hour || false,
      p_receiving_schedules: this.parseSchedules(doc.p_receiving_schedules),
      receiving_schedules: this.parseSchedules(doc.receiving_schedules),
      archived: doc.archived || false,
      visible: doc.visible !== false, // Default to true
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt
    }
  }

  private parseSchedules(scheduleString: string): WorkerSchedule[] {
    if (!scheduleString) return []

    try {
      return JSON.parse(scheduleString)
    } catch (error) {
      console.warn('Failed to parse worker schedule:', error)
      return []
    }
  }
}

// Create and export singleton instance
export const workerService = WorkerService.getInstance()