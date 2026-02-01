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
        <v-card v-if="embedUrl" variant="outlined" class="mt-4">
            <v-card-title class="text-body-2">
                <v-icon left size="small">mdi-eye</v-icon>
                {{ $t('preview') }}
            </v-card-title>
            <v-card-text>
                <div class="video-preview">
                    <iframe
                        :src="embedUrl"
                        width="100%"
                        height="315"
                        frameborder="0"
                        allowfullscreen
                    />
                </div>
            </v-card-text>
        </v-card>
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
.video-preview iframe {
    border-radius: 8px;
}
</style>
