<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title class="text-lg font-bold">
        <i class="pi pi-cogs mr-2"></i>
        Batch Migration Progress
      </v-card-title>

      <v-card-text>
        <div class="mb-4">
          <h3 class="text-md font-semibold mb-2">Overall Progress</h3>
          <v-progress-linear
            :model-value="overallProgress"
            color="primary"
            height="8"
            rounded
          ></v-progress-linear>
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span>{{ completedItems }} of {{ totalItems }} completed</span>
            <span>{{ overallProgress }}%</span>
          </div>
        </div>

        <div class="mb-4">
          <h3 class="text-md font-semibold mb-2">Current Operation</h3>
          <div class="flex items-center space-x-3">
            <v-progress-circular
              v-if="currentOperation.status === 'processing'"
              indeterminate
              color="primary"
              size="24"
            ></v-progress-circular>
            <v-icon
              v-else-if="currentOperation.status === 'completed'"
              color="success"
              size="24"
            >
              mdi-check-circle
            </v-icon>
            <v-icon
              v-else-if="currentOperation.status === 'error'"
              color="error"
              size="24"
            >
              mdi-alert-circle
            </v-icon>
            <div class="flex-1">
              <p class="font-medium">{{ currentOperation.name }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ currentOperation.description }}</p>
            </div>
          </div>
        </div>

        <div v-if="currentBatch.components.length > 0" class="mb-4">
          <h3 class="text-md font-semibold mb-2">Current Batch ({{ currentBatch.index + 1 }}/{{ totalBatches }})</h3>
          <v-progress-linear
            :model-value="batchProgress"
            color="secondary"
            height="6"
            rounded
          ></v-progress-linear>
          <div class="mt-2 max-h-32 overflow-y-auto">
            <div
              v-for="(component, index) in currentBatch.components"
              :key="index"
              class="flex items-center justify-between py-1 px-2 rounded"
              :class="getComponentStatusClass(component.status)"
            >
              <div class="flex items-center space-x-2">
                <i :class="getComponentIcon(component.type)" class="text-sm"></i>
                <span class="text-sm">{{ component.type }} #{{ index + 1 }}</span>
              </div>
              <v-chip
                :color="getStatusColor(component.status)"
                size="x-small"
                variant="flat"
              >
                {{ component.status }}
              </v-chip>
            </div>
          </div>
        </div>

        <div v-if="errors.length > 0" class="mb-4">
          <h3 class="text-md font-semibold mb-2 text-red-600">Errors ({{ errors.length }})</h3>
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 max-h-32 overflow-y-auto">
            <div v-for="(error, index) in errors" :key="index" class="text-sm text-red-700 dark:text-red-300 mb-1">
              <strong>{{ error.component }}:</strong> {{ error.message }}
            </div>
          </div>
        </div>

        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Estimated time remaining:</strong> {{ formatTime(estimatedTimeRemaining) }}</p>
          <p><strong>Elapsed time:</strong> {{ formatTime(elapsedTime) }}</p>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          v-if="!isCompleted && !isCancelled"
          @click="cancelMigration"
          variant="outlined"
          color="warning"
        >
          Cancel
        </v-btn>
        <v-btn
          v-if="isCompleted"
          @click="dialog = false"
          color="success"
        >
          Done
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'

interface BatchItem {
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  $id?: string
  error?: string
}

interface BatchData {
  index: number
  components: BatchItem[]
}

interface Operation {
  name: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'error'
}

interface ErrorItem {
  component: string
  message: string
}

