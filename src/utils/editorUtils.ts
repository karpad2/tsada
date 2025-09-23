import { ID } from 'appwrite';
import { appwriteService } from '@/appwrite';
import { fileManager, type FileUploadResult, type FileUploadOptions } from '@/appwrite/FileManagement';
import { notify } from '@kyvg/vue3-notification';

export interface EditorFormData {
    [key: string]: any;
    // Multi-language fields
    title_rs?: string;
    title_hu?: string;
    title_en?: string;
    content_rs?: string;
    content_hu?: string;
    content_en?: string;
    short_rs?: string;
    short_hu?: string;
    short_en?: string;
    visible?: boolean;
}

export interface SaveOptions {
    databaseId: string;
    collectionId: string;
    documentId: string;
    data: Record<string, any>;
    successMessage?: string;
}

export interface DeleteOptions {
    databaseId: string;
    collectionId: string;
    documentId: string;
    redirectPath?: string;
    successMessage?: string;
}

export interface MultiLanguageContent {
    rs: LanguageContent;
    hu: LanguageContent;
    en: LanguageContent;
}

export interface LanguageContent {
    title: string;
    content: string;
    short: string;
    flag: boolean;
}

export { type FileUploadResult, type FileUploadOptions };

// Multi-language utilities
export class MultiLanguageManager {
    private static readonly supportedLanguages = ['rs', 'hu', 'en'] as const;

    static getSupportedLanguages(): readonly string[] {
        return this.supportedLanguages;
    }

    static createLanguageFields(): EditorFormData {
        const fields: EditorFormData = {};

        this.supportedLanguages.forEach(lang => {
            fields[`title_${lang}`] = '';
            fields[`content_${lang}`] = '';
            fields[`short_${lang}`] = '';
            fields[`${lang}_flag`] = false;
        });

        return fields;
    }

    static getLanguageFieldNames(fieldType: 'title' | 'content' | 'short'): string[] {
        return this.supportedLanguages.map(lang => `${fieldType}_${lang}`);
    }

    static getLanguageFlagNames(): string[] {
        return this.supportedLanguages.map(lang => `${lang}_flag`);
    }

    static extractLanguageContent(data: EditorFormData): MultiLanguageContent {
        return {
            rs: {
                title: data.title_rs || '',
                content: data.content_rs || '',
                short: data.short_rs || '',
                flag: data.rs_flag || false
            },
            hu: {
                title: data.title_hu || '',
                content: data.content_hu || '',
                short: data.short_hu || '',
                flag: data.hu_flag || false
            },
            en: {
                title: data.title_en || '',
                content: data.content_en || '',
                short: data.short_en || '',
                flag: data.en_flag || false
            }
        };
    }

    static validateLanguageContent(data: EditorFormData, requiredLanguages: string[] = ['rs']): string[] {
        const errors: string[] = [];

        requiredLanguages.forEach(lang => {
            if (!data[`title_${lang}`] || data[`title_${lang}`].trim() === '') {
                errors.push(`Title in ${lang.toUpperCase()} is required`);
            }
        });

        return errors;
    }
}

// Document management
export class DocumentManager {
    private databases = appwriteService.getDatabases();
    private config = appwriteService.config;

    async save(options: SaveOptions): Promise<any> {
        try {
            const result = await this.databases.updateDocument(
                options.databaseId,
                options.collectionId,
                options.documentId,
                options.data
            );

            if (options.successMessage) {
                showNotification(options.successMessage, 'success');
            }

            return result;
        } catch (error: any) {
            console.error('Error saving document:', error);
            showNotification(this.getErrorMessage(error, 'save'), 'error');
            throw error;
        }
    }

    async create(collectionId: string, data: Record<string, any>, documentId?: string): Promise<any> {
        try {
            const result = await this.databases.createDocument(
                this.config.website_db,
                collectionId,
                documentId || ID.unique(),
                data
            );

            showNotification('Document created successfully', 'success');
            return result;
        } catch (error: any) {
            console.error('Error creating document:', error);
            showNotification(this.getErrorMessage(error, 'create'), 'error');
            throw error;
        }
    }

    async delete(options: DeleteOptions): Promise<void> {
        try {
            await this.databases.deleteDocument(
                options.databaseId,
                options.collectionId,
                options.documentId
            );

            const message = options.successMessage || 'Document deleted successfully';
            showNotification(message, 'success');
        } catch (error: any) {
            console.error('Error deleting document:', error);
            showNotification(this.getErrorMessage(error, 'delete'), 'error');
            throw error;
        }
    }

