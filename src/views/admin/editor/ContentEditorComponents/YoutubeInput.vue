// YoutubeListEditor.vue
<template>
  <div class="mb-6">
    <h2 class="text-xl font-semibold mb-2">{{ $t('youtube_videos') }}</h2>

    <div v-for="(video, index) in localVideos" :key="index" class="mb-3">
      <v-text-field
        :label="$t('youtube_url') + ' #' + (index + 1)"
        v-model="localVideos[index]"
        @change="emitUpdate"
        append-icon="mdi-delete"
        @click:append="removeVideo(index)"
      />
    </div>

    <v-btn color="primary" class="mt-2" @click="addVideo">
      {{ $t('add_video') }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  videos: {
    type: Array as () => string[],
    default: () => []
  }
});

const emit = defineEmits(['update:videos', 'save']);
const { t } = useI18n();

const localVideos = ref<string[]>([...props.videos]);

watch(
  () => props.videos,
  (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(localVideos.value)) {
      localVideos.value = [...newVal];
    }
  }
);

function emitUpdate() {
  emit('update:videos', localVideos.value);
}

function addVideo() {
  localVideos.value.push('');
  emitUpdate();
}

function removeVideo(index: number) {
  localVideos.value.splice(index, 1);
  emitUpdate();
}
</script>

<style scoped>
.mb-6 {
  margin-bottom: 1.5rem;
}
</style>