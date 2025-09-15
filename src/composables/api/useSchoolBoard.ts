import { ref, computed, onMounted } from 'vue'
import { schoolBoardService, i18nService, type SchoolBoardMember } from '@/services'
import { trackUserInteraction, trackAdminAction } from '@/utils/analytics'
import { useLoadingStore } from '@/stores/loading'

export interface UseSchoolBoardOptions {
  autoLoad?: boolean
  trackAnalytics?: boolean
}

export function useSchoolBoard(options: UseSchoolBoardOptions = {}) {
  const { autoLoad = true, trackAnalytics = true } = options

  // State
  const members = ref<SchoolBoardMember[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchTerm = ref('')

  // Store
  const loadingStore = useLoadingStore()

  // Computed
  const isAdmin = computed(() => loadingStore.userLoggedin)

  const sortedMembers = computed(() => {
    if (!members.value.length) return []

    return [...members.value].sort((a, b) => {
      const roleOrder = ['elnök', 'alelnök', 'tag']

      const aRoleIndex = roleOrder.findIndex(role =>
        a.role.toLowerCase().includes(role.toLowerCase())
      )
      const bRoleIndex = roleOrder.findIndex(role =>
        b.role.toLowerCase().includes(role.toLowerCase())
      )

      if (aRoleIndex !== -1 && bRoleIndex !== -1) {
        return aRoleIndex - bRoleIndex
      }

      if (aRoleIndex !== -1 && bRoleIndex === -1) return -1
      if (aRoleIndex === -1 && bRoleIndex !== -1) return 1

      return a.name_hu.localeCompare(b.name_hu, 'hu', { sensitivity: 'base' })
    })
  })

  const filteredMembers = computed(() => {
    if (!searchTerm.value) return sortedMembers.value

    const term = searchTerm.value.toLowerCase()
    return sortedMembers.value.filter(member =>
      member.name_hu.toLowerCase().includes(term) ||
      member.name_rs.toLowerCase().includes(term) ||
      member.role.toLowerCase().includes(term)
    )
  })

  const membersByRole = computed(() => {
    const grouped: Record<string, SchoolBoardMember[]> = {}

    for (const member of sortedMembers.value) {
      if (!grouped[member.role]) {
        grouped[member.role] = []
      }
      grouped[member.role].push(member)
    }

    return grouped
  })

  const roleStats = computed(() => {
    const stats: Record<string, number> = {}

    for (const member of members.value) {
      stats[member.role] = (stats[member.role] || 0) + 1
    }

    return stats
  })

  // Methods
  const loadMembers = async () => {
    loading.value = true
    error.value = null

    try {
      const result = await schoolBoardService.getBoardMembers()

      if (result.success && result.data) {
        members.value = result.data

        if (trackAnalytics) {
          trackUserInteraction('board_members_loaded', 'api', {
            member_count: result.data.length
          })
        }
      } else {
        error.value = result.error || 'Failed to load board members'
      }
    } catch (err: any) {
      error.value = err.message || 'An unexpected error occurred'
    } finally {
      loading.value = false
    }
  }

  const addMember = async (memberData: {
    name_hu: string
    name_rs?: string
    role: string
  }) => {
    loading.value = true
    error.value = null

    try {
      const result = await schoolBoardService.createMember(memberData)

      if (result.success && result.data) {
        members.value.push(result.data)

        if (trackAnalytics) {
          trackAdminAction('create', 'board_member', result.data.id)
        }

        return result.data
      } else {
        error.value = result.error || 'Failed to add member'
        return null
      }
    } catch (err: any) {
      error.value = err.message || 'An unexpected error occurred'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateMember = async (id: string, memberData: Partial<{
    name_hu: string
    name_rs: string
    role: string
  }>) => {
    loading.value = true
    error.value = null

    try {
      const result = await schoolBoardService.updateMember(id, memberData)

      if (result.success && result.data) {
        const index = members.value.findIndex(m => m.id === id)
        if (index !== -1) {
          members.value[index] = result.data
        }

        if (trackAnalytics) {
          trackAdminAction('update', 'board_member', id)
        }

        return result.data
      } else {
        error.value = result.error || 'Failed to update member'
        return null
      }
    } catch (err: any) {
      error.value = err.message || 'An unexpected error occurred'
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteMember = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const result = await schoolBoardService.delete(id)

      if (result.success) {
        members.value = members.value.filter(m => m.id !== id)

        if (trackAnalytics) {
          trackAdminAction('delete', 'board_member', id)
        }

        return true
      } else {
        error.value = result.error || 'Failed to delete member'
        return false
      }
    } catch (err: any) {
      error.value = err.message || 'An unexpected error occurred'
      return false
    } finally {
      loading.value = false
    }
  }

  const searchMembers = async (term: string) => {
    if (!term.trim()) {
      searchTerm.value = ''
      return
    }

    searchTerm.value = term
    loading.value = true
    error.value = null

    try {
      const result = await schoolBoardService.searchMembers(term)

      if (result.success && result.data) {
        // For search, we replace the current members array
        members.value = result.data

        if (trackAnalytics) {
          trackUserInteraction('board_search', 'search_input', {
            search_term: term,
            results_count: result.data.length
          })
        }
      } else {
        error.value = result.error || 'Search failed'
      }
    } catch (err: any) {
      error.value = err.message || 'Search failed'
    } finally {
      loading.value = false
    }
  }

  const clearSearch = () => {
    searchTerm.value = ''
    loadMembers()
  }

  const getMembersByRole = async (role: string) => {
    loading.value = true
    error.value = null

    try {
      const result = await schoolBoardService.getMembersByRole(role)

      if (result.success && result.data) {
        return result.data
      } else {
        error.value = result.error || `Failed to get ${role} members`
        return []
      }
    } catch (err: any) {
      error.value = err.message || 'An unexpected error occurred'
      return []
    } finally {
      loading.value = false
    }
  }

  // Helper functions
  const getDisplayName = (member: SchoolBoardMember) => {
    return i18nService.getDisplayName({
      name_hu: member.name_hu,
      name_rs: member.name_rs
    })
  }

  const getDisplayRole = (member: SchoolBoardMember) => {
    return i18nService.getRoleTranslation(member.role)
  }

  const isPresident = (member: SchoolBoardMember) => {
    return member.role && member.role.toLowerCase().includes('elnök') && !member.role.toLowerCase().includes('alelnök')
  }

  const isVicePresident = (member: SchoolBoardMember) => {
    return member.role && member.role.toLowerCase().includes('alelnök')
  }

  const isPresidentOrVice = (member: SchoolBoardMember) => {
    return isPresident(member) || isVicePresident(member)
  }

  const getRoleBadgeClass = (member: SchoolBoardMember) => {
    if (isPresident(member)) {
      return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300'
    } else if (isVicePresident(member)) {
      return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300'
    } else {
      return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300'
    }
  }

  // Lifecycle
  if (autoLoad) {
    onMounted(() => {
      loadMembers()
    })
  }

  return {
    // State
    members,
    loading,
    error,
    searchTerm,

    // Computed
    isAdmin,
    sortedMembers,
    filteredMembers,
    membersByRole,
    roleStats,

    // Methods
    loadMembers,
    addMember,
    updateMember,
    deleteMember,
    searchMembers,
    clearSearch,
    getMembersByRole,

    // Helper functions
    getDisplayName,
    getDisplayRole,
    isPresident,
    isVicePresident,
    isPresidentOrVice,
    getRoleBadgeClass
  }
}