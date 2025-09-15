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

    constructor() {
        this.storage = appwriteService.getStorage();
        this.config = appwriteService.config;
    }

    async uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
        const { file, bucketId = this.config.website_images, onProgress, onSuccess, onError } = options;

        try {
            this.validateFile(file);

            const fileId = ID.unique();
            const result = await this.storage.createFile(bucketId, fileId, file);

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
        bucketId: string = this.config.website_images,
        onProgress?: (progress: number) => void
    ): Promise<FileUploadResult[]> {
        const results: FileUploadResult[] = [];
        const totalFiles = files.length;

        for (let i = 0; i < totalFiles; i++) {
            try {
                const result = await this.uploadFile({
                    file: files[i],
                    bucketId,
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

    async deleteFile(fileId: string, bucketId: string = this.config.website_images): Promise<void> {
        try {
            await this.storage.deleteFile(bucketId, fileId);

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
        bucketId: string = this.config.website_images,
        width: number = 400,
        height: number = 400,
        gravity: string = 'center',
        quality: number = 100
    ): string {
        return this.storage.getFilePreview(
            bucketId,
            fileId,
            width,
            height,
            gravity,
            quality
        ).href;
    }

    getFileView(fileId: string, bucketId: string = this.config.website_images): string {
        return this.storage.getFileView(bucketId, fileId).href;
    }

    getFileDownload(fileId: string, bucketId: string = this.config.website_images): string {
        return this.storage.getFileDownload(bucketId, fileId).href;
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

