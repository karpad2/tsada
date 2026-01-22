import { notify } from '@kyvg/vue3-notification';
import { Storage, ID } from 'appwrite';
import { appwriteService } from './index';
import type { AppwriteConfig } from './index';

export interface FileUploadOptions {
    file: File;
    bucketId?: string;
    onProgress?: (progress: number) => void;
    onSuccess?: (fileId: string) => void;
    onError?: (error: Error) => void;
}

export interface FileUploadResult {
    $id: string;
    name: string;
    size: number;
    mimeType: string;
}

export class FileManager {
    private storage: Storage;
    private config: AppwriteConfig;

    // Storage ID mapping - maps short names to actual bucket IDs
    private readonly storageMap: Record<string, keyof AppwriteConfig> = {
        'documents': 'documents_storage',
        'documents_storage': 'documents_storage',
        'images': 'website_images',
        'website_images': 'website_images',
        'gallery': 'gallery_pictures_storage',
        'gallery_pictures_storage': 'gallery_pictures_storage',
        'erasmus': 'fs_erasmus',
        'fs_erasmus': 'fs_erasmus'
    };

    constructor() {
        this.storage = appwriteService.getStorage();
        this.config = appwriteService.config;
    }

    /**
     * Resolves a storage ID to the actual bucket ID from config
     * @param storageId - Short name (e.g., 'documents') or actual bucket ID
     * @returns The actual Appwrite bucket ID
     */
    private resolveBucketId(storageId?: string): string {
        // Handle undefined, null, or empty string
        if (!storageId || storageId.trim() === '') {
            return this.config.website_images;
        }

        // Check if it's a short name that needs mapping
        const configKey = this.storageMap[storageId];
        if (configKey && this.config[configKey]) {
            return this.config[configKey] as string;
        }

        // If it looks like an actual bucket ID (20+ char alphanumeric string), use it directly
        if (storageId.length >= 20 && /^[a-zA-Z0-9]+$/.test(storageId)) {
            return storageId;
        }

        // Fallback to website_images if unknown
        console.warn(`Unknown storage ID '${storageId}', using default bucket`);
        return this.config.website_images;
    }

    async uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
        const { file, bucketId, onProgress, onSuccess, onError } = options;
        const resolvedBucketId = this.resolveBucketId(bucketId);

        try {
            this.validateFile(file);

            const fileId = ID.unique();
            const result = await this.storage.createFile(resolvedBucketId, fileId, file);

            const uploadResult: FileUploadResult = {
                $id: result.$id,
                name: result.name,
                size: result.sizeOriginal,
                mimeType: result.mimeType
            };

            if (onSuccess) {
                onSuccess(result.$id);
            }

            if (onProgress) {
                onProgress(100);
            }

            notify({
                type: 'success',
                text: `File "${file.name}" uploaded successfully!`
            });

            return uploadResult;
        } catch (error: any) {
            console.error('File upload failed:', error);

            const errorMessage = this.getErrorMessage(error);

            if (onError) {
                onError(new Error(errorMessage));
            }

            notify({
                type: 'error',
                text: errorMessage
            });

            throw new Error(errorMessage);
        }
    }

    async uploadMultipleFiles(
        files: File[],
        storageId?: string,
        onProgress?: (progress: number) => void
    ): Promise<FileUploadResult[]> {
        const resolvedBucketId = this.resolveBucketId(storageId);
        const results: FileUploadResult[] = [];
        const totalFiles = files.length;

        for (let i = 0; i < totalFiles; i++) {
            try {
                const result = await this.uploadFile({
                    file: files[i],
                    bucketId: resolvedBucketId,
                    onProgress: (fileProgress) => {
                        const overallProgress = Math.round(((i + fileProgress/100) / totalFiles) * 100);
                        if (onProgress) {
                            onProgress(overallProgress);
                        }
                    }
                });
                results.push(result);
            } catch (error) {
                console.error(`Failed to upload file ${files[i].name}:`, error);
                throw error;
            }
        }

        return results;
    }

    async deleteFile(fileId: string, storageId?: string): Promise<void> {
        const resolvedBucketId = this.resolveBucketId(storageId);
        try {
            await this.storage.deleteFile(resolvedBucketId, fileId);

            notify({
                type: 'success',
                text: 'File deleted successfully!'
            });
        } catch (error: any) {
            console.error('File deletion failed:', error);
            const errorMessage = this.getErrorMessage(error);

            notify({
                type: 'error',
                text: errorMessage
            });

            throw new Error(errorMessage);
        }
    }

    getFilePreview(
        fileId: string,
        storageId?: string,
        width: number = 400,
        height: number = 400
    ): string {
        const resolvedBucketId = this.resolveBucketId(storageId);
        return this.storage.getFilePreview(
            resolvedBucketId,
            fileId,
            width,
            height
        );
    }

    getFileView(fileId: string, storageId?: string): string {
        const resolvedBucketId = this.resolveBucketId(storageId);
        return this.storage.getFileView(resolvedBucketId, fileId);
    }

    getFileDownload(fileId: string, storageId?: string): string {
        const resolvedBucketId = this.resolveBucketId(storageId);
        return this.storage.getFileDownload(resolvedBucketId, fileId);
    }

    private validateFile(file: File): void {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (file.size > maxSize) {
            throw new Error(`File size too large. Maximum allowed size is 50MB.`);
        }

        if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type "${file.type}" is not allowed.`);
        }
    }

    private getErrorMessage(error: any): string {
        if (error.code === 400) {
            return 'Invalid file format or file is corrupted.';
        }
        if (error.code === 413) {
            return 'File is too large. Please choose a smaller file.';
        }
        if (error.code === 401) {
            return 'You are not authorized to upload files.';
        }
        if (error.code === 500) {
            return 'Server error occurred while uploading the file.';
        }

        return error.message || 'An unknown error occurred during file upload.';
    }
}

export const fileManager = new FileManager();

// Legacy function for backward compatibility
export async function fileupload(
    storage: Storage,
    bucket: string,
    path: string,
    file: File
): Promise<any> {
    console.warn('fileupload function is deprecated. Use FileManager.uploadFile instead.');
    return fileManager.uploadFile({ file, bucketId: bucket });
}

