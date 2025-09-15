import { ref, reactive, computed, onMounted } from 'vue'
import { documentService } from '@/services/api/DocumentService'
import { i18nService } from '@/services/i18n/I18nService'
import { trackUserInteraction, trackError } from '@/utils/analytics'
import type {
  DocumentItem,
  DocumentCategory,
  DocumentItemInput,
  DocumentCategoryInput,
  DocumentSearchOptions
} from '@/services/api/DocumentService'

export interface UseDocumentsOptions {
  autoLoad?: boolean
  includeArchived?: boolean
  category?: string
}

export interface DocumentsState {
  documents: DocumentItem[]
  categories: DocumentCategory[]
  loading: boolean
  error: string | null
  searchTerm: string
  selectedCategories: string[]
  showArchived: boolean
}

export function useDocuments(options: UseDocumentsOptions = {}) {
  // Reactive state
  const state = reactive<DocumentsState>({
    documents: [],
    categories: [],
    loading: false,
    error: null,
    searchTerm: '',
    selectedCategories: options.category ? [options.category] : [],
    showArchived: options.includeArchived || false
  })

  // Computed properties
  const filteredDocuments = computed(() => {
    let filtered = state.documents

    // Filter by search term
    if (state.searchTerm.trim()) {
      const searchLower = state.searchTerm.toLowerCase()
      filtered = filtered.filter(doc => {
        const title = getLocalizedTitle(doc)
        return title.toLowerCase().includes(searchLower) ||
               doc.contact?.toLowerCase().includes(searchLower)
      })
    }

    // Filter by categories
    if (state.selectedCategories.length > 0) {
      filtered = filtered.filter(doc =>
        doc.document_categories.some(cat => state.selectedCategories.includes(cat))
      )
    }

    // Filter by archive status
    if (!state.showArchived) {
      filtered = filtered.filter(doc => !doc.archived)
    }

    return filtered
  })

  const visibleCategories = computed(() => {
    if (state.showArchived) {
      return state.categories
    }
    return state.categories.filter(cat => !cat.archived)
  })

  const documentsByCategory = computed(() => {
    const grouped: Record<string, DocumentItem[]> = {}

    for (const category of visibleCategories.value) {
      const categoryDocuments = filteredDocuments.value.filter(doc =>
        doc.document_categories.includes(category.id)
      )

      if (categoryDocuments.length > 0 || state.showArchived) {
        const categoryName = getLocalizedCategoryName(category)
        grouped[categoryName] = categoryDocuments
      }
    }

    return grouped
  })

  // Document methods
  const loadDocuments = async (searchOptions?: DocumentSearchOptions) => {
    state.loading = true
    state.error = null

    try {
      const options: DocumentSearchOptions = {
        archived: state.showArchived ? undefined : false,
        categories: state.selectedCategories.length > 0 ? state.selectedCategories : undefined,
        ...searchOptions
      }

      const response = await documentService.getDocuments(options)

      if (response.success && response.data) {
        state.documents = response.data
      } else {
        throw new Error(response.error || 'Failed to load documents')
      }
    } catch (error: any) {
      console.error('Error loading documents:', error)
      state.error = error.message
      trackError('documents_load_error', error, {})
    } finally {
      state.loading = false
    }
  }

  const loadCategories = async (includeArchived = false) => {
    try {
      const response = await documentService.getCategories(includeArchived)

      if (response.success && response.data) {
        state.categories = response.data
      } else {
        throw new Error(response.error || 'Failed to load categories')
      }
    } catch (error: any) {
      console.error('Error loading categories:', error)
      state.error = error.message
      trackError('document_categories_load_error', error, {})
    }
  }

  const createDocument = async (documentData: DocumentItemInput): Promise<boolean> => {
    state.loading = true
    state.error = null

    try {
      trackUserInteraction('document_create_attempt', 'documents', 1)

      const response = await documentService.createDocument(documentData)

      if (response.success && response.data) {
        state.documents.unshift(response.data)
        trackUserInteraction('document_created', 'documents', 1)
        return true
      } else {
        throw new Error(response.error || 'Failed to create document')
      }
    } catch (error: any) {
      console.error('Error creating document:', error)
      state.error = error.message
      trackError('document_create_error', error, documentData)
      return false
    } finally {
      state.loading = false
    }
  }

  const updateDocument = async (id: string, documentData: Partial<DocumentItemInput>): Promise<boolean> => {
    state.loading = true
    state.error = null

    try {
      trackUserInteraction('document_update_attempt', 'documents', 1)

      const response = await documentService.updateDocument(id, documentData)

      if (response.success && response.data) {
        const index = state.documents.findIndex(doc => doc.id === id)
        if (index !== -1) {
          state.documents[index] = response.data
        }
        trackUserInteraction('document_updated', 'documents', 1)
        return true
      } else {
        throw new Error(response.error || 'Failed to update document')
      }
    } catch (error: any) {
      console.error('Error updating document:', error)
      state.error = error.message
      trackError('document_update_error', error, { id, data: documentData })
      return false
    } finally {
      state.loading = false
    }
  }

  const deleteDocument = async (id: string, confirmDelete = true): Promise<boolean> => {
    if (confirmDelete && !confirm('Are you sure you want to delete this document?')) {
      return false
    }

    state.loading = true
    state.error = null

    try {
      trackUserInteraction('document_delete_attempt', 'documents', 1)

      const response = await documentService.deleteDocument(id)

      if (response.success) {
        state.documents = state.documents.filter(doc => doc.id !== id)
        trackUserInteraction('document_deleted', 'documents', 1)
        return true
      } else {
        throw new Error(response.error || 'Failed to delete document')
      }
    } catch (error: any) {
      console.error('Error deleting document:', error)
      state.error = error.message
      trackError('document_delete_error', error, { id })
      return false
    } finally {
      state.loading = false
    }
  }

  const toggleDocumentArchive = async (id: string): Promise<boolean> => {
    state.loading = true
    state.error = null

    try {
      const response = await documentService.toggleDocumentArchive(id)

      if (response.success && response.data) {
        const index = state.documents.findIndex(doc => doc.id === id)
        if (index !== -1) {
          state.documents[index] = response.data
        }
        return true
      } else {
        throw new Error(response.error || 'Failed to toggle document archive status')
      }
    } catch (error: any) {
      console.error('Error toggling document archive:', error)
      state.error = error.message
      trackError('document_archive_error', error, { id })
      return false
    } finally {
      state.loading = false
    }
  }

  // Category methods
  const createCategory = async (categoryData: DocumentCategoryInput): Promise<boolean> => {
    state.loading = true
    state.error = null

    try {
      trackUserInteraction('document_category_create_attempt', 'documents', 1)

      const response = await documentService.createCategory(categoryData)

      if (response.success && response.data) {
        state.categories.push(response.data)
        trackUserInteraction('document_category_created', 'documents', 1)
        return true
      } else {
        throw new Error(response.error || 'Failed to create category')
      }
    } catch (error: any) {
      console.error('Error creating category:', error)
      state.error = error.message
      trackError('document_category_create_error', error, categoryData)
      return false
    } finally {
      state.loading = false
    }
  }

  const updateCategory = async (id: string, categoryData: Partial<DocumentCategoryInput>): Promise<boolean> => {
    state.loading = true
    state.error = null

    try {
      trackUserInteraction('document_category_update_attempt', 'documents', 1)

      const response = await documentService.updateCategory(id, categoryData)

      if (response.success && response.data) {
        const index = state.categories.findIndex(cat => cat.id === id)
        if (index !== -1) {
          state.categories[index] = response.data
        }
        trackUserInteraction('document_category_updated', 'documents', 1)
        return true
      } else {
        throw new Error(response.error || 'Failed to update category')
      }
    } catch (error: any) {
      console.error('Error updating category:', error)
      state.error = error.message
      trackError('document_category_update_error', error, { id, data: categoryData })
      return false
    } finally {
      state.loading = false
    }
  }

  const deleteCategory = async (id: string, deleteDocuments = false, confirmDelete = true): Promise<boolean> => {
    if (confirmDelete && !confirm('Are you sure you want to delete this category?')) {
      return false
    }

    state.loading = true
    state.error = null

    try {
      trackUserInteraction('document_category_delete_attempt', 'documents', 1)

      const response = await documentService.deleteCategory(id, deleteDocuments)

      if (response.success) {
        state.categories = state.categories.filter(cat => cat.id !== id)

        if (deleteDocuments) {
          // Remove documents from this category
          state.documents = state.documents.filter(doc =>
            !doc.document_categories.includes(id)
          )
        }

        trackUserInteraction('document_category_deleted', 'documents', 1)
        return true
      } else {
        throw new Error(response.error || 'Failed to delete category')
      }
    } catch (error: any) {
      console.error('Error deleting category:', error)
      state.error = error.message
      trackError('document_category_delete_error', error, { id })
      return false
    } finally {
      state.loading = false
    }
  }

  const toggleCategoryArchive = async (id: string): Promise<boolean> => {
    state.loading = true
    state.error = null

    try {
      const response = await documentService.toggleCategoryArchive(id)

      if (response.success && response.data) {
        const index = state.categories.findIndex(cat => cat.id === id)
        if (index !== -1) {
          state.categories[index] = response.data
        }
        return true
      } else {
        throw new Error(response.error || 'Failed to toggle category archive status')
      }
    } catch (error: any) {
      console.error('Error toggling category archive:', error)
      state.error = error.message
      trackError('document_category_archive_error', error, { id })
      return false
    } finally {
      state.loading = false
    }
  }

  // Search methods
  const searchDocuments = async (searchTerm: string) => {
    state.searchTerm = searchTerm

    if (searchTerm.trim()) {
      await loadDocuments({
        query: searchTerm,
        categories: state.selectedCategories.length > 0 ? state.selectedCategories : undefined
      })
    } else {
      await loadDocuments()
    }
  }

  const filterByCategories = async (categoryIds: string[]) => {
    state.selectedCategories = categoryIds
    await loadDocuments()
  }

  const toggleShowArchived = async () => {
    state.showArchived = !state.showArchived
    await Promise.all([
      loadDocuments(),
      loadCategories(state.showArchived)
    ])
  }

  // Helper methods
  const getLocalizedTitle = (document: DocumentItem): string => {
    return i18nService.getLocalizedContent({
      document_title_hu: document.document_title_hu,
      document_title_rs: document.document_title_rs,
      document_title_en: document.document_title_en
    }) || 'Untitled Document'
  }

  const getLocalizedCategoryName = (category: DocumentCategory): string => {
    return i18nService.getLocalizedContent({
      category_name_hu: category.category_name_hu,
      category_name_rs: category.category_name_rs,
      category_name_en: category.category_name_en
    }) || 'Unnamed Category'
  }

  const refreshData = async () => {
    await Promise.all([
      loadDocuments(),
      loadCategories(state.showArchived)
    ])
  }

  const clearError = () => {
    state.error = null
  }

  // Lifecycle
  onMounted(async () => {
    if (options.autoLoad !== false) {
      await Promise.all([
        loadDocuments(),
        loadCategories(options.includeArchived || false)
      ])
    }
  })

  return {
    // State
    state,

    // Computed
    filteredDocuments,
    visibleCategories,
    documentsByCategory,

    // Document methods
    loadDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    toggleDocumentArchive,

    // Category methods
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryArchive,

    // Search and filter methods
    searchDocuments,
    filterByCategories,
    toggleShowArchived,

    // Helper methods
    getLocalizedTitle,
    getLocalizedCategoryName,
    refreshData,
    clearError
  }
}