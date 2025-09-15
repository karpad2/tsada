<template>
    <div class="worker-editor container px-5 mx-auto bg-white">
        <!-- Header Controls -->
        <section class="header-section mb-6">
            <div class="action-buttons flex gap-2 mb-4">
                <v-btn
                    @click="save"
                    :disabled="isLoading('save')"
                    :loading="isLoading('save')"
                    color="success"
                >
                    {{ $t('save') }}
                </v-btn>
                <v-btn
                    @click="deleteContent"
                    :disabled="isAnyLoading()"
                    color="error"
                >
                    {{ $t('delete') }}
                </v-btn>
                <v-btn
                    @click="$router.go(-1)"
                    :disabled="isAnyLoading()"
                    color="secondary"
                >
                    {{ $t("goback") }}
                </v-btn>
            </div>
        </section>

        <!-- File Upload Section -->
        <FileUploadSection
            upload-type="image"
            :multiple="false"
            :preview-urls="imagePreviewUrl ? [imagePreviewUrl] : []"
            :uploaded-file-ids="formData.worker_img ? [formData.worker_img] : []"
            :storage-id="config.website_images"
            :show-actions="false"
            @files-uploaded="handleFileUploaded"
        />

        <!-- Worker Information Fields -->
        <section class="worker-info-section mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <v-text-field
                    :model-value="formData.worker_name_hu"
                    @update:model-value="updateField('worker_name_hu', $event)"
                    :counter="100"
                    :label="$t('worker_name_hu')"
                    hide-details
                    @change="handleFieldChange"
                />

                <v-text-field
                    :model-value="formData.worker_name_rs"
                    @update:model-value="updateField('worker_name_rs', $event)"
                    :counter="100"
                    :label="$t('worker_name_rs')"
                    hide-details
                    @change="handleFieldChange"
                />

                <v-text-field
                    :model-value="formData.contact"
                    @update:model-value="updateField('contact', $event)"
                    :counter="100"
                    :label="$t('contact')"
                    hide-details
                    @change="handleFieldChange"
                    class="md:col-span-2"
                />
            </div>
        </section>

        <!-- Receiving Hours Settings -->
        <section class="receiving-hours-section">
            <h3 class="text-lg font-medium mb-4">{{ $t('receiving_hours_settings') }}</h3>

            <!-- Pedagógus fogadóóra -->
            <v-card class="mb-4">
                <v-card-title>{{ $t('p_receiving_hour') }}</v-card-title>
                <v-card-text>
                    <div v-for="(schedule, index) in formData.p_receiving_schedules" :key="'p_' + index" class="mb-3 p-3 border rounded">
                        <div class="flex gap-4 items-center flex-wrap">
                            <v-select
                                :model-value="schedule.day"
                                @update:model-value="updateScheduleField('p_receiving_schedules', index, 'day', $event)"
                                :items="dayOptions"
                                :label="$t('day')"
                                item-title="label"
                                item-value="value"
                                style="min-width: 150px;"
                            />

                            <v-select
                                :model-value="schedule.period"
                                @update:model-value="updateScheduleField('p_receiving_schedules', index, 'period', $event)"
                                :items="periodOptions"
                                :label="$t('lesson_period')"
                                item-title="label"
                                item-value="value"
                                style="min-width: 200px;"
                            />

                            <v-text-field
                                :model-value="schedule.location"
                                @update:model-value="updateScheduleField('p_receiving_schedules', index, 'location', $event)"
                                :label="$t('location')"
                                style="min-width: 120px;"
                            />

                            <v-btn
                                icon="mdi-delete"
                                color="error"
                                size="small"
                                @click="removePSchedule(index)"
                            />
                        </div>
                    </div>
                    <v-btn @click="addPSchedule" color="primary" size="small">
                        <v-icon>mdi-plus</v-icon>
                        {{ $t('add_schedule') }}
                    </v-btn>
                </v-card-text>
            </v-card>

            <!-- Ügyfélszolgálati fogadóóra -->
            <v-card class="mb-4">
                <v-card-title>{{ $t('u_receiving_hour') }}</v-card-title>
                <v-card-text>
                    <div v-for="(schedule, index) in formData.u_receiving_schedules" :key="'u_' + index" class="mb-3 p-3 border rounded">
                        <div class="flex gap-4 items-center flex-wrap">
                            <v-select
                                :model-value="schedule.day"
                                @update:model-value="updateScheduleField('u_receiving_schedules', index, 'day', $event)"
                                :items="dayOptions"
                                :label="$t('day')"
                                item-title="label"
                                item-value="value"
                                style="min-width: 150px;"
                            />

                            <v-select
                                :model-value="schedule.period"
                                @update:model-value="updateScheduleField('u_receiving_schedules', index, 'period', $event)"
                                :items="periodOptions"
                                :label="$t('lesson_period')"
                                item-title="label"
                                item-value="value"
                                style="min-width: 200px;"
                            />

                            <v-text-field
                                :model-value="schedule.location"
                                @update:model-value="updateScheduleField('u_receiving_schedules', index, 'location', $event)"
                                :label="$t('location')"
                                style="min-width: 120px;"
                            />

                            <v-btn
                                icon="mdi-delete"
                                color="error"
                                size="small"
                                @click="removeUSchedule(index)"
                            />
                        </div>
                    </div>
                    <v-btn @click="addUSchedule" color="primary" size="small">
                        <v-icon>mdi-plus</v-icon>
                        {{ $t('add_schedule') }}
                    </v-btn>
                </v-card-text>
            </v-card>
        </section>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { Databases, Storage } from 'appwrite';
