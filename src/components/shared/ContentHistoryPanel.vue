<template>
  <v-expansion-panels variant="accordion" class="content-history-panel mt-2">
    <v-expansion-panel>
      <v-expansion-panel-title>
        <v-icon left class="mr-2" color="primary">mdi-history</v-icon>
        {{ $t('content_history') || 'Módosítási előzmények' }}
        <v-chip v-if="backups.length > 0" size="x-small" color="primary" variant="tonal" class="ml-2">
          {{ backups.length }}
        </v-chip>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <div v-if="isLoading" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
        </div>

        <div v-else-if="backups.length === 0" class="text-center py-4 text-medium-emphasis">
          <v-icon size="48" class="mb-2" color="primary">mdi-history</v-icon>
          <p>{{ $t('no_history') || 'Még nincsenek mentett előzmények' }}</p>
        </div>

        <v-list v-else density="compact" class="bg-transparent">
          <v-list-item
            v-for="backup in backups"
            :key="backup.$id"
            class="mb-2 rounded-lg history-item"
            :class="{ 'is-selected': selectedBackup === backup.$id }"
          >
            <template #prepend>
              <v-icon :color="getChangeTypeColor(backup.changeType)">
                {{ getChangeTypeIcon(backup.changeType) }}
              </v-icon>
            </template>

            <v-list-item-title class="text-body-2">
              {{ formatDate(backup.$createdAt) }}
            </v-list-item-title>

            <v-list-item-subtitle class="text-caption">
              {{ getChangedFieldsText(backup.changedFields) }}
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex gap-1">
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  @click="viewBackup(backup)"
                  :title="$t('view_details') || 'Részletek'"
                >
                  <v-icon size="small">mdi-eye</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  color="warning"
                  @click="confirmRestore(backup)"
                  :title="$t('restore_version') || 'Visszaállítás'"
                >
                  <v-icon size="small">mdi-restore</v-icon>
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <div v-if="total > backups.length" class="text-center mt-2">
          <v-btn variant="text" size="small" @click="loadMore">
            {{ $t('load_more') || 'Több betöltése' }}
          </v-btn>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>

  <!-- View Backup Dialog -->
  <v-dialog v-model="showViewDialog" max-width="700">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon left class="mr-2">mdi-history</v-icon>
        {{ $t('backup_details') || 'Verzió részletei' }}
      </v-card-title>
      <v-card-text v-if="viewingBackup">
        <div class="mb-4">
          <strong>{{ $t('date') || 'Dátum' }}:</strong> {{ formatDate(viewingBackup.$createdAt) }}
        </div>
        <div class="mb-4">
          <strong>{{ $t('changed_fields') || 'Módosított mezők' }}:</strong>
          <v-chip
            v-for="field in getChangedFieldsArray(viewingBackup.changedFields)"
            :key="field"
            size="small"
            class="ma-1"
            color="info"
          >
            {{ field }}
          </v-chip>
        </div>
        <v-divider class="my-4"></v-divider>
        <div class="backup-preview">
          <h4 class="mb-2">{{ $t('previous_content') || 'Előző tartalom' }}:</h4>
          <pre class="backup-data">{{ formatBackupData(viewingBackup.previousData) }}</pre>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="showViewDialog = false">
          {{ $t('close') || 'Bezárás' }}
        </v-btn>
        <v-btn color="warning" @click="confirmRestore(viewingBackup!)">
          <v-icon left>mdi-restore</v-icon>
          {{ $t('restore_version') || 'Visszaállítás' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Confirm Restore Dialog -->
  <v-dialog v-model="showRestoreDialog" max-width="500">
    <v-card>
      <v-card-title class="text-warning">
        <v-icon left color="warning" class="mr-2">mdi-alert</v-icon>
        {{ $t('confirm_restore') || 'Visszaállítás megerősítése' }}
      </v-card-title>
      <v-card-text>
        <p>{{ $t('restore_warning') || 'Biztosan vissza akarod állítani ezt a verziót? A jelenlegi tartalom felülíródik!' }}</p>
        <p class="text-caption mt-2">
          {{ $t('restore_date') || 'Verzió dátuma' }}: {{ restoreBackup ? formatDate(restoreBackup.$createdAt) : '' }}
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="showRestoreDialog = false">
          {{ $t('cancel') || 'Mégsem' }}
        </v-btn>
        <v-btn color="warning" :loading="isRestoring" @click="executeRestore">
          <v-icon left>mdi-restore</v-icon>
          {{ $t('restore') || 'Visszaállítás' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { ContentBackupService, type ContentBackup } from '@/services/ContentBackupService';

export default defineComponent({
  name: 'ContentHistoryPanel',
  props: {
    contentId: {
      type: String,
      required: true
    }
  },
  emits: ['restored'],
  setup(props, { emit }) {
    const backupService = ContentBackupService.getInstance();

    const backups = ref<ContentBackup[]>([]);
    const total = ref(0);
    const isLoading = ref(false);
    const isRestoring = ref(false);
    const selectedBackup = ref<string | null>(null);

    const showViewDialog = ref(false);
    const viewingBackup = ref<ContentBackup | null>(null);

    const showRestoreDialog = ref(false);
    const restoreBackup = ref<ContentBackup | null>(null);

    const loadBackups = async (append = false) => {
      if (!props.contentId) return;

      isLoading.value = true;
      try {
        const offset = append ? backups.value.length : 0;
        const result = await backupService.getBackupsForContent(props.contentId, 10, offset);

        if (append) {
          backups.value.push(...result.backups);
        } else {
          backups.value = result.backups;
        }
        total.value = result.total;
      } catch (error) {
        console.error('Failed to load backups:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const loadMore = () => {
      loadBackups(true);
    };

    const viewBackup = (backup: ContentBackup) => {
      viewingBackup.value = backup;
      showViewDialog.value = true;
    };

    const confirmRestore = (backup: ContentBackup) => {
      restoreBackup.value = backup;
      showRestoreDialog.value = true;
      showViewDialog.value = false;
    };

    const executeRestore = async () => {
      if (!restoreBackup.value?.$id) return;

      isRestoring.value = true;
      try {
        const success = await backupService.restoreBackup(restoreBackup.value.$id);
        if (success) {
          showRestoreDialog.value = false;
          emit('restored');
          // Reload backups
          await loadBackups();
        }
      } catch (error) {
        console.error('Failed to restore backup:', error);
      } finally {
        isRestoring.value = false;
      }
    };

    const formatDate = (dateStr?: string): string => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getChangeTypeIcon = (type: string): string => {
      switch (type) {
        case 'create': return 'mdi-plus-circle';
        case 'delete': return 'mdi-delete';
        default: return 'mdi-pencil';
      }
    };

    const getChangeTypeColor = (type: string): string => {
      switch (type) {
        case 'create': return 'success';
        case 'delete': return 'error';
        default: return 'primary';
      }
    };

    const getChangedFieldsArray = (changedFieldsJson: string): string[] => {
      try {
        return JSON.parse(changedFieldsJson);
      } catch {
        return [];
      }
    };

    const getChangedFieldsText = (changedFieldsJson: string): string => {
      const fields = getChangedFieldsArray(changedFieldsJson);
      if (fields.length === 0) return 'Nincs változás';
      if (fields.length <= 3) return fields.join(', ');
      return `${fields.slice(0, 3).join(', ')} +${fields.length - 3}`;
    };

    const formatBackupData = (dataJson: string): string => {
      try {
        const data = JSON.parse(dataJson);
        // Filter out Appwrite system fields
        const filtered: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
          if (!key.startsWith('$')) {
            filtered[key] = value;
          }
        }
        return JSON.stringify(filtered, null, 2);
      } catch {
        return dataJson;
      }
    };

    onMounted(() => {
      loadBackups();
    });

    watch(() => props.contentId, () => {
      loadBackups();
    });

    return {
      backups,
      total,
      isLoading,
      isRestoring,
      selectedBackup,
      showViewDialog,
      viewingBackup,
      showRestoreDialog,
      restoreBackup,
      loadMore,
      viewBackup,
      confirmRestore,
      executeRestore,
      formatDate,
      getChangeTypeIcon,
      getChangeTypeColor,
      getChangedFieldsArray,
      getChangedFieldsText,
      formatBackupData
    };
  }
});
</script>

<style scoped>
.content-history-panel {
  border-radius: 0.85rem;
  overflow: hidden;
}

.history-item {
  border: 1px solid rgba(14, 165, 233, 0.12);
  background: rgba(255, 255, 255, 0.5);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.history-item.is-selected {
  border-color: rgba(14, 165, 233, 0.4);
  background: rgba(14, 165, 233, 0.1);
}

:global(.dark) .history-item {
  background: rgba(15, 23, 42, 0.45);
  border-color: rgba(148, 163, 184, 0.14);
}

:global(.dark) .history-item.is-selected {
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.3);
}

.backup-preview {
  max-height: 400px;
  overflow-y: auto;
}

.backup-data {
  background: rgba(14, 165, 233, 0.06);
  border: 1px solid rgba(14, 165, 233, 0.15);
  padding: 12px;
  border-radius: 0.75rem;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

:global(.dark) .backup-data {
  background: rgba(15, 23, 42, 0.5);
  border-color: rgba(148, 163, 184, 0.16);
}

.gap-1 {
  gap: 4px;
}
</style>
