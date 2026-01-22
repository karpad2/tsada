<template>
    <div class="form-block-editor">
        <!-- Mode Toggle -->
        <v-btn-toggle v-model="mode" mandatory class="mb-4" density="compact" color="primary">
            <v-btn value="select" size="small">
                <v-icon left size="small">mdi-format-list-bulleted</v-icon>
                {{ $t('select_existing') }}
            </v-btn>
            <v-btn value="create" size="small">
                <v-icon left size="small">mdi-plus</v-icon>
                {{ $t('create_new') }}
            </v-btn>
        </v-btn-toggle>

        <!-- SELECT MODE: Pick existing form -->
        <div v-if="mode === 'select'">
            <v-select
                v-model="localSettings.formId"
                :items="forms"
                :label="$t('select_form')"
                item-value="id"
                item-title="title"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-form-select"
                class="mb-4"
                @update:model-value="emitSettings"
            >
                <template #append>
                    <v-btn icon size="small" variant="text" @click="loadForms">
                        <v-icon>mdi-refresh</v-icon>
                    </v-btn>
                </template>
            </v-select>

            <v-switch
                v-model="localSettings.showResults"
                :label="$t('show_results')"
                color="primary"
                @change="emitSettings"
            />

            <!-- Selected Form Info -->
            <v-card v-if="selectedForm" variant="outlined" class="mt-4">
                <v-card-title class="text-body-2 d-flex align-center">
                    <v-icon left size="small" class="mr-2">mdi-form-select</v-icon>
                    {{ selectedForm.title }}
                    <v-spacer />
                    <v-btn size="x-small" color="primary" variant="tonal" @click="editSelectedForm">
                        <v-icon size="small">mdi-pencil</v-icon>
                        {{ $t('edit') }}
                    </v-btn>
                </v-card-title>
                <v-card-text>
                    <v-chip size="small" color="info" class="mr-2">
                        {{ selectedForm.fieldCount || 0 }} {{ $t('fields') }}
                    </v-chip>
                    <v-chip size="small" :color="selectedForm.active ? 'success' : 'warning'">
                        {{ selectedForm.active ? $t('active') : $t('inactive') }}
                    </v-chip>
                </v-card-text>
            </v-card>

            <v-alert v-else type="info" variant="tonal" density="compact" class="mt-3">
                <v-icon left size="small">mdi-information</v-icon>
                {{ $t('form_block_info') }}
            </v-alert>
        </div>

        <!-- CREATE/EDIT MODE: Inline form builder -->
        <div v-else-if="mode === 'create'" class="inline-form-builder">
            <!-- Form Header -->
            <v-text-field
                v-model="inlineForm.title"
                :label="$t('form_title')"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-format-title"
                class="mb-3"
            />

            <v-textarea
                v-model="inlineForm.description"
                :label="$t('form_description')"
                variant="outlined"
                density="comfortable"
                rows="2"
                auto-grow
                class="mb-4"
            />

            <!-- Fields List -->
            <div class="fields-section mb-4">
                <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-subtitle-2 font-weight-bold">{{ $t('form_fields') }}</span>
                    <v-chip size="small" color="primary">{{ inlineForm.fields.length }} {{ $t('fields') }}</v-chip>
                </div>

                <draggable
                    v-model="inlineForm.fields"
                    item-key="id"
                    handle=".field-drag-handle"
                    class="fields-list"
                >
                    <template #item="{ element: field, index }">
                        <v-card class="field-item mb-3" variant="outlined" rounded="lg">
                            <v-card-title class="d-flex align-center pa-3 bg-grey-lighten-4">
                                <v-icon class="field-drag-handle cursor-move mr-2" size="small">mdi-drag-vertical</v-icon>
                                <v-chip size="x-small" :color="getFieldTypeColor(field.type)" class="mr-2">
                                    {{ getFieldTypeName(field.type) }}
                                </v-chip>
                                <span class="text-body-2 font-weight-medium">{{ field.label || $t('untitled_field') }}</span>
                                <v-spacer />
                                <v-checkbox
                                    v-model="field.required"
                                    :label="$t('required')"
                                    density="compact"
                                    hide-details
                                    class="mr-2"
                                />
                                <v-btn icon size="x-small" variant="text" @click="toggleFieldEdit(field.id)">
                                    <v-icon>{{ expandedFieldId === field.id ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                                </v-btn>
                                <v-btn icon size="x-small" variant="text" color="error" @click="removeField(index)">
                                    <v-icon>mdi-delete</v-icon>
                                </v-btn>
                            </v-card-title>

                            <!-- Expanded Field Editor -->
                            <v-expand-transition>
                                <v-card-text v-if="expandedFieldId === field.id" class="pa-4">
                                    <v-row dense>
                                        <v-col cols="12" sm="6">
                                            <v-text-field
                                                v-model="field.label"
                                                :label="$t('field_label')"
                                                variant="outlined"
                                                density="compact"
                                            />
                                        </v-col>
                                        <v-col cols="12" sm="6">
                                            <v-select
                                                v-model="field.type"
                                                :items="fieldTypes"
                                                item-value="value"
                                                item-title="label"
                                                :label="$t('field_type')"
                                                variant="outlined"
                                                density="compact"
                                                @update:model-value="onFieldTypeChange(field)"
                                            />
                                        </v-col>
                                        <v-col cols="12">
                                            <v-text-field
                                                v-model="field.description"
                                                :label="$t('help_text')"
                                                variant="outlined"
                                                density="compact"
                                            />
                                        </v-col>
                                        <v-col v-if="['text', 'textarea', 'email', 'number', 'tel'].includes(field.type)" cols="12">
                                            <v-text-field
                                                v-model="field.placeholder"
                                                :label="$t('placeholder')"
                                                variant="outlined"
                                                density="compact"
                                            />
                                        </v-col>
                                        <!-- Options for select/radio/checkbox -->
                                        <v-col v-if="['select', 'radio', 'checkbox'].includes(field.type)" cols="12">
                                            <div class="options-editor">
                                                <span class="text-caption font-weight-medium mb-2 d-block">{{ $t('options') }}</span>
                                                <div v-for="(opt, optIdx) in field.options" :key="optIdx" class="d-flex align-center gap-2 mb-2">
                                                    <v-text-field
                                                        v-model="field.options[optIdx]"
                                                        variant="outlined"
                                                        density="compact"
                                                        hide-details
                                                        :placeholder="`${$t('option')} ${optIdx + 1}`"
                                                    />
                                                    <v-btn icon size="x-small" color="error" variant="text" @click="field.options.splice(optIdx, 1)">
                                                        <v-icon>mdi-close</v-icon>
                                                    </v-btn>
                                                </div>
                                                <v-btn size="small" variant="text" color="primary" @click="addOption(field)">
                                                    <v-icon left size="small">mdi-plus</v-icon>
                                                    {{ $t('add_option') }}
                                                </v-btn>
                                            </div>
                                        </v-col>
                                        <!-- Number validation -->
                                        <v-col v-if="field.type === 'number'" cols="6">
                                            <v-text-field
                                                v-model.number="field.validation.min"
                                                :label="$t('min_value')"
                                                type="number"
                                                variant="outlined"
                                                density="compact"
                                            />
                                        </v-col>
                                        <v-col v-if="field.type === 'number'" cols="6">
                                            <v-text-field
                                                v-model.number="field.validation.max"
                                                :label="$t('max_value')"
                                                type="number"
                                                variant="outlined"
                                                density="compact"
                                            />
                                        </v-col>
                                    </v-row>
                                </v-card-text>
                            </v-expand-transition>
                        </v-card>
                    </template>
                </draggable>

                <!-- Add Field Menu -->
                <v-menu>
                    <template #activator="{ props }">
                        <v-btn v-bind="props" block variant="outlined" color="primary" class="mt-2">
                            <v-icon left>mdi-plus</v-icon>
                            {{ $t('add_field') }}
                        </v-btn>
                    </template>
                    <v-list density="compact">
                        <v-list-item
                            v-for="ft in fieldTypes"
                            :key="ft.value"
                            @click="addField(ft.value)"
                        >
                            <template #prepend>
                                <v-icon :color="ft.color" size="small">{{ ft.icon }}</v-icon>
                            </template>
                            <v-list-item-title>{{ ft.label }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </div>

            <!-- Form Settings -->
            <v-expansion-panels variant="accordion" class="mb-4">
                <v-expansion-panel>
                    <v-expansion-panel-title>
                        <v-icon left size="small" class="mr-2">mdi-cog</v-icon>
                        {{ $t('form_settings') }}
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-row dense>
                            <v-col cols="12" sm="6">
                                <v-switch
                                    v-model="inlineForm.settings.active"
                                    :label="$t('form_active')"
                                    color="success"
                                    density="compact"
                                    hide-details
                                />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-switch
                                    v-model="inlineForm.settings.collectEmail"
                                    :label="$t('collect_email')"
                                    color="primary"
                                    density="compact"
                                    hide-details
                                />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-switch
                                    v-model="inlineForm.settings.allowMultipleResponses"
                                    :label="$t('allow_multiple_responses')"
                                    color="primary"
                                    density="compact"
                                    hide-details
                                />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-switch
                                    v-model="inlineForm.settings.showProgressBar"
                                    :label="$t('show_progress_bar')"
                                    color="primary"
                                    density="compact"
                                    hide-details
                                />
                            </v-col>
                            <v-col cols="12">
                                <v-textarea
                                    v-model="inlineForm.settings.confirmationMessage"
                                    :label="$t('confirmation_message')"
                                    variant="outlined"
                                    density="compact"
                                    rows="2"
                                    auto-grow
                                />
                            </v-col>
                        </v-row>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>

            <!-- Save Form Actions -->
            <div class="d-flex gap-2">
                <v-btn
                    color="primary"
                    variant="flat"
                    :loading="isSaving"
                    @click="saveInlineForm"
                >
                    <v-icon left>mdi-content-save</v-icon>
                    {{ isEditingExisting ? $t('update_form') : $t('create_form') }}
                </v-btn>
                <v-btn
                    v-if="isEditingExisting"
                    variant="tonal"
                    @click="cancelEdit"
                >
                    {{ $t('cancel') }}
                </v-btn>
            </div>

            <!-- Show Results Toggle -->
            <v-switch
                v-if="localSettings.formId"
                v-model="localSettings.showResults"
                :label="$t('show_results')"
                color="primary"
                class="mt-4"
                @change="emitSettings"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, computed } from 'vue';
import { Databases, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { FormsService, type Form, type FormField } from '@/services/forms/FormsService';
import { nanoid } from 'nanoid';
import { notify } from '@kyvg/vue3-notification';
import draggable from 'vuedraggable';

export default defineComponent({
    name: 'FormBlockEditor',
    components: { draggable },
    props: {
        block: { type: Object, required: true },
        settings: { type: Object, default: () => ({}) },
        language: { type: String, default: 'rs' }
    },
    emits: ['update:settings', 'save'],
    setup(props, { emit }) {
        const database = new Databases(appw);
        const formsService = FormsService.getInstance();

        // State
        const mode = ref<'select' | 'create'>('select');
        const forms = ref<any[]>([]);
        const isSaving = ref(false);
        const expandedFieldId = ref<string | null>(null);
        const isEditingExisting = ref(false);

        const localSettings = ref({
            formId: props.settings.formId || '',
            showResults: props.settings.showResults || false
        });

        // Inline form builder state
        const inlineForm = ref<Form>({
            title: '',
            description: '',
            fields: [],
            settings: {
                allowMultipleResponses: true,
                requireLogin: false,
                showProgressBar: true,
                confirmationMessage: 'Köszönjük a válaszod!',
                collectEmail: false,
                active: true
            }
        });

        // Field types config
        const fieldTypes = [
            { value: 'text', label: 'Rövid szöveg', icon: 'mdi-form-textbox', color: 'blue' },
            { value: 'textarea', label: 'Hosszú szöveg', icon: 'mdi-text-box', color: 'blue-darken-2' },
            { value: 'email', label: 'Email', icon: 'mdi-email', color: 'orange' },
            { value: 'number', label: 'Szám', icon: 'mdi-numeric', color: 'green' },
            { value: 'tel', label: 'Telefon', icon: 'mdi-phone', color: 'teal' },
            { value: 'date', label: 'Dátum', icon: 'mdi-calendar', color: 'purple' },
            { value: 'time', label: 'Idő', icon: 'mdi-clock', color: 'purple-darken-2' },
            { value: 'select', label: 'Legördülő', icon: 'mdi-menu-down', color: 'indigo' },
            { value: 'radio', label: 'Rádió gomb', icon: 'mdi-radiobox-marked', color: 'pink' },
            { value: 'checkbox', label: 'Jelölőnégyzet', icon: 'mdi-checkbox-marked', color: 'cyan' }
        ];

        const selectedForm = computed(() => {
            return forms.value.find(f => f.id === localSettings.value.formId);
        });

        // Load existing forms list
        const loadForms = async () => {
            try {
                const result = await database.listDocuments(
                    config.website_db,
                    config.forms,
                    [
                        Query.select(['title', 'settings', 'fields', '$id']),
                        Query.limit(50)
                    ]
                );

                forms.value = result.documents.map(element => {
                    let settings: any = {};
                    let fieldCount = 0;
                    try {
                        settings = element.settings ? JSON.parse(element.settings) : {};
                        const fields = element.fields ? JSON.parse(element.fields) : [];
                        fieldCount = fields.length;
                    } catch (e) { /* ignore parse errors */ }

                    return {
                        id: element.$id,
                        title: element.title || 'Névtelen űrlap',
                        active: settings.active !== false,
                        fieldCount
                    };
                });
            } catch (error) {
                console.error('Failed to load forms:', error);
            }
        };

        // Add a new field
        const addField = (type: string) => {
            const field: FormField = {
                id: nanoid(),
                type: type as any,
                label: '',
                required: false,
                validation: {}
            };

            if (['select', 'radio', 'checkbox'].includes(type)) {
                field.options = ['Opció 1', 'Opció 2'];
            }

            inlineForm.value.fields.push(field);
            expandedFieldId.value = field.id;
        };

        // Remove field
        const removeField = (index: number) => {
            inlineForm.value.fields.splice(index, 1);
        };

        // Add option to select/radio/checkbox
        const addOption = (field: FormField) => {
            if (!field.options) field.options = [];
            field.options.push(`Opció ${field.options.length + 1}`);
        };

        // Toggle field edit
        const toggleFieldEdit = (fieldId: string) => {
            expandedFieldId.value = expandedFieldId.value === fieldId ? null : fieldId;
        };

        // Handle field type change
        const onFieldTypeChange = (field: FormField) => {
            if (['select', 'radio', 'checkbox'].includes(field.type) && !field.options) {
                field.options = ['Opció 1', 'Opció 2'];
            }
        };

        // Get field type display name
        const getFieldTypeName = (type: string) => {
            return fieldTypes.find(ft => ft.value === type)?.label || type;
        };

        // Get field type color
        const getFieldTypeColor = (type: string) => {
            return fieldTypes.find(ft => ft.value === type)?.color || 'grey';
        };

        // Edit selected form inline
        const editSelectedForm = async () => {
            if (!localSettings.value.formId) return;

            try {
                const form = await formsService.getForm(localSettings.value.formId);
                inlineForm.value = { ...form };
                isEditingExisting.value = true;
                mode.value = 'create';
            } catch (error) {
                console.error('Failed to load form for editing:', error);
                notify({ type: 'error', text: 'Nem sikerült betölteni az űrlapot' });
            }
        };

        // Save inline form (create or update)
        const saveInlineForm = async () => {
            if (!inlineForm.value.title.trim()) {
                notify({ type: 'warning', text: 'Add meg az űrlap címét!' });
                return;
            }

            if (inlineForm.value.fields.length === 0) {
                notify({ type: 'warning', text: 'Adj hozzá legalább egy mezőt!' });
                return;
            }

            isSaving.value = true;

            try {
                let savedForm: Form;

                if (isEditingExisting.value && inlineForm.value.$id) {
                    // Update existing
                    savedForm = await formsService.updateForm(inlineForm.value.$id, inlineForm.value);
                    notify({ type: 'success', text: 'Űrlap frissítve!' });
                } else {
                    // Create new
                    savedForm = await formsService.createForm(inlineForm.value);
                    notify({ type: 'success', text: 'Űrlap létrehozva!' });
                }

                // Set the form ID in settings
                localSettings.value.formId = savedForm.$id!;
                emitSettings();

                // Reload forms list
                await loadForms();

                // Switch back to select mode
                mode.value = 'select';
                isEditingExisting.value = false;

                // Reset inline form
                resetInlineForm();
            } catch (error: any) {
                console.error('Failed to save form:', error);
                notify({ type: 'error', text: 'Hiba: ' + (error.message || 'Ismeretlen hiba') });
            } finally {
                isSaving.value = false;
            }
        };

        // Cancel editing
        const cancelEdit = () => {
            isEditingExisting.value = false;
            mode.value = 'select';
            resetInlineForm();
        };

        // Reset inline form to default
        const resetInlineForm = () => {
            inlineForm.value = {
                title: '',
                description: '',
                fields: [],
                settings: {
                    allowMultipleResponses: true,
                    requireLogin: false,
                    showProgressBar: true,
                    confirmationMessage: 'Köszönjük a válaszod!',
                    collectEmail: false,
                    active: true
                }
            };
        };

        const emitSettings = () => {
            emit('update:settings', { ...localSettings.value });
            emit('save');
        };

        watch(() => props.settings, (newSettings) => {
            localSettings.value = {
                formId: newSettings.formId || '',
                showResults: newSettings.showResults || false
            };
        }, { deep: true });

        onMounted(loadForms);

        return {
            mode,
            forms,
            localSettings,
            selectedForm,
            inlineForm,
            fieldTypes,
            isSaving,
            expandedFieldId,
            isEditingExisting,
            loadForms,
            addField,
            removeField,
            addOption,
            toggleFieldEdit,
            onFieldTypeChange,
            getFieldTypeName,
            getFieldTypeColor,
            editSelectedForm,
            saveInlineForm,
            cancelEdit,
            emitSettings
        };
    }
});
</script>

<style scoped>
.inline-form-builder {
    background: rgba(var(--v-theme-surface-variant), 0.3);
    border-radius: 12px;
    padding: 16px;
}

.fields-section {
    background: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    padding: 12px;
}

.field-item {
    transition: all 0.2s ease;
}

.field-item:hover {
    border-color: rgb(var(--v-theme-primary)) !important;
}

.field-drag-handle {
    cursor: move !important;
}

.cursor-move {
    cursor: move !important;
}

.gap-2 {
    gap: 8px;
}

.options-editor {
    background: rgba(var(--v-theme-surface-variant), 0.3);
    border-radius: 8px;
    padding: 12px;
}

/* Dark mode */
:deep(.v-theme--dark) .fields-section {
    background: rgba(0, 0, 0, 0.2);
}

:deep(.v-theme--dark) .inline-form-builder {
    background: rgba(0, 0, 0, 0.3);
}
</style>
