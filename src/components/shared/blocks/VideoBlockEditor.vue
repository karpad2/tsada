<template>
    <div class="video-block-editor">
        <v-text-field
            v-model="localSettings.videoUrl"
            :label="$t('video_url')"
            :placeholder="$t('video_url_placeholder')"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-video"
            class="mb-4"
            @change="emitSettings"
        />

        <v-row>
            <v-col cols="6">
                <v-select
                    v-model="localSettings.provider"
                    :items="providerOptions"
                    :label="$t('video_provider')"
                    variant="outlined"
                    density="comfortable"
                    @update:model-value="emitSettings"
                />
            </v-col>
            <v-col cols="6">
                <v-switch
                    v-model="localSettings.autoplay"
                    :label="$t('autoplay')"
                    color="primary"
                    @change="emitSettings"
                />
            </v-col>
        </v-row>

        <!-- Preview -->
        <div v-if="embedUrl" class="block-preview mt-4">
            <div class="block-preview-title">
                <v-icon left size="small" color="primary">mdi-eye</v-icon>
                {{ $t('preview') }}
            </div>
            <div class="block-preview-body">
                <div class="video-preview">
                    <iframe
                        :src="embedUrl"
                        width="100%"
                        height="315"
                        frameborder="0"
                        allowfullscreen
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from 'vue';

export default defineComponent({
    name: 'VideoBlockEditor',
    props: {
        block: { type: Object, required: true },
        settings: { type: Object, default: () => ({}) },
        language: { type: String, default: 'rs' }
    },
    emits: ['update:settings', 'save'],
    setup(props, { emit }) {
        const localSettings = ref({
            videoUrl: props.settings.videoUrl || '',
            provider: props.settings.provider || 'youtube',
            autoplay: props.settings.autoplay || false
        });

        const providerOptions = [
            { title: 'YouTube', value: 'youtube' },
            { title: 'Vimeo', value: 'vimeo' },
            { title: 'Direct URL', value: 'direct' }
        ];

        const embedUrl = computed(() => {
            const url = localSettings.value.videoUrl;
            if (!url) return '';

            if (localSettings.value.provider === 'youtube') {
                const videoId = extractYouTubeId(url);
                if (videoId) {
                    return `https://www.youtube.com/embed/${videoId}${localSettings.value.autoplay ? '?autoplay=1' : ''}`;
                }
            } else if (localSettings.value.provider === 'vimeo') {
                const videoId = extractVimeoId(url);
                if (videoId) {
                    return `https://player.vimeo.com/video/${videoId}${localSettings.value.autoplay ? '?autoplay=1' : ''}`;
                }
            } else {
                return url;
            }
            return '';
        });

        const extractYouTubeId = (url: string): string | null => {
            const patterns = [
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
                /^([a-zA-Z0-9_-]{11})$/
            ];
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) return match[1];
            }
            return null;
        };

        const extractVimeoId = (url: string): string | null => {
            const match = url.match(/vimeo\.com\/(\d+)/);
            return match ? match[1] : null;
        };

        const emitSettings = () => {
            emit('update:settings', { ...localSettings.value });
            emit('save');
        };

        watch(() => props.settings, (newSettings) => {
            localSettings.value = {
                videoUrl: newSettings.videoUrl || '',
                provider: newSettings.provider || 'youtube',
                autoplay: newSettings.autoplay || false
            };
        }, { deep: true });

        return {
            localSettings,
            providerOptions,
            embedUrl,
            emitSettings
        };
    }
});
</script>

<style scoped>
.video-preview {
    border-radius: 0.75rem;
    overflow: hidden;
}

.video-preview iframe {
    display: block;
    border: 0;
    border-radius: 0.75rem;
}

.block-preview {
    border-radius: 0.85rem;
    border: 1px solid rgba(14, 165, 233, 0.18);
    overflow: hidden;
    background: rgba(255, 255, 255, 0.45);
}

.block-preview-title {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.65rem 0.9rem;
    font-size: 0.875rem;
    font-weight: 600;
    border-bottom: 1px solid rgba(14, 165, 233, 0.12);
    background: rgba(14, 165, 233, 0.06);
}

.block-preview-body {
    padding: 0.85rem;
}

:global(.dark) .block-preview {
    background: rgba(15, 23, 42, 0.45);
    border-color: rgba(148, 163, 184, 0.16);
}
</style>

<style scoped>
.video-preview iframe {
    border-radius: 8px;
}
</style>
