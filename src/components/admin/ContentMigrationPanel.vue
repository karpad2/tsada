<template>
  <div class="content-migration-panel">
    <!-- Header -->
    <div class="panel-header mb-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
        {{ $t('content_migration_panel') }}
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        {{ $t('migrate_legacy_content_description') }}
      </p>
    </div>

    <!-- Migration Statistics -->
    <div class="migration-stats grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-center">
          <i class="pi pi-file text-blue-500 text-2xl mr-3"></i>
          <div>
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ stats.totalDocuments }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('total_documents') }}
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div class="flex items-center">
          <i class="pi pi-check-circle text-green-500 text-2xl mr-3"></i>
          <div>
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ stats.migratedDocuments }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('migrated_documents') }}
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div class="flex items-center">
          <i class="pi pi-clock text-yellow-500 text-2xl mr-3"></i>
          <div>
            <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {{ stats.pendingDocuments }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('pending_migration') }}
            </div>
          </div>
        </div>
      </div>

      <div class="stat-card bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div class="flex items-center">
          <i class="pi pi-cog text-purple-500 text-2xl mr-3"></i>
          <div>
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {{ stats.totalComponents }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('total_components') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Migration Actions -->
    <div class="migration-actions grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Bulk Migration -->
      <div class="action-card bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          <i class="pi pi-upload mr-2"></i>
          {{ $t('bulk_migration') }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ $t('bulk_migration_description') }}
        </p>
        <div class="flex space-x-3">
          <v-btn
            @click="startBulkMigration"
            color="primary"
            :loading="bulkMigrating"
            :disabled="stats.pendingDocuments === 0"
          >
            <i class="pi pi-play mr-2"></i>
            {{ $t('start_migration') }}
          </v-btn>
          <v-btn
            @click="showMigrationOptions = true"
            variant="outlined"
          >
            <i class="pi pi-cog mr-2"></i>
            {{ $t('options') }}
          </v-btn>
        </div>
      </div>

      <!-- Backup & Export -->
      <div class="action-card bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          <i class="pi pi-download mr-2"></i>
          {{ $t('backup_export') }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ $t('backup_export_description') }}
        </p>
        <div class="flex space-x-3">
          <v-btn
            @click="exportLegacyContent"
            color="secondary"
            :loading="exporting"
          >
            <i class="pi pi-download mr-2"></i>
            {{ $t('export_legacy') }}
          </v-btn>
          <v-btn
            @click="exportModularContent"
            variant="outlined"
            :loading="exporting"
          >
            <i class="pi pi-download mr-2"></i>
            {{ $t('export_modular') }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Document List -->
    <div class="document-list bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div class="list-header p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
            {{ $t('documents') }}
          </h3>
          <div class="flex space-x-3">
            <!-- Filter -->
            <select
              v-model="documentFilter"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            >
              <option value="all">{{ $t('all_documents') }}</option>
              <option value="legacy">{{ $t('legacy_only') }}</option>
              <option value="modular">{{ $t('modular_only') }}</option>
              <option value="pending">{{ $t('pending_migration') }}</option>
            </select>

            <!-- Search -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="$t('search_documents')"
                class="px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
              />
              <i class="pi pi-search absolute left-3 top-3 text-gray-400"></i>
            </div>

            <v-btn @click="refreshDocuments" variant="outlined">
              <i class="pi pi-refresh"></i>
            </v-btn>
          </div>
        </div>
      </div>

      <div class="list-content p-6">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ $t('document') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ $t('type') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ $t('status') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ $t('components') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {{ $t('actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="document in filteredDocuments"
                :key="document.$id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <i class="pi pi-file text-gray-400 mr-3"></i>
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ getDocumentTitle(document) }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ document.$id }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {{ getDocumentType(document) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    :class="getStatusClasses(document)"
                  >
                    {{ getDocumentStatus(document) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ document.componentCount || 0 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      v-if="canMigrate(document)"
                      @click="migrateDocument(document)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                      :disabled="migrating.has(document.$id)"
                    >
                      <i class="pi pi-arrow-right mr-1"></i>
                      {{ $t('migrate') }}
                    </button>
                    <button
                      @click="previewDocument(document)"
                      class="text-green-600 hover:text-green-900 dark:text-green-400"
                    >
                      <i class="pi pi-eye mr-1"></i>
                      {{ $t('preview') }}
                    </button>
                    <button
                      v-if="canMigrate(document)"
                      @click="previewMigration(document)"
                      class="text-purple-600 hover:text-purple-900 dark:text-purple-400"
                    >
                      <i class="pi pi-cog mr-1"></i>
                      {{ $t('preview_migration') }}
                    </button>
                    <button
                      v-if="canClearText(document)"
                      @click="clearTextFields(document)"
                      class="text-orange-600 hover:text-orange-900 dark:text-orange-400"
                      :disabled="migrating.has(document.$id)"
                    >
                      <i class="pi pi-eraser mr-1"></i>
                      {{ $t('clear_text') }}
                    </button>
                    <button
                      v-if="canRevert(document)"
                      @click="revertDocument(document)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400"
                    >
                      <i class="pi pi-undo mr-1"></i>
                      {{ $t('revert') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-6 flex justify-between items-center">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            {{ $t('showing') }} {{ startItem }} {{ $t('to') }} {{ endItem }} {{ $t('of') }} {{ totalDocuments }} {{ $t('documents') }}
          </div>
          <div class="flex space-x-2">
            <v-btn
              @click="previousPage"
              :disabled="currentPage === 1"
              variant="outlined"
              size="small"
            >
              <i class="pi pi-chevron-left"></i>
            </v-btn>
            <span class="px-3 py-1 text-sm">{{ currentPage }} / {{ totalPages }}</span>
            <v-btn
              @click="nextPage"
              :disabled="currentPage === totalPages"
              variant="outlined"
              size="small"
            >
              <i class="pi pi-chevron-right"></i>
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Migration Options Dialog -->
    <v-dialog v-model="showMigrationOptions" max-width="500">
      <v-card>
        <v-card-title>{{ $t('migration_options') }}</v-card-title>
        <v-card-text>
          <div class="space-y-4">
            <div>
              <label class="flex items-center">
                <input
                  v-model="migrationOptions.preserveOriginal"
                  type="checkbox"
                  class="mr-2"
                />
                {{ $t('preserve_original_content') }}
              </label>
            </div>
            <div>
              <label class="flex items-center">
                <input
                  v-model="migrationOptions.createBackup"
                  type="checkbox"
                  class="mr-2"
                />
                {{ $t('create_backup_before_migration') }}
              </label>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ $t('batch_size') }}
              </label>
              <input
                v-model.number="migrationOptions.batchSize"
                type="number"
                min="1"
                max="100"
                class="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showMigrationOptions = false">{{ $t('cancel') }}</v-btn>
          <v-btn @click="saveMigrationOptions" color="primary">{{ $t('save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Progress Dialog -->
    <v-dialog v-model="showProgress" persistent max-width="400">
      <v-card>
        <v-card-title>{{ $t('migration_progress') }}</v-card-title>
        <v-card-text>
          <div class="text-center">
            <div class="mb-4">
              <div class="text-2xl font-bold text-blue-600">{{ migrationProgress.current }} / {{ migrationProgress.total }}</div>
              <div class="text-sm text-gray-600">{{ $t('documents_processed') }}</div>
            </div>
            <v-progress-linear
              :value="migrationProgressPercent"
              height="8"
              color="primary"
            ></v-progress-linear>
            <div class="mt-4 text-sm text-gray-600">
              {{ migrationProgress.currentDocument }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions v-if="migrationProgress.completed">
          <v-spacer></v-spacer>
          <v-btn @click="closeMigrationProgress" color="primary">{{ $t('done') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Migration Preview Dialog -->
    <v-dialog v-model="showMigrationPreview" max-width="800">
      <v-card>
        <v-card-title class="flex items-center">
          <i class="pi pi-cog mr-2"></i>
          {{ $t('migration_preview') }}
          <v-spacer></v-spacer>
          <div class="text-sm text-gray-600">
            {{ getDocumentTitle(selectedDocument) }}
          </div>
        </v-card-title>
        <v-card-text>
          <div v-if="migrationPreviewLoading" class="text-center py-8">
            <v-progress-circular indeterminate></v-progress-circular>
            <div class="mt-4">{{ $t('analyzing_content') }}</div>
          </div>
          <div v-else-if="previewComponents.length > 0">
            <div class="mb-4">
              <div class="text-lg font-semibold mb-2">{{ $t('generated_components') }}</div>
              <div class="text-sm text-gray-600">
                {{ $t('migration_will_create') }} {{ previewComponents.length }} {{ $t('components') }}
              </div>
            </div>

            <div class="space-y-4 max-h-96 overflow-y-auto">
              <div
                v-for="(component, index) in previewComponents"
                :key="component.$id"
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-3">
                      {{ index + 1 }}
                    </span>
                    <div>
                      <div class="font-medium">{{ getComponentTypeLabel(component.type) }}</div>
                      <div class="text-sm text-gray-500">{{ component.name }}</div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span
                      v-for="lang in component.language_metadata.available_languages"
                      :key="lang"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      :class="getLanguageStatusClass(component.language_metadata.translation_status[lang])"
                    >
                      {{ lang.toUpperCase() }}
                    </span>
                  </div>
                </div>
                <div class="text-sm text-gray-700 dark:text-gray-300">
                  <div v-if="component.content_rs?.title || component.content_rs?.content">
                    <strong>{{ $t('content_preview') }}:</strong>
                    {{ truncateText(component.content_rs?.title || component.content_rs?.content || '', 100) }}
                  </div>
                  <div v-else-if="component.content_rs?.youtube_url">
                    <strong>{{ $t('youtube_video') }}:</strong>
                    {{ component.content_rs.youtube_url }}
                  </div>
                  <div v-else-if="component.content_rs?.images">
                    <strong>{{ $t('gallery') }}:</strong>
                    {{ component.content_rs.images.length }} {{ $t('items') }}
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div class="flex items-start">
                <i class="pi pi-info-circle text-blue-500 mt-1 mr-3"></i>
                <div class="text-sm">
                  <div class="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    {{ $t('migration_info') }}
                  </div>
                  <div class="text-blue-700 dark:text-blue-300">
                    {{ $t('migration_info_description') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else>
            <div class="text-center py-8 text-gray-500">
              {{ $t('no_components_generated') }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeMigrationPreview">{{ $t('cancel') }}</v-btn>
          <v-btn
            v-if="previewComponents.length > 0"
            @click="confirmMigration"
            color="primary"
            :loading="migrating.has(selectedDocument?.$id)"
          >
            <i class="pi pi-arrow-right mr-2"></i>
            {{ $t('proceed_with_migration') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { Databases, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { ContentMigrationService, type MigrationOptions } from '@/utils/contentMigration';
import type { ContentComponent } from '@/types/contentTypes';

export default defineComponent({
  name: 'ContentMigrationPanel',
  setup() {
    // Reactive data
    const documents = ref<any[]>([]);
    const stats = ref({
      totalDocuments: 0,
      migratedDocuments: 0,
      pendingDocuments: 0,
      totalComponents: 0
    });

    const documentFilter = ref('all');
    const searchQuery = ref('');
    const currentPage = ref(1);
    const itemsPerPage = ref(10);

    const bulkMigrating = ref(false);
    const exporting = ref(false);
    const migrating = ref(new Set<string>());

    const showMigrationOptions = ref(false);
    const migrationOptions = ref<MigrationOptions>({
      preserveOriginal: true,
      createBackup: true,
      batchSize: 10
    });

    const showProgress = ref(false);
    const migrationProgress = ref({
      current: 0,
      total: 0,
      currentDocument: '',
      completed: false
    });

    const showMigrationPreview = ref(false);
    const migrationPreviewLoading = ref(false);
    const selectedDocument = ref<any>(null);
    const previewComponents = ref<any[]>([]);

    // Computed properties
    const filteredDocuments = computed(() => {
      let filtered = [...documents.value];

      // Apply filter
      if (documentFilter.value !== 'all') {
        filtered = filtered.filter(doc => {
          switch (documentFilter.value) {
            case 'legacy':
              return ContentMigrationService.shouldUseLegacyContent(doc);
            case 'modular':
              return !ContentMigrationService.shouldUseLegacyContent(doc);
            case 'pending':
              return ContentMigrationService.shouldUseLegacyContent(doc) && doc.use_legacy_content !== true;
            default:
              return true;
          }
        });
      }

      // Apply search
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(doc =>
          getDocumentTitle(doc).toLowerCase().includes(query) ||
          doc.$id.toLowerCase().includes(query)
        );
      }

      return filtered;
    });

    const totalDocuments = computed(() => filteredDocuments.value.length);
    const totalPages = computed(() => Math.ceil(totalDocuments.value / itemsPerPage.value));
    const startItem = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1);
    const endItem = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalDocuments.value));

    const migrationProgressPercent = computed(() => {
      if (migrationProgress.value.total === 0) return 0;
      return (migrationProgress.value.current / migrationProgress.value.total) * 100;
    });

    // Methods
    const loadDocuments = async () => {
      try {
        const database = new Databases(appw);

        // Load all documents from about_us_db
        const response = await database.listDocuments(
          config.website_db,
          config.about_us_db,
          [Query.orderDesc('$createdAt'), Query.limit(1000)]
        );

        documents.value = response.documents;
        await updateStats();

      } catch (error) {
        console.error('Error loading documents:', error);
      }
    };

    const updateStats = async () => {
      const total = documents.value.length;
      let migrated = 0;
      let pending = 0;
      let totalComponents = 0;

      for (const doc of documents.value) {
        const isLegacy = ContentMigrationService.shouldUseLegacyContent(doc);

        if (isLegacy) {
          if (doc.use_legacy_content === true) {
            // Explicitly set to legacy
          } else {
            pending++;
          }
        } else {
          migrated++;
          if (doc.componentCount) {
            totalComponents += doc.componentCount;
          }
        }
      }

      stats.value = {
        totalDocuments: total,
        migratedDocuments: migrated,
        pendingDocuments: pending,
        totalComponents
      };
    };

    const getDocumentTitle = (document: any): string => {
      return document.title_rs || document.title_en || document.title_hu || 'Untitled';
    };

    const getDocumentType = (document: any): string => {
      // Determine type based on collection or content
      return 'Document'; // Simplified for now
    };

    const getDocumentStatus = (document: any): string => {
      const isLegacy = ContentMigrationService.shouldUseLegacyContent(document);

      if (!isLegacy) {
        return 'Modular';
      } else if (document.use_legacy_content === true) {
        return 'Legacy';
      } else {
        return 'Pending';
      }
    };

    const getStatusClasses = (document: any): string => {
      const status = getDocumentStatus(document);

      switch (status) {
        case 'Modular':
          return 'bg-green-100 text-green-800';
        case 'Legacy':
          return 'bg-blue-100 text-blue-800';
        case 'Pending':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const canMigrate = (document: any): boolean => {
      return ContentMigrationService.shouldUseLegacyContent(document) && document.use_legacy_content !== true;
    };

    const canRevert = (document: any): boolean => {
      return !ContentMigrationService.shouldUseLegacyContent(document);
    };

    const canClearText = (document: any): boolean => {
      // Show clear text button for documents that have text content
      return document.text_rs || document.text_en || document.text_hu;
    };

    const migrateDocument = async (document: any) => {
      try {
        migrating.value.add(document.$id);

        const components = await ContentMigrationService.migrateLegacyDocument(document, migrationOptions.value);

        if (components.length > 0) {
          const database = new Databases(appw);

          // Save components
          for (const component of components) {
            await database.createDocument(
              config.website_db,
              config.text_components,
              component.$id,
              component
            );
          }

          // Update document
          await database.updateDocument(
            config.website_db,
            config.about_us_db,
            document.$id,
            {
              use_legacy_content: false,
              componentCount: components.length
            }
          );

          await loadDocuments();
        }

      } catch (error) {
        console.error('Migration failed:', error);
      } finally {
        migrating.value.delete(document.$id);
      }
    };

    const startBulkMigration = async () => {
      const pendingDocs = documents.value.filter(canMigrate);

      if (pendingDocs.length === 0) {
        return;
      }

      bulkMigrating.value = true;
      showProgress.value = true;
      migrationProgress.value = {
        current: 0,
        total: pendingDocs.length,
        currentDocument: '',
        completed: false
      };

      try {
        for (let i = 0; i < pendingDocs.length; i++) {
          const doc = pendingDocs[i];
          migrationProgress.value.current = i + 1;
          migrationProgress.value.currentDocument = getDocumentTitle(doc);

          await migrateDocument(doc);

          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        migrationProgress.value.completed = true;

      } catch (error) {
        console.error('Bulk migration failed:', error);
      } finally {
        bulkMigrating.value = false;
      }
    };

    const exportLegacyContent = async () => {
      // Implementation for exporting legacy content
      exporting.value = true;
      try {
        // Export logic here
        console.log('Exporting legacy content...');
      } finally {
        exporting.value = false;
      }
    };

    const exportModularContent = async () => {
      // Implementation for exporting modular content
      exporting.value = true;
      try {
        // Export logic here
        console.log('Exporting modular content...');
      } finally {
        exporting.value = false;
      }
    };

    const previewDocument = (document: any) => {
      // Open document in preview mode
      const route = `/documents/${document.$id}`;
      window.open(route, '_blank');
    };

    const clearTextFields = async (document: any) => {
      // Clear text fields without deleting the document
      try {
        migrating.value.add(document.$id);
        const database = new Databases(appw);

        const updateData: any = {};

        // Clear only text fields, keep other properties intact
        if (document.text_rs) updateData.text_rs = '';
        if (document.text_en) updateData.text_en = '';
        if (document.text_hu) updateData.text_hu = '';

        await database.updateDocument(
          config.website_db,
          config.about_us_db,
          document.$id,
          updateData
        );

        await loadDocuments();

      } catch (error) {
        console.error('Clear text fields failed:', error);
      } finally {
        migrating.value.delete(document.$id);
      }
    };

    const revertDocument = async (document: any) => {
      // Revert modular document back to legacy
      try {
        const database = new Databases(appw);

        await database.updateDocument(
          config.website_db,
          config.about_us_db,
          document.$id,
          { use_legacy_content: true }
        );

        await loadDocuments();

      } catch (error) {
        console.error('Revert failed:', error);
      }
    };

    const refreshDocuments = () => {
      loadDocuments();
    };

    const saveMigrationOptions = () => {
      showMigrationOptions.value = false;
      // Save options to localStorage or store
      localStorage.setItem('migrationOptions', JSON.stringify(migrationOptions.value));
    };

    const closeMigrationProgress = () => {
      showProgress.value = false;
      migrationProgress.value = {
        current: 0,
        total: 0,
        currentDocument: '',
        completed: false
      };
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };

    const previousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    const previewMigration = async (document: any) => {
      selectedDocument.value = document;
      showMigrationPreview.value = true;
      migrationPreviewLoading.value = true;
      previewComponents.value = [];

      try {
        const components = await ContentMigrationService.migrateLegacyDocument(document, migrationOptions.value);
        previewComponents.value = components;
      } catch (error) {
        console.error('Migration preview failed:', error);
      } finally {
        migrationPreviewLoading.value = false;
      }
    };

    const confirmMigration = async () => {
      if (selectedDocument.value) {
        showMigrationPreview.value = false;
        await migrateDocument(selectedDocument.value);
      }
    };

    const closeMigrationPreview = () => {
      showMigrationPreview.value = false;
      selectedDocument.value = null;
      previewComponents.value = [];
      migrationPreviewLoading.value = false;
    };

    const getComponentTypeLabel = (type: string): string => {
      const labels: { [key: string]: string } = {
        heading: 'Címsor',
        text: 'Szöveg',
        youtube: 'YouTube videó',
        gallery: 'Galéria',
        video: 'Videó',
        legacy_content: 'Dokumentumok'
      };
      return labels[type] || type;
    };

    const getLanguageStatusClass = (status: string): string => {
      switch (status) {
        case 'complete':
          return 'bg-green-100 text-green-800';
        case 'partial':
          return 'bg-yellow-100 text-yellow-800';
        case 'missing':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const truncateText = (text: string, maxLength: number): string => {
      if (text.length <= maxLength) {
        return text;
      }
      return text.substring(0, maxLength) + '...';
    };

    // Load saved options
    onMounted(() => {
      const savedOptions = localStorage.getItem('migrationOptions');
      if (savedOptions) {
        migrationOptions.value = { ...migrationOptions.value, ...JSON.parse(savedOptions) };
      }
      loadDocuments();
    });

    return {
      documents,
      stats,
      documentFilter,
      searchQuery,
      currentPage,
      itemsPerPage,
      bulkMigrating,
      exporting,
      migrating,
      showMigrationOptions,
      migrationOptions,
      showProgress,
      migrationProgress,
      filteredDocuments,
      totalDocuments,
      totalPages,
      startItem,
      endItem,
      migrationProgressPercent,
      getDocumentTitle,
      getDocumentType,
      getDocumentStatus,
      getStatusClasses,
      canMigrate,
      canRevert,
      canClearText,
      migrateDocument,
      clearTextFields,
      startBulkMigration,
      exportLegacyContent,
      exportModularContent,
      previewDocument,
      revertDocument,
      refreshDocuments,
      saveMigrationOptions,
      closeMigrationProgress,
      nextPage,
      previousPage,
      // Migration preview
      showMigrationPreview,
      migrationPreviewLoading,
      selectedDocument,
      previewComponents,
      previewMigration,
      confirmMigration,
      closeMigrationPreview,
      getComponentTypeLabel,
      getLanguageStatusClass,
      truncateText
    };
  }
});
</script>

<style scoped>
.content-migration-panel {
  @apply max-w-7xl mx-auto p-6;
}

.stat-card {
  @apply transition-all duration-200 hover:shadow-md;
}

.action-card {
  @apply transition-all duration-200 hover:shadow-xl;
}

.list-content {
  @apply min-h-[400px];
}
</style>