import { appw, config } from '@/appwrite';
import { useEditor } from '@/composables/useEditor';
import { getFilePreview, parseScheduleData, stringifyScheduleData } from '@/utils/editorUtils';
import { useLoadingStore } from '@/stores/loading';
import FileUploadSection from '@/components/shared/FileUploadSection.vue';

interface Schedule {
    day: string;
    period: string;
    location: string;
}

export default defineComponent({
    name: 'WorkerEditor',
    components: {
        FileUploadSection
    },
    setup() {
        const loadingStore = useLoadingStore();

        // Load worker data
        const loadWorkerData = async (id: string) => {
            const database = new Databases(appw);

            try {
                const workerDoc = await database.getDocument(config.website_db, config.workers, id);

                return {
                    worker_name_hu: workerDoc.worker_name_hu || '',
                    worker_name_rs: workerDoc.worker_name_rs || '',
                    contact: workerDoc.contact || '',
                    worker_img: workerDoc.worker_img || '',
                    p_receiving_schedules: parseScheduleData(workerDoc.p_receiving_schedules),
                    u_receiving_schedules: parseScheduleData(workerDoc.u_receiving_schedules)
                };
            } catch (error) {
                console.error('Error loading worker data:', error);
                throw error;
            }
        };

        // Use editor composable
        const {
            formData,
            hasChanges,
            isLoading,
            isAnyLoading,
            save: baseSave,
            deleteContent,
            updateField,
            handleFieldChange,
            t
        } = useEditor({
            collectionId: config.workers,
            databaseId: config.website_db,
            loadDataFunction: loadWorkerData,
            redirectAfterDelete: '/about/workers',
            autoSaveDelay: 2000
        });

        // Enhanced save function that stringifies schedule data
        const save = async () => {
            // Stringify schedule arrays before saving
            const saveData = {
                ...formData,
                p_receiving_schedules: stringifyScheduleData(formData.p_receiving_schedules || []),
                u_receiving_schedules: stringifyScheduleData(formData.u_receiving_schedules || [])
            };

            // Temporarily update formData for save
            const originalPSchedules = formData.p_receiving_schedules;
            const originalUSchedules = formData.u_receiving_schedules;

            formData.p_receiving_schedules = saveData.p_receiving_schedules;
            formData.u_receiving_schedules = saveData.u_receiving_schedules;

            try {
                await baseSave();
            } finally {
                // Restore original arrays
                formData.p_receiving_schedules = originalPSchedules;
                formData.u_receiving_schedules = originalUSchedules;
            }
        };

        // Day and period options
        const dayOptions = computed(() => {
            const lang = loadingStore.language;

            if (lang === 'hu') {
                return [
                    { label: 'Hétfő', value: 'monday' },
                    { label: 'Kedd', value: 'tuesday' },
                    { label: 'Szerda', value: 'wednesday' },
                    { label: 'Csütörtök', value: 'thursday' },
                    { label: 'Péntek', value: 'friday' }
                ];
            } else if (lang === 'rs' || lang === 'sr') {
                return [
                    { label: 'Понедељак', value: 'monday' },
                    { label: 'Уторак', value: 'tuesday' },
                    { label: 'Среда', value: 'wednesday' },
                    { label: 'Четвртак', value: 'thursday' },
                    { label: 'Петак', value: 'friday' }
                ];
            } else {
                return [
                    { label: 'Monday', value: 'monday' },
                    { label: 'Tuesday', value: 'tuesday' },
                    { label: 'Wednesday', value: 'wednesday' },
                    { label: 'Thursday', value: 'thursday' },
                    { label: 'Friday', value: 'friday' }
                ];
            }
        });

        const periodOptions = computed(() => {
            const lang = loadingStore.language;

            if (lang === 'hu') {
                return [
                    { label: '1. óra (6:40-7:25)', value: 'period_1' },
                    { label: '2. óra (7:30-8:15)', value: 'period_2' },
                    { label: '3. óra (8:20-9:05)', value: 'period_3' },
                    { label: '4. óra (9:20-10:05)', value: 'period_4' },
                    { label: '5. óra (10:10-10:55)', value: 'period_5' },
                    { label: '6. óra (11:00-11:40)', value: 'period_6' },
                    { label: '7. óra (11:45-12:25)', value: 'period_7' },
                    { label: '8. óra (12:30-13:10)', value: 'period_8' }
                ];
            } else if (lang === 'rs' || lang === 'sr') {
                return [
                    { label: '1. час (6:40-7:25)', value: 'period_1' },
                    { label: '2. час (7:30-8:15)', value: 'period_2' },
                    { label: '3. час (8:20-9:05)', value: 'period_3' },
                    { label: '4. час (9:20-10:05)', value: 'period_4' },
                    { label: '5. час (10:10-10:55)', value: 'period_5' },
                    { label: '6. час (11:00-11:40)', value: 'period_6' },
                    { label: '7. час (11:45-12:25)', value: 'period_7' },
                    { label: '8. час (12:30-13:10)', value: 'period_8' }
                ];
            } else {
                return [
                    { label: '1st period (6:40-7:25)', value: 'period_1' },
                    { label: '2nd period (7:30-8:15)', value: 'period_2' },
                    { label: '3rd period (8:20-9:05)', value: 'period_3' },
                    { label: '4th period (9:20-10:05)', value: 'period_4' },
                    { label: '5th period (10:10-10:55)', value: 'period_5' },
                    { label: '6th period (11:00-11:40)', value: 'period_6' },
                    { label: '7th period (11:45-12:25)', value: 'period_7' },
                    { label: '8th period (12:30-13:10)', value: 'period_8' }
                ];
            }
        });

        // Image preview
        const imagePreviewUrl = computed(() => {
            return formData.worker_img ? getFilePreview(formData.worker_img, config.website_images) : null;
        });

        // File upload handler
        const handleFileUploaded = async (uploadedFiles: any[]) => {
            if (uploadedFiles.length > 0) {
                updateField('worker_img', uploadedFiles[0].$id);
                await handleFieldChange();
            }
        };

        // Schedule management
        const updateScheduleField = (scheduleType: string, index: number, field: string, value: any) => {
            const schedules = [...formData[scheduleType]];
            schedules[index] = { ...schedules[index], [field]: value };
            updateField(scheduleType, schedules);
            handleFieldChange();
        };

        const addPSchedule = () => {
            const newSchedules = [...(formData.p_receiving_schedules || [])];
            newSchedules.push({ day: '', period: '', location: '' });
            updateField('p_receiving_schedules', newSchedules);
            handleFieldChange();
        };

        const removePSchedule = (index: number) => {
            const newSchedules = [...formData.p_receiving_schedules];
            newSchedules.splice(index, 1);
            updateField('p_receiving_schedules', newSchedules);
            handleFieldChange();
        };

        const addUSchedule = () => {
            const newSchedules = [...(formData.u_receiving_schedules || [])];
            newSchedules.push({ day: '', period: '', location: '' });
            updateField('u_receiving_schedules', newSchedules);
            handleFieldChange();
        };

        const removeUSchedule = (index: number) => {
            const newSchedules = [...formData.u_receiving_schedules];
            newSchedules.splice(index, 1);
            updateField('u_receiving_schedules', newSchedules);
            handleFieldChange();
        };

        return {
            formData,
            hasChanges,
            isLoading,
            isAnyLoading,
            save,
            deleteContent,
            updateField,
            handleFieldChange,
            dayOptions,
            periodOptions,
            imagePreviewUrl,
            handleFileUploaded,
            updateScheduleField,
            addPSchedule,
            removePSchedule,
            addUSchedule,
            removeUSchedule,
            config
        };
    }
});
</script>

<style scoped>
.worker-editor {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
}

.header-section {
    background-color: #f9fafb;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e5e7eb;
}

.dark .header-section {
    background-color: #111827;
    border-color: #374151;
}

.worker-info-section {
    background-color: #f9fafb;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e5e7eb;
}

.dark .worker-info-section {
    background-color: #111827;
    border-color: #374151;
}

.receiving-hours-section {
    margin-top: 24px;
}

.action-buttons {
    gap: 12px;
}
</style>