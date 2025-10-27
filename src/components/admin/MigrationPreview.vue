<template>
  <v-dialog v-model="dialog" max-width="800px" persistent>
    <v-card>
      <v-card-title class="text-lg font-bold">
        <i class="pi pi-eye mr-2"></i>
        Migration Preview
      </v-card-title>

      <v-card-text>
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4">Analyzing content for migration...</p>
        </div>

        <div v-else-if="previewData">
          <div class="mb-4">
            <h3 class="text-md font-semibold mb-2">Migration Summary</h3>
            <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded">
              <p><strong>Components to create:</strong> {{ previewData.components.length }}</p>
              <p><strong>Legacy content:</strong> {{ hasLegacyContent ? 'Yes' : 'No' }}</p>
              <p><strong>Estimated processing time:</strong> {{ estimatedTime }}s</p>
            </div>
          </div>

          <div class="mb-4">
            <h3 class="text-md font-semibold mb-2">Components Preview</h3>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="(component, index) in previewData.components"
                :key="index"
                class="border border-gray-200 dark:border-gray-600 rounded p-3"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <i :class="getComponentIcon(component.type)"></i>
                    <span class="font-medium">{{ component.type.toUpperCase() }}</span>
                    <span class="text-sm text-gray-500">Order: {{ component.order }}</span>
                  </div>
                  <v-chip :color="getComponentColor(component.type)" size="small">
                    {{ getComponentStatus(component) }}
                  </v-chip>
                </div>
                <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <div v-if="component.type === 'heading'">
                    Title: {{ component.content_rs?.title || 'Empty' }}
                  </div>
                  <div v-else-if="component.type === 'text'">
                    Content: {{ (component.content_rs?.content || '').substring(0, 100) }}...
                  </div>
                  <div v-else-if="component.type === 'youtube'">
                    Video URL: {{ component.content_rs?.youtube_url || 'Empty' }}
                  </div>
                  <div v-else>
                    {{ component.type }} component
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="warnings.length > 0" class="mb-4">
            <h3 class="text-md font-semibold mb-2 text-orange-600">Warnings</h3>
            <div class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-3">
              <ul class="list-disc list-inside space-y-1">
                <li v-for="warning in warnings" :key="warning" class="text-sm text-orange-700 dark:text-orange-300">
                  {{ warning }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="dialog = false" variant="outlined">
          Cancel
        </v-btn>
        <v-btn
          @click="confirmMigration"
          color="primary"
          :disabled="loading || !previewData"
        >
          Proceed with Migration
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'
import type { ContentComponent } from '@/types/contentTypes'

export default defineComponent({
  name: 'MigrationPreview',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    documentData: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  setup(props, { emit }) {
    const loading = ref(false)
    const previewData = ref<{ components: ContentComponent[] } | null>(null)
    const warnings = ref<string[]>([])

    const dialog = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val)
    })

    const hasLegacyContent = computed(() => {
      if (!props.documentData) return false
      return !!(
        props.documentData.title_rs || props.documentData.title_en || props.documentData.title_hu ||
        props.documentData.text_rs || props.documentData.text_en || props.documentData.text_hu ||
        props.documentData.yt_video || props.documentData.has_gallery || props.documentData.has_documents
      )
    })

    const estimatedTime = computed(() => {
      if (!previewData.value) return 0
      return Math.ceil(previewData.value.components.length * 0.5) // 0.5 seconds per component
    })

    const generatePreview = async () => {
      if (!props.documentData) return

      loading.value = true
      warnings.value = []

      try {
        // Import migration service
        const { ContentMigrationService } = await import('@/utils/contentMigration')

        // Generate preview components
        const components = await ContentMigrationService.migrateLegacyDocument(props.documentData)

        console.log('Document data for migration:', props.documentData)
        console.log('Generated components:', components)
        console.log('Components count:', components?.length)

        previewData.value = { components }

        // Generate warnings
        if (!hasLegacyContent.value) {
          warnings.value.push('No legacy content found to migrate')
        }

        if (components.length === 0) {
          warnings.value.push('No components will be created')
        }

        const emptyComponents = components.filter(c =>
          !c.content_rs || Object.keys(c.content_rs).every(key => !c.content_rs[key])
        )

        if (emptyComponents.length > 0) {
          warnings.value.push(`${emptyComponents.length} components will be empty`)
        }

      } catch (error) {
        console.error('Preview generation failed:', error)
        warnings.value.push('Failed to generate preview')
      } finally {
        loading.value = false
      }
    }

    const getComponentIcon = (type: string): string => {
      switch (type) {
        case 'heading': return 'pi pi-text'
        case 'text': return 'pi pi-align-left'
        case 'youtube': return 'pi pi-video'
        case 'gallery': return 'pi pi-images'
        case 'video': return 'pi pi-play'
        case 'legacy_content': return 'pi pi-file-text'
        default: return 'pi pi-question'
      }
    }

    const getComponentColor = (type: string): string => {
      switch (type) {
        case 'heading': return 'blue'
        case 'text': return 'green'
        case 'youtube': return 'red'
        case 'gallery': return 'purple'
        case 'video': return 'orange'
        case 'legacy_content': return 'gray'
        default: return 'gray'
      }
    }

    const getComponentStatus = (component: ContentComponent): string => {
      const hasContent = component.content_rs && Object.keys(component.content_rs).some(key => component.content_rs[key])
      return hasContent ? 'Ready' : 'Empty'
    }

    const confirmMigration = () => {
      emit('confirm', previewData.value)
      dialog.value = false
    }

    // Watch for dialog opening to generate preview
    watch(dialog, (newVal) => {
      if (newVal && !previewData.value) {
        generatePreview()
      }
    })

    return {
      dialog,
      loading,
      previewData,
      warnings,
      hasLegacyContent,
      estimatedTime,
      getComponentIcon,
      getComponentColor,
      getComponentStatus,
      confirmMigration
    }
  }
})
</script>