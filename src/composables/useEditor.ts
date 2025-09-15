import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
    documentManager,
    AutoSaver,
    LoadingManager,
    showNotification,
    ValidationManager,
    MultiLanguageManager,
    type SaveOptions,
    type DeleteOptions
} from '@/utils/editorUtils';

export interface UseEditorOptions {
    collectionId: string;
    databaseId?: string;
    loadDataFunction?: (id: string) => Promise<any>;
    redirectAfterDelete?: string;
    autoSaveDelay?: number;
    requiredFields?: string[];
}

export function useEditor(options: UseEditorOptions) {
    const route = useRoute();
    const router = useRouter();
    const { t } = useI18n();

    // State
    const formData = reactive<Record<string, any>>({});
    const originalData = reactive<Record<string, any>>({});
    const hasChanges = ref(false);
    const loadingManager = new LoadingManager();

    // Auto-saver
    let autoSaver: AutoSaver | null = null;

    // Document ID from route
    const documentId = ref(route.params.id as string);

    // Check if data has changed
    const checkForChanges = () => {
        hasChanges.value = JSON.stringify(formData) !== JSON.stringify(originalData);
        return hasChanges.value;
    };

    // Load document data
    const loadData = async () => {
        if (!options.loadDataFunction || !documentId.value) return;

        loadingManager.setLoading('load', true);

        try {
            const data = await options.loadDataFunction(documentId.value);

            // Update form data
            Object.assign(formData, data);
            Object.assign(originalData, JSON.parse(JSON.stringify(data)));

            hasChanges.value = false;
        } catch (error) {
            console.error('Error loading data:', error);
            showNotification(t('error_loading_data'), 'error');
        } finally {
            loadingManager.setLoading('load', false);
        }
    };

    // Save document
    const save = async (showSuccess: boolean = true) => {
        if (!documentId.value) return;

        loadingManager.setLoading('save', true);

        try {
            const saveOptions: SaveOptions = {
                databaseId: options.databaseId || 'default',
                collectionId: options.collectionId,
                documentId: documentId.value,
                data: { ...formData },
                successMessage: showSuccess ? 'Changes saved successfully' : undefined
            };

            const result = await documentManager.save(saveOptions);

            // Update original data to reflect saved state
            Object.assign(originalData, JSON.parse(JSON.stringify(formData)));
            hasChanges.value = false;

            // Success message is handled by documentManager if showSuccess is true

            return result;
        } catch (error) {
            console.error('Error saving:', error);
            showNotification(t('error_saving'), 'error');
            throw error;
        } finally {
            loadingManager.setLoading('save', false);
        }
    };

    // Delete document
    const deleteContent = async () => {
        if (!documentId.value) return;

        if (!confirm(t('confirm_delete'))) {
            return;
        }

        loadingManager.setLoading('delete', true);

        try {
            const deleteOptions: DeleteOptions = {
                databaseId: options.databaseId || 'default',
                collectionId: options.collectionId,
                documentId: documentId.value,
                successMessage: 'Content deleted successfully'
            };

            await documentManager.delete(deleteOptions);

            // Success message is handled by documentManager

            // Redirect after successful deletion
            if (options.redirectAfterDelete) {
                router.push(options.redirectAfterDelete);
            } else {
                router.go(-1);
            }
        } catch (error) {
            console.error('Error deleting:', error);
            showNotification(t('error_deleting'), 'error');
        } finally {
            loadingManager.setLoading('delete', false);
        }
    };

    // Auto-save setup
    const setupAutoSave = () => {
        if (options.autoSaveDelay && options.autoSaveDelay > 0) {
            autoSaver = new AutoSaver(
                () => save(false), // Don't show success message for auto-save
                options.autoSaveDelay
            );
        }
    };

    // Trigger auto-save when data changes
    const handleFieldChange = () => {
        if (checkForChanges() && autoSaver) {
            autoSaver.scheduleAutoSave();
        }
    };

    // Update form field
    const updateField = (field: string, value: any) => {
        formData[field] = value;
        handleFieldChange();
    };

    // Update multiple fields
    const updateFields = (fields: Record<string, any>) => {
        Object.assign(formData, fields);
        handleFieldChange();
    };

    // Enhanced form validation
    const validateForm = (): string[] => {
        let errors: string[] = [];

        // Basic required fields validation
        if (options.requiredFields) {
            errors = errors.concat(ValidationManager.validateFormData(formData, options.requiredFields));
        }

        // Multi-language content validation
        if (hasMultiLanguageFields()) {
            errors = errors.concat(MultiLanguageManager.validateLanguageContent(formData, ['rs']));
        }

        return errors;
    };

    // Check if form has multi-language fields
    const hasMultiLanguageFields = (): boolean => {
        return Object.keys(formData).some(key =>
            key.includes('_rs') || key.includes('_hu') || key.includes('_en')
        );
    };

    // Save with validation
    const saveWithValidation = async (showSuccess: boolean = true) => {
        const errors = validateForm();

        if (errors.length > 0) {
            showNotification(errors[0], 'error');
            return false;
        }

        try {
            await save(showSuccess);
            return true;
        } catch {
            return false;
        }
    };

    // Before unload warning
    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
        if (hasChanges.value) {
            event.preventDefault();
            event.returnValue = t('unsaved_changes_warning');
            return t('unsaved_changes_warning');
        }
    };

    // Lifecycle
    onMounted(async () => {
        window.addEventListener('beforeunload', beforeUnloadHandler);
        setupAutoSave();
        await loadData();
    });

    onBeforeUnmount(() => {
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        if (autoSaver) {
            autoSaver.cancelAutoSave();
        }
    });

    return {
        // State
        formData,
        originalData,
        hasChanges,
        documentId,

        // Loading states
        isLoading: (key: string) => loadingManager.isLoading(key),
        isAnyLoading: () => loadingManager.isAnyLoading(),

        // Actions
        save,
        saveWithValidation,
        deleteContent,
        loadData,
        updateField,
        updateFields,
        validateForm,
        checkForChanges,
        handleFieldChange,

        // Utilities
        t
    };
}

// Language-specific helper composable
export function useLanguageFields(initialLanguages: string[] = ['rs', 'hu', 'en']) {
    const languages = ref(initialLanguages);

    const createLanguageData = () => {
        const data: Record<string, any> = {};

        languages.value.forEach(lang => {
            data[`title_${lang}`] = '';
            data[`content_${lang}`] = '';
            data[`short_${lang}`] = '';
            data[`${lang}_flag`] = false;
        });

        return data;
    };

    const getLanguageFieldNames = (fieldType: 'title' | 'content' | 'short') => {
        return languages.value.map(lang => `${fieldType}_${lang}`);
    };

    const getLanguageFlagNames = () => {
        return languages.value.map(lang => `${lang}_flag`);
    };

    return {
        languages,
        createLanguageData,
        getLanguageFieldNames,
        getLanguageFlagNames
    };
}