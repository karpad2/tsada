import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SchoolBoardService, type SchoolBoardMember } from '@/services/api/SchoolBoardService'

// Mock Appwrite
vi.mock('@/appwrite', () => ({
  appw: {},
  config: {
    website_db: 'test_db',
    school_board: 'test_school_board'
  }
}))

// Mock analytics
vi.mock('@/utils/analytics', () => ({
  trackError: vi.fn()
}))

describe('SchoolBoardService', () => {
  let service: SchoolBoardService
  let mockDatabase: any

  beforeEach(() => {
    // Create mock database
    mockDatabase = {
      listDocuments: vi.fn(),
      getDocument: vi.fn(),
      createDocument: vi.fn(),
      updateDocument: vi.fn(),
      deleteDocument: vi.fn()
    }

    service = new SchoolBoardService()
    // Replace the database instance with our mock
    ;(service as any).database = mockDatabase
  })

  describe('getBoardMembers', () => {
    it('should retrieve and sort board members', async () => {
      const mockMembers = [
        { $id: '1', name_hu: 'Tag Péter', name_rs: 'Petar Tag', role: 'Tag', $createdAt: '2023-01-01' },
        { $id: '2', name_hu: 'Elnök János', name_rs: 'Jovan Predsednik', role: 'Elnök', $createdAt: '2023-01-02' },
        { $id: '3', name_hu: 'Alelnök Anna', name_rs: 'Ana Potpredsednik', role: 'Alelnök', $createdAt: '2023-01-03' }
      ]

      mockDatabase.listDocuments.mockResolvedValue({
        documents: mockMembers,
        total: 3
      })

      const result = await service.getBoardMembers()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)

      // Should be sorted by role hierarchy: Elnök -> Alelnök -> Tag
      expect(result.data![0].role).toBe('Elnök')
      expect(result.data![1].role).toBe('Alelnök')
      expect(result.data![2].role).toBe('Tag')
    })

    it('should handle database errors', async () => {
      mockDatabase.listDocuments.mockRejectedValue(new Error('Database error'))

      const result = await service.getBoardMembers()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })
  })

  describe('createMember', () => {
    it('should create a new board member with valid data', async () => {
      const memberData = {
        name_hu: 'Új Tag',
        name_rs: 'Novi Član',
        role: 'Tag'
      }

      const mockResponse = {
        $id: 'new-id',
        ...memberData,
        $createdAt: '2023-01-01',
        $updatedAt: '2023-01-01'
      }

      mockDatabase.createDocument.mockResolvedValue(mockResponse)

      const result = await service.createMember(memberData)

      expect(result.success).toBe(true)
      expect(result.data?.name_hu).toBe('Új Tag')
      expect(result.data?.id).toBe('new-id')

      expect(mockDatabase.createDocument).toHaveBeenCalledWith(
        'test_db',
        'test_school_board',
        expect.any(String),
        {
          name_hu: 'Új Tag',
          name_rs: 'Novi Član',
          role: 'Tag'
        }
      )
    })

    it('should validate required fields', async () => {
      const memberData = {
        name_hu: '',
        name_rs: 'Novi Član',
        role: 'Tag'
      }

      const result = await service.createMember(memberData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Hungarian name is required')
      expect(mockDatabase.createDocument).not.toHaveBeenCalled()
    })

    it('should validate role values', async () => {
      const memberData = {
        name_hu: 'Test Name',
        name_rs: 'Test Ime',
        role: 'Invalid Role'
      }

      const result = await service.createMember(memberData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid role')
      expect(mockDatabase.createDocument).not.toHaveBeenCalled()
    })
  })

  describe('updateMember', () => {
    it('should update existing member', async () => {
      const updateData = {
        name_hu: 'Updated Name',
        role: 'Elnök'
      }

      const mockResponse = {
        $id: 'existing-id',
        name_hu: 'Updated Name',
        name_rs: 'Existing Serbian Name',
        role: 'Elnök',
        $createdAt: '2023-01-01',
        $updatedAt: '2023-01-02'
      }

      mockDatabase.updateDocument.mockResolvedValue(mockResponse)

      const result = await service.updateMember('existing-id', updateData)

      expect(result.success).toBe(true)
      expect(result.data?.name_hu).toBe('Updated Name')
      expect(result.data?.role).toBe('Elnök')

      expect(mockDatabase.updateDocument).toHaveBeenCalledWith(
        'test_db',
        'test_school_board',
        'existing-id',
        {
          name_hu: 'Updated Name',
          name_rs: '',
          role: 'Elnök'
        }
      )
    })

    it('should validate role when updating', async () => {
      const updateData = { role: 'Invalid Role' }

      const result = await service.updateMember('existing-id', updateData)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid role')
      expect(mockDatabase.updateDocument).not.toHaveBeenCalled()
    })
  })

  describe('searchMembers', () => {
    it('should search members by name and role', async () => {
      const mockResults = [
        { $id: '1', name_hu: 'János Elnök', name_rs: 'Jovan Predsednik', role: 'Elnök' }
      ]

      mockDatabase.listDocuments.mockResolvedValue({
        documents: mockResults,
        total: 1
      })

      const result = await service.searchMembers('János')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].name_hu).toContain('János')
    })
  })

  describe('getMembersByRole', () => {
    it('should filter members by specific role', async () => {
      const mockPresidents = [
        { $id: '1', name_hu: 'Elnök János', name_rs: 'Jovan Predsednik', role: 'Elnök' }
      ]

      mockDatabase.listDocuments.mockResolvedValue({
        documents: mockPresidents,
        total: 1
      })

      const result = await service.getMembersByRole('Elnök')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].role).toBe('Elnök')

      // Verify correct query was made
      expect(mockDatabase.listDocuments).toHaveBeenCalledWith(
        'test_db',
        'test_school_board',
        expect.any(Array)
      )
    })
  })

  describe('getRoleStats', () => {
    it('should return role statistics', async () => {
      const mockMembers = [
        { $id: '1', name_hu: 'Elnök 1', role: 'Elnök' },
        { $id: '2', name_hu: 'Alelnök 1', role: 'Alelnök' },
        { $id: '3', name_hu: 'Tag 1', role: 'Tag' },
        { $id: '4', name_hu: 'Tag 2', role: 'Tag' }
      ]

      // Mock the getBoardMembers method
      vi.spyOn(service, 'getBoardMembers').mockResolvedValue({
        success: true,
        data: mockMembers as SchoolBoardMember[]
      })

      const result = await service.getRoleStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        'Elnök': 1,
        'Alelnök': 1,
        'Tag': 2
      })
    })

    it('should handle errors in role stats', async () => {
      vi.spyOn(service, 'getBoardMembers').mockResolvedValue({
        success: false,
        error: 'Database error'
      })

      const result = await service.getRoleStats()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to fetch board members')
    })
  })

  describe('transformDocument', () => {
    it('should transform Appwrite document to SchoolBoardMember', () => {
      const mockDoc = {
        $id: 'test-id',
        name_hu: 'Test Name',
        name_rs: 'Test Ime',
        role: 'Tag',
        $createdAt: '2023-01-01',
        $updatedAt: '2023-01-01'
      }

      const transformed = (service as any).transformDocument(mockDoc)

      expect(transformed).toEqual({
        id: 'test-id',
        name_hu: 'Test Name',
        name_rs: 'Test Ime',
        role: 'Tag',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      })
    })

    it('should handle missing fields gracefully', () => {
      const mockDoc = {
        $id: 'test-id',
        $createdAt: '2023-01-01',
        $updatedAt: '2023-01-01'
      }

      const transformed = (service as any).transformDocument(mockDoc)

      expect(transformed).toEqual({
        id: 'test-id',
        name_hu: '',
        name_rs: '',
        role: '',
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
      })
    })
  })

  describe('prepareForSave', () => {
    it('should clean and prepare data for saving', () => {
      const input = {
        name_hu: '  Test Name  ',
        name_rs: '  Test Ime  ',
        role: '  Tag  ',
        id: 'should-be-removed'
      }

      const prepared = (service as any).prepareForSave(input)

      expect(prepared).toEqual({
        name_hu: 'Test Name',
        name_rs: 'Test Ime',
        role: 'Tag'
      })
      expect(prepared).not.toHaveProperty('id')
    })
  })
})