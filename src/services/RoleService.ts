/**
 * Role-Based Access Control Service
 * Felhasználói szerepkörök kezelése Appwrite User Labels alapján
 *
 * Labels: user.labels (pl. ['admin'])
 * Assigned classes: user_roles collection (teacher)
 *
 * Label mutations go through the set-user-labels Cloud Function
 * (server API key never ships in the SPA).
 */

import { Account, Databases, Functions, Query, ID, ExecutionMethod } from 'appwrite'
import { appw, config } from '@/appwrite'
import { FUNCTION_SET_USER_LABELS } from '@/appwrite/constants'

const ROLES_DB = config.website_db
const USER_ROLES_COLLECTION = config.user_roles

// ============================================
// TYPES
// ============================================

export type UserRole = 'admin' | 'editor' | 'teacher' | 'photographer'

const VALID_ROLES: string[] = ['admin', 'editor', 'teacher', 'photographer']

export interface UserRoleDocument {
  $id?: string
  user_id: string
  role: UserRole
  assigned_classes?: string[]
  assigned_by?: string
  created_at?: string
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  editor: [
    'content',
    'documents',
    'gallery',
    'workers',
    'classes',
    'slides',
    'messages',
    'forms',
    'erasmus'
  ],
  teacher: ['erp'],
  photographer: ['gallery']
}

export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  content_editor: 'content',
  worker_editor: 'workers',
  document_editor: 'documents',
  text_document_editor: 'documents',
  student_document_editor: 'documents',
  gallery_editor: 'gallery',
  class_editor: 'classes',
  slide_editor: 'slides',
  messages: 'messages',
  message: 'messages',
  forms_admin: 'forms',
  form_builder: 'forms',
  form_responses: 'forms',
  ErAdApplies: 'erasmus',
  ErasmusApplyEdit: 'erasmus',
  ErDocViewer: 'erasmus',
  send_notification: 'notifications',
  messaging_center: 'notifications',
  erp_subjects_admin: 'erp',
  erp_study_programs_admin: 'erp',
  erp_class_teacher: 'erp',
  erp_print_manager: 'erp',
  erp_template_editor: 'erp',
  role_manager: 'roles'
}

// ============================================
// ROLE SERVICE CLASS
// ============================================

export class RoleService {
  private static instance: RoleService
  private account: Account
  private databases: Databases
  private functions: Functions
  private cachedRole: UserRole | null = null
  private cachedUserId: string | null = null
  private cachedAssignedClasses: string[] = []

  private constructor() {
    this.account = new Account(appw)
    this.databases = new Databases(appw)
    this.functions = new Functions(appw)
  }

