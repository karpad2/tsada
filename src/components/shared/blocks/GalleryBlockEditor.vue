<template>
    <div class="gallery-block-editor">
        <v-select
            v-model="localSettings.galleryId"
            :items="galleries"
            :label="$t('select_gallery')"
            item-value="id"
            item-title="title"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-image-multiple"
            class="mb-4"
            @update:model-value="emitSettings"
        >
            <template #append>
                <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="loadGalleries"
                >
                    <v-icon>mdi-refresh</v-icon>
                </v-btn>
            </template>
        </v-select>

        <v-row>
            <v-col cols="6">
                <v-select
                    v-model="localSettings.layout"
                    :items="layoutOptions"
                    :label="$t('layout')"
                    variant="outlined"
                    density="comfortable"
                    @update:model-value="emitSettings"
                />
            </v-col>
            <v-col cols="6">
                <v-select
                    v-model="localSettings.columns"
                    :items="columnOptions"
                    :label="$t('columns')"
                    variant="outlined"
                    density="comfortable"
                    @update:model-value="emitSettings"
                />
            </v-col>
        </v-row>

        <!-- Preview -->
        <v-card v-if="localSettings.galleryId" variant="outlined" class="mt-4">
            <v-card-title class="text-body-2">
                <v-icon left size="small">mdi-eye</v-icon>
                {{ $t('preview') }}
            </v-card-title>
            <v-card-text>
                <AlbumViewer :caption="false" :id="localSettings.galleryId" />
            </v-card-text>
        </v-card>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import { Databases, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { useLoadingStore } from '@/stores/loading';
import { convertifserbian } from '@/lang';
import AlbumViewer from '@/components/AlbumViewer.vue';

export default defineComponent({
    name: 'GalleryBlockEditor',
    components: { AlbumViewer },
    props: {
        block: { type: Object, required: true },
        settings: { type: Object, default: () => ({}) },
        language: { type: String, default: 'rs' }
    },
    emits: ['update:settings', 'save'],
    setup(props, { emit }) {
        const database = new Databases(appw);
        const loadingStore = useLoadingStore();

        const galleries = ref<any[]>([]);
        const localSettings = ref({
            galleryId: props.settings.galleryId || '',
            layout: props.settings.layout || 'grid',
            columns: props.settings.columns || 3
        });

        const layoutOptions = [
            { title: 'Grid', value: 'grid' },
            { title: 'Masonry', value: 'masonry' },
            { title: 'Carousel', value: 'carousel' }
        ];

        const columnOptions = [
            { title: '2', value: 2 },
            { title: '3', value: 3 },
            { title: '4', value: 4 },
            { title: '6', value: 6 }
        ];

        const loadGalleries = async () => {
            try {
                const result = await database.listDocuments(
                    config.website_db,
                    config.gallery,
                    [
                        Query.select(['title_hu', 'title_en', 'title_rs', '$id', 'visible']),
                        Query.limit(50)
                    ]
                );

                const local = loadingStore.language;
                galleries.value = result.documents.map(element => {
                    let title = '';
                    switch (local) {
                        case 'en': title = element.title_en; break;
                        case 'hu': title = element.title_hu; break;
                        default: title = convertifserbian(element.title_rs); break;
                    }
                    return { id: element.$id, title, visible: element.visible };
                });
            } catch (error) {
                console.error('Failed to load galleries:', error);
            }
        };

        const emitSettings = () => {
            emit('update:settings', { ...localSettings.value });
            emit('save');
        };

        watch(() => props.settings, (newSettings) => {
            localSettings.value = {
                galleryId: newSettings.galleryId || '',
                layout: newSettings.layout || 'grid',
                columns: newSettings.columns || 3
            };
        }, { deep: true });

        onMounted(loadGalleries);

        return {
            galleries,
            localSettings,
            layoutOptions,
            columnOptions,
            loadGalleries,
            emitSettings
        };
    }
});
</script>
