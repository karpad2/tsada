// API Services
export { BaseApiService } from './api/BaseApiService'
export { SchoolBoardService } from './api/SchoolBoardService'
export { GalleryService } from './api/GalleryService'
export { DocumentService } from './api/DocumentService'
export { WorkerService } from './api/WorkerService'
export type { ApiResponse, QueryOptions } from './api/BaseApiService'
export type { SchoolBoardMember, SchoolBoardMemberInput } from './api/SchoolBoardService'
export type { GalleryItem, GalleryImage, GalleryItemInput, GalleryImageInput, GalleryStats, GallerySearchOptions } from './api/GalleryService'
export type { DocumentItem, DocumentCategory, DocumentItemInput, DocumentCategoryInput, DocumentStats, DocumentSearchOptions } from './api/DocumentService'
export type { Worker, WorkerRole, WorkerInput, WorkerRoleInput, WorkerSchedule, WorkerStats, WorkerSearchOptions } from './api/WorkerService'

// Validation Service
export { ValidationService } from './validation/ValidationService'
export type { ValidationRule, ValidationError, ValidationResult } from './validation/ValidationService'

// Storage Service
export { StorageService } from './storage/StorageService'
export type { UploadOptions, UploadResult, FileInfo } from './storage/StorageService'

// I18n Service
export { I18nService } from './i18n/I18nService'
export type { LanguageConfig, MultiLangContent } from './i18n/I18nService'

// Navigation Service
export { NavigationService } from './navigation/NavigationService'
export type { MenuItem, NavigationData } from './navigation/NavigationService'

// Service instances (singletons)
const validationService = ValidationService.getInstance()
const i18nService = I18nService.getInstance()
const storageService = new StorageService()
const schoolBoardService = new SchoolBoardService()
const galleryService = GalleryService.getInstance()
const navigationService = NavigationService.getInstance()
const documentService = DocumentService.getInstance()
const workerService = WorkerService.getInstance()

export {
  validationService,
  i18nService,
  storageService,
  schoolBoardService,
  galleryService,
  navigationService,
  documentService,
  workerService
}