  static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService()
    }
    return RoleService.instance
  }

  async getUserRole(userId: string): Promise<UserRole | null> {
    if (this.cachedUserId === userId && this.cachedRole) {
      return this.cachedRole
    }

    try {
      const user = await this.account.get()

      if (user.labels && Array.isArray(user.labels)) {
        const role = user.labels.find((label: string) =>
          VALID_ROLES.includes(label)
        ) as UserRole | undefined

        if (role) {
          this.cachedRole = role
          this.cachedUserId = userId

          if (role === 'teacher') {
            await this.loadAssignedClasses(userId)
          }

          return role
        }
      }

      return null
    } catch (error) {
      console.error('Failed to get user role from labels:', error)
      return null
    }
  }

  private async loadAssignedClasses(userId: string): Promise<void> {
    try {
      const result = await this.databases.listDocuments(
        ROLES_DB,
        USER_ROLES_COLLECTION,
        [Query.equal('user_id', userId), Query.limit(1)]
      )

      if (result.documents.length > 0) {
        this.cachedAssignedClasses = result.documents[0].assigned_classes || []
      } else {
        this.cachedAssignedClasses = []
      }
    } catch (error) {
      console.error('Failed to load assigned classes:', error)
      this.cachedAssignedClasses = []
    }
  }

  async getUserAssignedClasses(userId: string): Promise<string[]> {
    if (this.cachedUserId === userId) {
      return this.cachedAssignedClasses
    }

    await this.getUserRole(userId)
    return this.cachedAssignedClasses
  }

  canAccessClass(role: UserRole | null, classId: string): boolean {
    if (!role) return false
    if (role === 'admin') return true
    return this.cachedAssignedClasses.includes(classId)
  }

  hasPermission(role: UserRole | null, permissionGroup: string): boolean {
    if (!role) return false

    const permissions = ROLE_PERMISSIONS[role]
    if (!permissions) return false
    if (permissions.includes('*')) return true

    return permissions.includes(permissionGroup)
  }

  canAccessRoute(role: UserRole | null, routeName: string): boolean {
    if (!role) return false
    if (role === 'admin') return true

    const permissionGroup = ROUTE_PERMISSION_MAP[routeName]
    if (!permissionGroup) {
      return role === 'admin'
    }

    return this.hasPermission(role, permissionGroup)
  }

  hasRole(currentRole: UserRole | null, ...allowedRoles: UserRole[]): boolean {
    if (!currentRole) return false
    return allowedRoles.includes(currentRole)
  }

  /**
   * Set role via Cloud Function (labels) + user_roles doc (classes).
   */
  async setUserRole(
    userId: string,
    role: UserRole,
    assignedBy: string,
    assignedClasses?: string[]
  ): Promise<boolean> {
    try {
      const labelsUpdated = await this.updateUserLabels(userId, [role])
      if (!labelsUpdated) {
        return false
      }

      await this.saveUserRoleDoc(userId, role, assignedBy, assignedClasses || [])

      if (this.cachedUserId === userId) {
        this.cachedRole = role
        this.cachedAssignedClasses = assignedClasses || []
      }

      return true
    } catch (error) {
      console.error('Failed to set user role:', error)
      return false
    }
  }

  /**
   * Invoke set-user-labels Cloud Function (session-authenticated).
   */
  private async updateUserLabels(userId: string, labels: string[]): Promise<boolean> {
    try {
      const execution = await this.functions.createExecution(
        FUNCTION_SET_USER_LABELS,
        JSON.stringify({ userId, labels }),
        false,
        '/',
        ExecutionMethod.POST,
        { 'content-type': 'application/json' }
      )

      const statusCode = execution.responseStatusCode || 0
      let payload: any = {}
      try {
        payload = execution.responseBody ? JSON.parse(execution.responseBody) : {}
      } catch {
        payload = { raw: execution.responseBody }
      }

      if (statusCode >= 200 && statusCode < 300 && payload.success !== false) {
        return true
      }

      console.error('set-user-labels function failed:', statusCode, payload)
      return false
    } catch (error) {
      console.error('Failed to execute set-user-labels function:', error)
      return false
    }
  }

  private async saveUserRoleDoc(
    userId: string,
    role: UserRole,
    assignedBy: string,
    assignedClasses: string[]
  ): Promise<void> {
    try {
      const existing = await this.databases.listDocuments(
        ROLES_DB,
        USER_ROLES_COLLECTION,
        [Query.equal('user_id', userId), Query.limit(1)]
      )

      const data: any = {
        role,
        assigned_classes: assignedClasses,
        assigned_by: assignedBy,
        created_at: new Date().toISOString()
      }

      if (existing.documents.length > 0) {
        await this.databases.updateDocument(
          ROLES_DB,
          USER_ROLES_COLLECTION,
          existing.documents[0].$id,
          data
        )
      } else {
        await this.databases.createDocument(ROLES_DB, USER_ROLES_COLLECTION, ID.unique(), {
          user_id: userId,
          ...data
        })
      }
    } catch (error) {
      console.error('Failed to save user role doc:', error)
    }
  }

  private async removeAssignedClassesDoc(userId: string): Promise<void> {
    try {
      const existing = await this.databases.listDocuments(
        ROLES_DB,
        USER_ROLES_COLLECTION,
        [Query.equal('user_id', userId), Query.limit(1)]
      )

      if (existing.documents.length > 0) {
        await this.databases.deleteDocument(
          ROLES_DB,
          USER_ROLES_COLLECTION,
          existing.documents[0].$id
        )
      }
    } catch (error) {
      console.error('Failed to remove assigned classes doc:', error)
    }
  }

  async removeUserRole(userId: string): Promise<boolean> {
    try {
      const ok = await this.updateUserLabels(userId, [])
      if (!ok) return false

      await this.removeAssignedClassesDoc(userId)

      if (this.cachedUserId === userId) {
        this.cachedRole = null
        this.cachedUserId = null
        this.cachedAssignedClasses = []
      }

      return true
    } catch (error) {
      console.error('Failed to remove user role:', error)
      return false
    }
  }

  async getAllUserRoles(): Promise<UserRoleDocument[]> {
    try {
      const result = await this.databases.listDocuments(ROLES_DB, USER_ROLES_COLLECTION, [
        Query.limit(200)
      ])

      return result.documents.map((doc: any) => ({
        $id: doc.$id,
        user_id: doc.user_id,
        role: doc.role as UserRole,
        assigned_classes: doc.assigned_classes || [],
        assigned_by: doc.assigned_by || '',
        created_at: doc.created_at || doc.$createdAt || ''
      }))
    } catch (error) {
      console.error('Failed to get all user roles:', error)
      return []
    }
  }

  clearCache(): void {
    this.cachedRole = null
    this.cachedUserId = null
    this.cachedAssignedClasses = []
  }
}

export default RoleService
