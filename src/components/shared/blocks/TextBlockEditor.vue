<template>
    <div class="text-block-editor">
        <div class="editor-wrapper">
            <ckeditor
                v-model="localBlock.text"
                @change="emitSave"
            />
        </div>

        <v-alert type="info" variant="tonal" density="compact" class="mt-3">
            <v-icon left size="small">mdi-information</v-icon>
            {{ $t('text_block_info') }}
        </v-alert>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';

export default defineComponent({
    name: 'TextBlockEditor',
    props: {
        block: {
            type: Object,
            required: true
        },
        settings: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['update:settings', 'save'],
    setup(props, { emit }) {
        const localBlock = ref({ ...props.block });

        watch(() => props.block, (newBlock) => {
            localBlock.value = { ...newBlock };
        }, { deep: true });

        watch(localBlock, (newValue) => {
            Object.assign(props.block, newValue);
        }, { deep: true });

        const emitSave = () => {
            emit('save');
        };

        return {
            localBlock,
            emitSave
        };
    }
});
</script>

<style scoped>
.editor-wrapper {
    min-height: 200px;
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 8px;
    overflow: hidden;
}
</style>
