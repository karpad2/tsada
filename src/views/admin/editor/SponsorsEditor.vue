<template>
  <div class="sponsors-editor admin-panel container px-5 mx-auto">
    <!-- Header -->
    <section class="mb-4 page-header">
      <h1 class="section-title !text-2xl sm:!text-3xl !mb-1">
        {{ $t('sponsors_editor') }}
      </h1>
      <div class="section-accent !w-20"></div>
    </section>

    <!-- Mode Tabs -->
    <div class="editor-section !py-2 mb-6">
      <v-tabs v-model="activeTab" color="primary" class="mb-0">
        <v-tab value="sponsors">{{ $t('sponsors') }}</v-tab>
        <v-tab value="usefullinks">{{ $t('usefullinks') }}</v-tab>
      </v-tabs>
    </div>

    <!-- Add/Edit Form -->
    <section class="mb-6">
      <v-card class="pa-6" elevation="2">
        <v-card-title class="text-h6 mb-4">
          <v-icon left>{{ currentEditId ? 'mdi-pencil' : 'mdi-plus-circle' }}</v-icon>
          {{ currentEditId ? $t('edit_item') : $t('add_new_item') }}
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="form.url"
            :label="$t('link_url')"
            placeholder="https://..."
            outlined
            dense
            class="mb-4"
            prepend-icon="mdi-link"
          />

          <v-text-field
            v-model.number="form.sorrend"
            :label="$t('order')"
            type="number"
            outlined
            dense
            class="mb-4"
            prepend-icon="mdi-sort-numeric-ascending"
          />

          <!-- Image Upload -->
          <FileUploadSection
            upload-type="image"
            :multiple="false"
            :preview-urls="imagePreviewUrl ? [imagePreviewUrl] : []"
            :uploaded-file-ids="form.imageId ? [form.imageId] : []"
            :storage-id="config.website_images"
            :show-actions="false"
            :enable-translation="false"
            @files-uploaded="handleImageUploaded"
          />

          <div class="mt-4 d-flex gap-2">
            <v-btn
              @click="saveItem"
              :loading="saving"
              :disabled="saving || !form.url"
              color="success"
            >
              <v-icon left>mdi-content-save</v-icon>
              {{ currentEditId ? $t('save_changes') : $t('add_item') }}
            </v-btn>

            <v-btn
              v-if="currentEditId"
              @click="resetForm"
              color="secondary"
            >
              <v-icon left>mdi-close</v-icon>
              {{ $t('cancel') }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </section>

    <!-- Items List -->
    <section class="mb-12">
      <v-card elevation="2">
        <v-card-title class="text-h6">
          <v-icon left>mdi-view-list</v-icon>
          {{ activeTab === 'sponsors' ? $t('sponsors') : $t('usefullinks') }}
          <v-chip class="ml-2" color="info" size="small">{{ items.length }}</v-chip>
        </v-card-title>

        <v-card-text>
          <div v-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <v-data-table
            v-else
            :items="items"
            :headers="tableHeaders"
            class="elevation-1"
            :items-per-page="-1"
          >
            <template v-slot:item.image="{ item }">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.url"
                class="rounded"
                style="max-height: 60px; max-width: 100px; object-fit: contain;"
              />
              <v-icon v-else color="grey">mdi-image-off</v-icon>
            </template>

            <template v-slot:item.url="{ item }">
              <a :href="item.url" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">
                {{ truncateUrl(item.url) }}
              </a>
            </template>

            <template v-slot:item.actions="{ item, index }">
              <div class="d-flex gap-2">
                <v-btn
                  @click="editItem(item)"
                  icon
                  size="small"
                  color="primary"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>

                <v-btn
                  @click="deleteItem(item.id)"
                  icon
                  size="small"
                  color="error"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>

                <v-btn
                  @click="moveUp(index)"
                  icon
                  size="small"
                  :disabled="index === 0"
                >
                  <v-icon>mdi-arrow-up</v-icon>
                </v-btn>

                <v-btn
                  @click="moveDown(index)"
                  icon
                  size="small"
                  :disabled="index === items.length - 1"
                >
                  <v-icon>mdi-arrow-down</v-icon>
                </v-btn>
              </div>
            </template>

            <template #bottom></template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, reactive } from 'vue';
import { Databases, Storage, Query, ID } from 'appwrite';
import { appw, config } from '@/appwrite';

const db = new Databases(appw);
const st = new Storage(appw);
import FileUploadSection from '@/components/shared/FileUploadSection.vue';
import { useConfirmDialog } from '@/composables/ui/useConfirmDialog';
import { useI18n } from 'vue-i18n';

interface SponsorItem {
  id: string;
  url: string;
  imageId: string;
  imageUrl: string;
  sorrend: number;
}

export default defineComponent({
  name: 'SponsorsEditor',
  components: {
    FileUploadSection
  },
  setup() {
    const { t } = useI18n();
    const { openDialog } = useConfirmDialog();

    const activeTab = ref('sponsors');
    const items = ref<SponsorItem[]>([]);
    const loading = ref(false);
    const saving = ref(false);
    const currentEditId = ref<string | null>(null);

    const form = reactive({
      url: '',
      imageId: '',
      sorrend: 0
    });

    // Collection and field config based on active tab
    const collectionConfig = computed(() => {
      if (activeTab.value === 'sponsors') {
        return {
          collectionId: config.sponsors_db,
          urlField: 'sponsor_url',
          imageField: 'sponsor_img'
        };
      }
      return {
        collectionId: config.usefullinks,
        urlField: 'link',
        imageField: 'logo'
      };
    });

    const tableHeaders = computed(() => [
      { title: t('image'), key: 'image', sortable: false, width: '120px' },
      { title: t('link_url'), key: 'url' },
      { title: t('order'), key: 'sorrend', width: '100px' },
      { title: t('operations'), key: 'actions', sortable: false, width: '200px' }
    ]);

    const imagePreviewUrl = computed(() => {
      if (!form.imageId) return null;
      return st.getFilePreview(
        config.website_images,
        form.imageId,
        200, 0, "center", 90, 5, 'FFFFFF', 0, 1, 0, 'FFFFFF', "webp"
      );
    });

    const loadItems = async () => {
      loading.value = true;
      try {
        const cfg = collectionConfig.value;

        const response = await db.listDocuments(
          config.website_db,
          cfg.collectionId,
          [Query.orderAsc('sorrend')]
        );

        items.value = response.documents.map(doc => ({
          id: doc.$id,
          url: doc[cfg.urlField] || '',
          imageId: doc[cfg.imageField] || '',
          imageUrl: doc[cfg.imageField]
            ? st.getFilePreview(
                config.website_images,
                doc[cfg.imageField],
                200, 0, "center", 90, 5, 'FFFFFF', 0, 1, 0, 'FFFFFF', "webp"
              )
            : '',
          sorrend: doc.sorrend || 0
        }));
      } catch (error) {
        console.error('Error loading items:', error);
      } finally {
        loading.value = false;
      }
    };

    const saveItem = async () => {
      saving.value = true;
      try {
        const cfg = collectionConfig.value;

        const data: Record<string, any> = {
          [cfg.urlField]: form.url,
          [cfg.imageField]: form.imageId,
          sorrend: form.sorrend
        };

        if (currentEditId.value) {
          await db.updateDocument(
            config.website_db,
            cfg.collectionId,
            currentEditId.value,
            data
          );
        } else {
          await db.createDocument(
            config.website_db,
            cfg.collectionId,
            ID.unique(),
            data
          );
        }

        resetForm();
        await loadItems();
      } catch (error) {
        console.error('Error saving item:', error);
      } finally {
        saving.value = false;
      }
    };

    const editItem = (item: SponsorItem) => {
      currentEditId.value = item.id;
      form.url = item.url;
      form.imageId = item.imageId;
      form.sorrend = item.sorrend;
    };

    const deleteItem = async (id: string) => {
      const confirmed = await openDialog({
        title: t('delete'),
        message: t('confirm_delete'),
        confirmText: t('delete'),
        color: 'error',
        icon: 'mdi-delete'
      });
      if (!confirmed) return;

      try {
        const cfg = collectionConfig.value;
        await db.deleteDocument(config.website_db, cfg.collectionId, id);
        await loadItems();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    };

    const moveUp = async (index: number) => {
      if (index <= 0) return;
      await swapOrder(index, index - 1);
    };

    const moveDown = async (index: number) => {
      if (index >= items.value.length - 1) return;
      await swapOrder(index, index + 1);
    };

    const swapOrder = async (indexA: number, indexB: number) => {
      const cfg = collectionConfig.value;

      const itemA = items.value[indexA];
      const itemB = items.value[indexB];

      const orderA = itemA.sorrend;
      const orderB = itemB.sorrend;

      // If they have the same order, use the indices
      const newOrderA = orderA === orderB ? indexB : orderB;
      const newOrderB = orderA === orderB ? indexA : orderA;

      try {
        await Promise.all([
          db.updateDocument(config.website_db, cfg.collectionId, itemA.id, { sorrend: newOrderA }),
          db.updateDocument(config.website_db, cfg.collectionId, itemB.id, { sorrend: newOrderB })
        ]);
        await loadItems();
      } catch (error) {
        console.error('Error reordering items:', error);
      }
    };

    const resetForm = () => {
      currentEditId.value = null;
      form.url = '';
      form.imageId = '';
      form.sorrend = items.value.length;
    };

    const handleImageUploaded = (uploadedFiles: any[]) => {
      if (uploadedFiles.length > 0) {
        form.imageId = uploadedFiles[0].$id;
      }
    };

    const truncateUrl = (url: string): string => {
      if (url.length > 50) {
        return url.substring(0, 50) + '...';
      }
      return url;
    };

    // Reload when tab changes
    watch(activeTab, () => {
      resetForm();
      loadItems();
    });

    onMounted(() => {
      loadItems();
    });

    return {
      activeTab,
      items,
      loading,
      saving,
      currentEditId,
      form,
      tableHeaders,
      imagePreviewUrl,
      loadItems,
      saveItem,
      editItem,
      deleteItem,
      moveUp,
      moveDown,
      resetForm,
      handleImageUploaded,
      truncateUrl,
      config
    };
  }
});
</script>

<style scoped>
.sponsors-editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.d-flex {
  display: flex;
}

.gap-2 {
  gap: 8px;
}

.v-card {
  transition: all 0.3s ease;
}

.v-btn {
  text-transform: none;
  font-weight: 500;
}
</style>
