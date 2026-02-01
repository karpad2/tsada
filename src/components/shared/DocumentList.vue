<template>
  <div class="document-list">
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>{{ $t('loading') }}...</p>
    </div>

    <div v-else-if="documents.length === 0" class="empty">
      <p>{{ $t('no_content_available') }}</p>
    </div>

    <div v-else class="documents-grid">
      <a
        v-for="doc in documents"
        :key="doc.$id"
        :href="doc.fileUrl"
        target="_blank"
        class="document-card"
      >
        <div class="document-icon">
          <svg v-if="doc.fileType === 'pdf'" class="icon pdf" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 15v3h1v-1h.5a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-1.5zm1 1h.5v1H9.5v-1zm2.5-1v3h1.5a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H11zm1 1h.5v1H12v-1zm3.5-1v3h1v-1h1v-1h-1v-1h-1z"/>
          </svg>
          <svg v-else-if="doc.fileType === 'doc' || doc.fileType === 'docx'" class="icon doc" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
          </svg>
          <svg v-else class="icon default" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h7v5h5v11H6z"/>
          </svg>
        </div>
        <div class="document-info">
          <h4 class="document-title">{{ doc.title }}</h4>
          <p v-if="doc.description" class="document-description">{{ doc.description }}</p>
          <span class="document-meta">
            {{ doc.fileType?.toUpperCase() || 'FILE' }}
            <span v-if="doc.fileSize"> • {{ formatFileSize(doc.fileSize) }}</span>
          </span>
        </div>
        <div class="download-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
        </div>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Databases, Storage, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { useLoadingStore } from '@/stores/loading';

interface DocumentItem {
  $id: string;
  title: string;
  description?: string;
  fileId?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
}

export default defineComponent({
  name: 'DocumentList',
  props: {
    documentIds: {
      type: Array as () => string[],
      required: true
    },
    showPreview: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const { t } = useI18n();
    const database = new Databases(appw);
    const storage = new Storage(appw);
    const loadingStore = useLoadingStore();

    const documents = ref<DocumentItem[]>([]);
    const isLoading = ref(true);

    const loadDocuments = async () => {
      if (!props.documentIds || props.documentIds.length === 0) {
        documents.value = [];
        isLoading.value = false;
        return;
      }

      isLoading.value = true;

      try {
        const result = await database.listDocuments(
          config.website_db,
          config.documents_db,
          [
            Query.equal('$id', props.documentIds),
            Query.limit(50)
          ]
        );

        const lang = loadingStore.language;

        documents.value = result.documents.map(doc => {
          let title = '';
          let description = '';

          switch (lang) {
            case 'en':
              title = doc.title_en || doc.title_hu || doc.title_rs;
              description = doc.short_en || doc.short_hu || doc.short_rs;
              break;
            case 'hu':
              title = doc.title_hu || doc.title_rs || doc.title_en;
              description = doc.short_hu || doc.short_rs || doc.short_en;
              break;
            default:
              title = doc.title_rs || doc.title_hu || doc.title_en;
              description = doc.short_rs || doc.short_hu || doc.short_en;
          }

          let fileUrl = '';
          let fileType = '';

          if (doc.default_file) {
            fileUrl = storage.getFileView(config.documents, doc.default_file).toString();
            // Try to get file extension
            const fileName = doc.file_name || '';
            const ext = fileName.split('.').pop()?.toLowerCase();
            fileType = ext || 'file';
          }

          return {
            $id: doc.$id,
            title: title || t('untitled_document'),
            description,
            fileId: doc.default_file,
            fileUrl,
            fileType,
            fileSize: doc.file_size
          };
        });
      } catch (error) {
        console.error('Failed to load documents:', error);
        documents.value = [];
      } finally {
        isLoading.value = false;
      }
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    onMounted(loadDocuments);

    watch(() => props.documentIds, loadDocuments, { deep: true });

    return {
      documents,
      isLoading,
      formatFileSize
    };
  }
});
</script>

<style scoped>
.document-list {
  padding: 1rem 0;
}

.loading,
.empty {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.documents-grid {
  display: grid;
  gap: 1rem;
}

.document-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
}

.document-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.document-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 8px;
}

.document-icon .icon {
  width: 28px;
  height: 28px;
}

.document-icon .pdf {
  color: #dc2626;
}

.document-icon .doc {
  color: #2563eb;
}

.document-icon .default {
  color: #6b7280;
}

.document-info {
  flex: 1;
  min-width: 0;
}

.document-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-meta {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
}

.download-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: color 0.2s;
}

.document-card:hover .download-icon {
  color: #3b82f6;
}

.download-icon svg {
  width: 20px;
  height: 20px;
}

/* Dark mode */
:deep(.dark) .document-card {
  background: #1f2937;
  border-color: #374151;
}

:deep(.dark) .document-card:hover {
  border-color: #3b82f6;
}

:deep(.dark) .document-icon {
  background: #374151;
}

:deep(.dark) .document-title {
  color: #f9fafb;
}

/* Responsive */
@media (max-width: 640px) {
  .document-card {
    padding: 0.75rem;
  }

  .document-icon {
    width: 40px;
    height: 40px;
  }

  .document-icon .icon {
    width: 24px;
    height: 24px;
  }
}
</style>