    async get(collectionId: string, documentId: string): Promise<any> {
        try {
            return await this.databases.getDocument(
                this.config.website_db,
                collectionId,
                documentId
            );
        } catch (error: any) {
            console.error('Error fetching document:', error);
            showNotification(this.getErrorMessage(error, 'fetch'), 'error');
            throw error;
        }
    }

    async list(collectionId: string, queries?: any[]): Promise<any> {
        try {
            return await this.databases.listDocuments(
                this.config.website_db,
                collectionId,
                queries
            );
        } catch (error: any) {
            console.error('Error listing documents:', error);
            showNotification(this.getErrorMessage(error, 'list'), 'error');
            throw error;
        }
    }

    private getErrorMessage(error: any, operation: string): string {
        if (error.code === 401) return `You are not authorized to ${operation} this document.`;
        if (error.code === 404) return 'Document not found.';
        if (error.code === 409) return 'Document already exists.';
        if (error.code === 500) return `Server error occurred while trying to ${operation} the document.`;
        return error.message || `An error occurred while trying to ${operation} the document.`;
    }
}

export const documentManager = new DocumentManager();

// Legacy function for backward compatibility
export const saveDocument = (options: SaveOptions) => documentManager.save(options);

// Legacy function for backward compatibility
export const deleteDocument = (options: DeleteOptions) => documentManager.delete(options);

// File management utilities
export const uploadFile = (file: File, storageId?: string) =>
    fileManager.uploadFile({ file, bucketId: storageId });

export const uploadMultipleFiles = (files: File[], storageId?: string, onProgress?: (progress: number) => void) =>
    fileManager.uploadMultipleFiles(files, storageId, onProgress);

export const deleteFile = (fileId: string, storageId?: string) =>
    fileManager.deleteFile(fileId, storageId);

// File URL utilities
export const getFilePreview = (fileId: string, storageId?: string, width?: number, height?: number) =>
    fileManager.getFilePreview(fileId, storageId, width, height);

export const getFileView = (fileId: string, storageId?: string) =>
    fileManager.getFileView(fileId, storageId);

export const getFileDownload = (fileId: string, storageId?: string) =>
    fileManager.getFileDownload(fileId, storageId);

// Legacy function for backward compatibility
export const createLanguageFields = (languages?: string[]) =>
    MultiLanguageManager.createLanguageFields();

// Enhanced validation utilities
export class ValidationManager {
    static validateFormData(data: EditorFormData, requiredFields: string[]): string[] {
        const errors: string[] = [];

        requiredFields.forEach(field => {
            if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
                errors.push(`Field ${field} is required`);
            }
        });

        return errors;
    }

    static validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static validateFileSize(file: File, maxSizeMB: number): boolean {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    }

    static validateFileType(file: File, allowedTypes: string[]): boolean {
        return allowedTypes.some(type =>
            file.type.includes(type) || file.name.toLowerCase().endsWith(type.replace('*', ''))
        );
    }

    static validateMultiLanguageContent(data: EditorFormData, requiredLanguages: string[] = ['rs']): string[] {
        return MultiLanguageManager.validateLanguageContent(data, requiredLanguages);
    }
}

export const validateFormData = ValidationManager.validateFormData;

// Auto-save functionality
export class AutoSaver {
    private saveFunction: () => Promise<void>;
    private timeout: NodeJS.Timeout | null = null;
    private delay: number;

    constructor(saveFunction: () => Promise<void>, delay: number = 1000) {
        this.saveFunction = saveFunction;
        this.delay = delay;
    }