export default defineComponent({
  name: 'BatchMigrationProgress',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    totalComponents: {
      type: Number,
      default: 0
    }
  },
  emits: ['update:modelValue', 'cancel', 'completed'],
  setup(props, { emit }) {
    const startTime = ref<Date | null>(null)
    const completedItems = ref(0)
    const totalBatches = ref(0)
    const errors = ref<ErrorItem[]>([])
    const isCancelled = ref(false)

    const currentOperation = ref<Operation>({
      name: 'Initializing...',
      description: 'Preparing migration process',
      status: 'pending'
    })

    const currentBatch = ref<BatchData>({
      index: 0,
      components: []
    })

    const dialog = computed({
      get: () => props.modelValue,
      set: (val: boolean) => emit('update:modelValue', val)
    })

    const totalItems = computed(() => props.totalComponents)

    const overallProgress = computed(() => {
      if (totalItems.value === 0) return 0
      return Math.round((completedItems.value / totalItems.value) * 100)
    })

    const batchProgress = computed(() => {
      if (currentBatch.value.components.length === 0) return 0
      const completed = currentBatch.value.components.filter(c => c.status === 'completed' || c.status === 'error').length
      return Math.round((completed / currentBatch.value.components.length) * 100)
    })

    const isCompleted = computed(() => completedItems.value >= totalItems.value && !isCancelled.value)

    const elapsedTime = computed(() => {
      if (!startTime.value) return 0
      return Math.floor((Date.now() - startTime.value.getTime()) / 1000)
    })

    const estimatedTimeRemaining = computed(() => {
      if (completedItems.value === 0 || elapsedTime.value === 0) return 0
      const rate = completedItems.value / elapsedTime.value
      const remaining = totalItems.value - completedItems.value
      return Math.ceil(remaining / rate)
    })

    const getComponentIcon = (type: string): string => {
      switch (type) {
        case 'heading': return 'pi pi-text'
        case 'text': return 'pi pi-align-left'
        case 'youtube': return 'pi pi-video'
        case 'gallery': return 'pi pi-images'
        case 'video': return 'pi pi-play'
        default: return 'pi pi-question'
      }
    }

    const getStatusColor = (status: string): string => {
      switch (status) {
        case 'completed': return 'success'
        case 'processing': return 'primary'
        case 'error': return 'error'
        default: return 'gray'
      }
    }

    const getComponentStatusClass = (status: string): string => {
      switch (status) {
        case 'completed': return 'bg-green-50 dark:bg-green-900/20'
        case 'processing': return 'bg-blue-50 dark:bg-blue-900/20'
        case 'error': return 'bg-red-50 dark:bg-red-900/20'
        default: return 'bg-gray-50 dark:bg-gray-800'
      }
    }

    const formatTime = (seconds: number): string => {
      if (seconds < 60) return `${seconds}s`
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds}s`
    }

    const updateProgress = (data: {
      completedItems?: number
      currentOperation?: Partial<Operation>
      currentBatch?: Partial<BatchData>
      totalBatches?: number
      errors?: ErrorItem[]
    }) => {
      if (data.completedItems !== undefined) {
        completedItems.value = data.completedItems
      }
      if (data.currentOperation) {
        Object.assign(currentOperation.value, data.currentOperation)
      }
      if (data.currentBatch) {
        Object.assign(currentBatch.value, data.currentBatch)
      }
      if (data.totalBatches !== undefined) {
        totalBatches.value = data.totalBatches
      }
      if (data.errors) {
        errors.value = data.errors
      }
    }

    const startMigration = () => {
      startTime.value = new Date()
      completedItems.value = 0
      errors.value = []
      isCancelled.value = false
      currentOperation.value = {
        name: 'Starting migration...',
        description: 'Initializing batch processing',
        status: 'processing'
      }
    }

    const cancelMigration = () => {
      isCancelled.value = true
      currentOperation.value = {
        name: 'Cancelling...',
        description: 'Stopping migration process',
        status: 'processing'
      }
      emit('cancel')
    }

    // Watch for completion
    watch(isCompleted, (newVal) => {
      if (newVal) {
        emit('completed', {
          totalProcessed: completedItems.value,
          errors: errors.value,
          elapsedTime: elapsedTime.value
        })
      }
    })

    // Watch for dialog opening to start migration
    watch(dialog, (newVal) => {
      if (newVal) {
        startMigration()
      }
    })

    // Expose methods for parent component
    const exposedMethods = {
      updateProgress,
      startMigration
    }

    // Make methods available to parent
    ;(window as any).batchMigrationProgressMethods = exposedMethods

    return {
      dialog,
      currentOperation,
      currentBatch,
      totalItems,
      completedItems,
      totalBatches,
      overallProgress,
      batchProgress,
      errors,
      isCompleted,
      isCancelled,
      elapsedTime,
      estimatedTimeRemaining,
      getComponentIcon,
      getStatusColor,
      getComponentStatusClass,
      formatTime,
      cancelMigration
    }
  }
})
</script>