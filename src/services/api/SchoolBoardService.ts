import { Query } from 'appwrite'
import { BaseApiService, ApiResponse } from './BaseApiService'
import { config } from '@/appwrite'

export interface SchoolBoardMember {
  id: string
  name_hu: string
  name_rs: string
  role: string
  created_at?: string
  updated_at?: string
}

export interface SchoolBoardMemberInput {
  name_hu: string
  name_rs?: string
  role: string
}

/**
 * Service for managing school board members
 */
export class SchoolBoardService extends BaseApiService<SchoolBoardMember> {
  constructor() {
    super(config.school_board)
  }

  /**
   * Get all board members sorted by role hierarchy
   */
  async getBoardMembers(): Promise<ApiResponse<SchoolBoardMember[]>> {
    const result = await this.getAll({
      orderBy: ['$createdAt'],
      limit: 200
    })

    if (result.success && result.data) {
      // Sort by role hierarchy: President -> Vice President -> Members
      result.data = this.sortByRoleHierarchy(result.data)
    }

    return result
  }

  /**
   * Get members by role
   */
  async getMembersByRole(role: string): Promise<ApiResponse<SchoolBoardMember[]>> {
    try {
      const queries = [
        Query.equal('role', role),
        Query.orderAsc('$createdAt')
      ]

      const response = await this.database.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      )

      return {
        success: true,
        data: response.documents.map(doc => this.transformDocument(doc)) as SchoolBoardMember[]
      }
    } catch (error: any) {
      this.logError('getMembersByRole', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Create new board member with validation
   */
  async createMember(memberData: SchoolBoardMemberInput): Promise<ApiResponse<SchoolBoardMember>> {
    // Validate required fields
    if (!memberData.name_hu?.trim()) {
      return {
        success: false,
        error: 'Hungarian name is required'
      }
    }

    if (!memberData.role?.trim()) {
      return {
        success: false,
        error: 'Role is required'
      }
    }

    // Check if role is valid
    const validRoles = ['Elnök', 'Alelnök', 'Tag']
    if (!validRoles.includes(memberData.role)) {
      return {
        success: false,
        error: 'Invalid role. Must be one of: ' + validRoles.join(', ')
      }
    }

    return await this.create(memberData)
  }

  /**
   * Update board member with validation
   */
  async updateMember(id: string, memberData: Partial<SchoolBoardMemberInput>): Promise<ApiResponse<SchoolBoardMember>> {
    // Validate if updating role
    if (memberData.role) {
      const validRoles = ['Elnök', 'Alelnök', 'Tag']
      if (!validRoles.includes(memberData.role)) {
        return {
          success: false,
          error: 'Invalid role. Must be one of: ' + validRoles.join(', ')
        }
      }
    }

    return await this.update(id, memberData)
  }

  /**
   * Search board members by name
   */
  async searchMembers(searchTerm: string): Promise<ApiResponse<SchoolBoardMember[]>> {
    return await this.search(searchTerm, ['name_hu', 'name_rs', 'role'])
  }

  /**
   * Get members count by role
   */
  async getRoleStats(): Promise<ApiResponse<{ [role: string]: number }>> {
    try {
      const result = await this.getBoardMembers()

      if (!result.success || !result.data) {
        return {
          success: false,
          error: 'Failed to fetch board members'
        }
      }

      const roleStats = result.data.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1
        return acc
      }, {} as { [role: string]: number })

      return {
        success: true,
        data: roleStats
      }
    } catch (error: any) {
      this.logError('getRoleStats', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Sort members by role hierarchy
   */
  private sortByRoleHierarchy(members: SchoolBoardMember[]): SchoolBoardMember[] {
    const roleOrder = ['elnök', 'alelnök', 'tag']

    return [...members].sort((a, b) => {
      const aRoleIndex = roleOrder.findIndex(role =>
        a.role.toLowerCase().includes(role)
      )
      const bRoleIndex = roleOrder.findIndex(role =>
        b.role.toLowerCase().includes(role)
      )

      // If both have recognized roles
      if (aRoleIndex !== -1 && bRoleIndex !== -1) {
        return aRoleIndex - bRoleIndex
      }

      // If only one has recognized role (recognized comes first)
      if (aRoleIndex !== -1 && bRoleIndex === -1) return -1
      if (aRoleIndex === -1 && bRoleIndex !== -1) return 1

      // If neither has recognized role, sort by name
      return a.name_hu.localeCompare(b.name_hu, 'hu', { sensitivity: 'base' })
    })
  }

  /**
   * Transform document with proper typing
   */
  protected transformDocument(doc: any): SchoolBoardMember {
    return {
      id: doc.$id,
      name_hu: doc.name_hu || '',
      name_rs: doc.name_rs || '',
      role: doc.role || '',
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt
    }
  }

  /**
   * Prepare data for saving with proper validation
   */
  protected prepareForSave(data: Partial<SchoolBoardMember>): any {
    return {
      name_hu: data.name_hu?.trim() || '',
      name_rs: data.name_rs?.trim() || '',
      role: data.role?.trim() || ''
    }
  }
}