    scheduleAutoSave(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(async () => {
            try {
                await this.saveFunction();
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, this.delay);
    }

    cancelAutoSave(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}

// Enhanced notification system
export const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success',
    duration: number = 4000
): void => {
    notify({
        type,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        text: message,
        duration
    });
};

// Common loading state manager
export class LoadingManager {
    private loadingStates: Map<string, boolean> = new Map();
    private callbacks: Map<string, () => void> = new Map();

    setLoading(key: string, isLoading: boolean, callback?: () => void): void {
        this.loadingStates.set(key, isLoading);
        if (callback) {
            this.callbacks.set(key, callback);
            callback();
        }
    }

    isLoading(key: string): boolean {
        return this.loadingStates.get(key) || false;
    }

    isAnyLoading(): boolean {
        return Array.from(this.loadingStates.values()).some(loading => loading);
    }
}

// Gallery management
export class GalleryManager {
    private documentManager = documentManager;
    private config = appwriteService.config;

    async deleteImageFromGallery(imageId: string, galleryId: string): Promise<void> {
        try {
            // Delete from storage
            await fileManager.deleteFile(imageId, this.config.website_images);

            // Delete from gallery_images collection
            await this.documentManager.delete({
                databaseId: this.config.website_db,
                collectionId: this.config.gallery_images || this.config.album_images,
                documentId: imageId
            });

            showNotification('Image deleted successfully', 'success');
        } catch (error: any) {
            console.error('Error deleting image from gallery:', error);
            throw error;
        }
    }

    async setDefaultImage(imageId: string, galleryId: string, collectionId: string): Promise<void> {
        try {
            await this.documentManager.save({
                databaseId: this.config.website_db,
                collectionId,
                documentId: galleryId,
                data: { default_image: imageId },
                successMessage: 'Default image updated successfully'
            });
        } catch (error: any) {
            console.error('Error setting default image:', error);
            throw error;
        }
    }

    async addImageToGallery(galleryId: string, imageId: string): Promise<void> {
        try {
            console.log('GalleryManager - Adding image to gallery:', {
                galleryId,
                imageId,
                collection: this.config.gallery_images || this.config.album_images
            });
            await this.documentManager.create(
                this.config.gallery_images || this.config.album_images,
                {
                    gallery: galleryId,
                    image_id: imageId
                },
                imageId
            );
            console.log('GalleryManager - Successfully added image to gallery');
        } catch (error: any) {
            console.error('Error adding image to gallery:', error);
            throw error;
        }
    }

    async getGalleryImages(galleryId: string): Promise<any[]> {
        try {
            const result = await this.documentManager.list(
                this.config.gallery_images || this.config.album_images,
                [`gallery=${galleryId}`]
            );
            return result.documents;
        } catch (error: any) {
            console.error('Error fetching gallery images:', error);
            throw error;
        }
    }
}

export const galleryManager = new GalleryManager();

// Legacy functions for backward compatibility
export const deleteImageFromGallery = (imageId: string, galleryId: string) =>
    galleryManager.deleteImageFromGallery(imageId, galleryId);

export const setDefaultImage = (imageId: string, galleryId: string, collectionId: string) =>
    galleryManager.setDefaultImage(imageId, galleryId, collectionId);

// Legacy validation functions
export const validateFileType = ValidationManager.validateFileType;
export const validateFileSize = ValidationManager.validateFileSize;

// Enhanced editor configuration
export class EditorConfigManager {
    private static readonly config = {
        imageUpload: {
            maxSize: 10, // MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
            quality: 85,
            maxWidth: 1920,
            maxHeight: 1080
        },
        documentUpload: {
            maxSize: 50, // MB
            allowedTypes: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ],
            allowedExtensions: ['.pdf', '.doc', '.docx', '.txt']
        },
        autoSave: {
            delay: 2000, // ms
            enabled: true
        },
        validation: {
            requiredLanguages: ['rs'],
            optionalLanguages: ['hu', 'en']
        },
        ui: {
            theme: 'light',
            density: 'comfortable',
            transition: 'scale-transition'
        }
    };

    static getConfig() {
        return { ...this.config };
    }

    static getImageConfig() {
        return { ...this.config.imageUpload };
    }

    static getDocumentConfig() {
        return { ...this.config.documentUpload };
    }

    static getAutoSaveConfig() {
        return { ...this.config.autoSave };
    }

    static getValidationConfig() {
        return { ...this.config.validation };
    }

    static getUIConfig() {
        return { ...this.config.ui };
    }
}

export const getEditorConfig = EditorConfigManager.getConfig;

// Enhanced data parsing utilities
export class DataParsingManager {
    static parseScheduleData(scheduleString: string): any[] {
        try {
            return JSON.parse(scheduleString || '[]');
        } catch (error) {
            console.warn('Failed to parse schedule data:', error);
            return [];
        }
    }

    static stringifyScheduleData(schedules: any[]): string {
        try {
            return JSON.stringify(schedules, null, 2);
        } catch (error) {
            console.warn('Failed to stringify schedule data:', error);
            return '[]';
        }
    }

    static parseJsonSafely<T>(jsonString: string, fallback: T): T {
        try {
            return JSON.parse(jsonString) as T;
        } catch {
            return fallback;
        }
    }

    static stringifyJsonSafely(data: any): string {
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return '{}';
        }
    }

    static formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static formatDate(date: string | Date): string {
        const d = new Date(date);
        return d.toLocaleDateString('sr-RS', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    static formatDateTime(date: string | Date): string {
        const d = new Date(date);
        return d.toLocaleString('sr-RS', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Legacy functions
export const parseScheduleData = DataParsingManager.parseScheduleData;
export const stringifyScheduleData = DataParsingManager.stringifyScheduleData;

// TV/Slide editor specific utilities
export interface SlideData {
    id: string;
    title: string;
    text?: string;
    image?: string;
    sorrend: number;
    type: 'slide' | 'event';
    event_date?: string;
    description?: string;
    createdAt: string;
}

export interface EventData {
    id: string;
    title: string;
    description: string;
    date: string;
    image?: string;
}

// Fetch TV content (slides and events)
export const fetchTVContent = async (): Promise<{ slides: SlideData[], events: EventData[] }> => {
    const database = new Databases(appw);
    const storage = new Storage(appw);

    try {
        const contentData = await database.listDocuments(config.website_db, config.tv_slides);
        const slides: SlideData[] = [];
        const events: EventData[] = [];

        for (const doc of contentData.documents) {
            const imageUrl = doc.image ? storage.getFileView(config.website_images, doc.image).toString() : undefined;

            if (doc.type === 'slide') {
                slides.push({
                    id: doc.$id,
                    title: doc.title,
                    text: doc.text,
                    createdAt: doc.$createdAt,
                    sorrend: parseInt(doc.sorrend || '0'),
                    image: imageUrl,
                    type: 'slide'
                });
            } else if (doc.type === 'event') {
                events.push({
                    id: doc.$id,
                    title: doc.title,
                    date: doc.event_date,
                    description: doc.description,
                    image: imageUrl
                });
            }
        }

        slides.sort((a, b) => a.sorrend - b.sorrend);
        return { slides, events };
    } catch (error) {
        console.error("Error fetching TV content:", error);
        throw error;
    }
};

// Save slide
export const saveSlide = async (slideData: Partial<SlideData>, slideId?: string): Promise<string> => {
    const database = new Databases(appw);

    const data = {
        type: 'slide',
        title: slideData.title || '',
        text: slideData.text || '',
        image: slideData.image || '',
        sorrend: slideData.sorrend?.toString() || '0'
    };

    try {
        if (slideId) {
            await database.updateDocument(config.website_db, config.tv_slides, slideId, data);
            return slideId;
        } else {
            const result = await database.createDocument(config.website_db, config.tv_slides, ID.unique(), data);
            return result.$id;
        }
    } catch (error) {
        console.error("Error saving slide:", error);
        throw error;
    }
};

// Save event
export const saveEvent = async (eventData: Partial<EventData>, eventId?: string): Promise<string> => {
    const database = new Databases(appw);

    const data = {
        type: 'event',
        title: eventData.title || '',
        description: eventData.description || '',
        event_date: eventData.date || '',
        image: eventData.image || ''
    };

    try {
        if (eventId) {
            await database.updateDocument(config.website_db, config.tv_slides, eventId, data);
            return eventId;
        } else {
            const result = await database.createDocument(config.website_db, config.tv_slides, ID.unique(), data);
            return result.$id;
        }
    } catch (error) {
        console.error("Error saving event:", error);
        throw error;
    }
};

// Delete slide or event
export const deleteTVContent = async (contentId: string): Promise<void> => {
    const database = new Databases(appw);

    try {
        await database.deleteDocument(config.website_db, config.tv_slides, contentId);
    } catch (error) {
        console.error("Error deleting TV content:", error);
        throw error;
    }
};

// Update slide/event order
export const updateSlideOrder = async (slides: SlideData[]): Promise<void> => {
    const database = new Databases(appw);

    try {
        const updatePromises = slides.map((slide, index) =>
            database.updateDocument(config.website_db, config.tv_slides, slide.id, {
                sorrend: index.toString()
            })
        );

        await Promise.all(updatePromises);
    } catch (error) {
        console.error("Error updating slide order:", error);
        throw error;
    }
};

// Reorder array items
export const moveArrayItem = <T>(array: T[], fromIndex: number, toIndex: number): T[] => {
    const newArray = [...array];
    const item = newArray.splice(fromIndex, 1)[0];
    newArray.splice(toIndex, 0, item);
    return newArray;
};