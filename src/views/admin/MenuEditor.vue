<template>
  <div class="page-shell">
  <div class="page-panel container">
  <v-container fluid class="pa-0">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-4">
          <div>
            <h1 class="section-title !text-2xl sm:!text-3xl !mb-1">{{ $t('menu_editor') }}</h1>
            <div class="section-accent !mb-2"></div>
            <p class="page-subtitle !mt-0">{{ $t('menu_editor_desc') }}</p>
          </div>
          <div class="d-flex ga-2">
            <v-btn
              color="warning"
              variant="outlined"
              @click="resetToDefaults"
              :loading="resetting"
            >
              <v-icon start>mdi-restore</v-icon>
              {{ $t('reset_to_default') }}
            </v-btn>
            <v-btn
              color="primary"
              @click="saveConfig"
              :loading="saving"
              :disabled="!hasChanges"
            >
              <v-icon start>mdi-content-save</v-icon>
              {{ $t('save') }}
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-row v-if="loading">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="48" />
      </v-col>
    </v-row>

    <!-- Menu Groups -->
    <v-row v-else>
      <v-col cols="12" md="8">
        <draggable
          v-model="editableGroups"
          item-key="id"
          handle=".group-drag-handle"
          @start="groupDrag = true"
          @end="onGroupDragEnd"
        >
          <template #item="{ element: group }">
            <v-card
              class="mb-3"
              :variant="group._isCustomGroup ? 'elevated' : 'outlined'"
              :class="{ 'custom-group-card': group._isCustomGroup }"
            >
              <v-card-title class="d-flex align-center ga-3 py-2">
                <v-icon class="group-drag-handle cursor-move" color="grey">mdi-drag</v-icon>
                <v-switch
                  v-model="group.enabled"
                  color="primary"
                  density="compact"
                  hide-details
                  class="flex-grow-0"
                  @update:model-value="hasChanges = true"
                />
                <span class="text-body-1 font-weight-medium text-black">
                  {{ getGroupLabel(group) }}
                </span>
                <v-chip size="x-small" color="info" variant="flat" class="ml-1">
                  {{ group.type }}
                </v-chip>
                <v-chip v-if="group._isCustomGroup" size="x-small" color="success" variant="flat" class="ml-1">
                  {{ $t('custom') }}
                </v-chip>
                <v-spacer />
                <v-btn
                  v-if="group._isCustomGroup"
                  icon="mdi-pencil"
                  variant="text"
                  size="x-small"
                  @click="editCustomGroup(group)"
                />
                <v-btn
                  v-if="group._isCustomGroup"
                  icon="mdi-delete"
                  variant="text"
                  size="x-small"
                  color="error"
                  @click="removeCustomGroup(group.id)"
                />
                <v-btn
                  :icon="expandedGroups.has(group.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  variant="text"
                  size="small"
                  @click="toggleGroupExpand(group.id)"
                />
              </v-card-title>

              <!-- Expanded items -->
              <v-expand-transition>
                <div v-if="expandedGroups.has(group.id)">
                  <v-divider />
                  <v-card-text class="pa-2">
                    <draggable
                      v-if="group.items && group.items.length > 0"
                      v-model="group.items"
                      item-key="id"
                      handle=".item-drag-handle"
                      @start="itemDrag = true"
                      @end="onItemDragEnd"
                    >
                      <template #item="{ element: item }">
                        <div class="d-flex align-center ga-2 pa-2 rounded mb-1 item-row">
                          <v-icon class="item-drag-handle cursor-move" size="small" color="grey">mdi-drag</v-icon>
                          <v-switch
                            v-model="item.enabled"
                            color="primary"
                            density="compact"
                            hide-details
                            class="flex-grow-0"
                            @update:model-value="hasChanges = true"
                          />
                          <span class="text-body-2">
                            {{ getItemLabel(item) }}
                          </span>
                          <v-chip v-if="item._isCustom" size="x-small" color="success" variant="flat" class="ml-1">
                            {{ $t('custom') }}
                          </v-chip>
                          <v-spacer />
                          <v-btn
                            v-if="item._isCustom"
                            icon="mdi-pencil"
                            variant="text"
                            size="x-small"
                            @click="editCustomLink(group.id, item)"
                          />
                          <v-btn
                            v-if="item._isCustom"
                            icon="mdi-delete"
                            variant="text"
                            size="x-small"
                            color="error"
                            @click="removeCustomLink(group.id, item.id)"
                          />
                        </div>
                      </template>
                    </draggable>

                    <div v-if="!group.items || group.items.length === 0" class="text-body-2 text-grey pa-2">
                      {{ $t('no_items') }}
                    </div>

                    <!-- Add custom link button for dropdown groups -->
                    <v-btn
                      v-if="group.type === 'dropdown'"
                      variant="tonal"
                      size="small"
                      color="primary"
                      class="mt-2"
                      @click="openAddCustomLink(group.id)"
                    >
                      <v-icon start size="small">mdi-plus</v-icon>
                      {{ $t('add_custom_link') }}
                    </v-btn>
                  </v-card-text>
                </div>
              </v-expand-transition>
            </v-card>
          </template>
        </draggable>

        <!-- Add new group button -->
        <v-btn
          variant="outlined"
          color="success"
          block
          class="mt-2 mb-4"
          size="large"
          @click="openAddCustomGroup"
        >
          <v-icon start>mdi-plus-circle</v-icon>
          {{ $t('add_new_group') }}
        </v-btn>
      </v-col>

      <!-- Preview panel -->
      <v-col cols="12" md="4">
        <v-card variant="outlined" class="sticky-preview">
          <v-card-title class="text-body-1 font-weight-medium text-black">
            <v-icon start size="small">mdi-eye</v-icon>
            {{ $t('preview') }}
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <v-list density="compact">
              <template v-for="group in previewGroups" :key="group.id">
                <v-list-item
                  v-if="group.type === 'direct-link'"
                  :title="group.label"
                  density="compact"
                >
                  <template #prepend>
                    <v-icon size="small" color="primary">mdi-link</v-icon>
                  </template>
                </v-list-item>
                <v-list-item
                  v-else-if="group.type === 'language-selector'"
                  :title="$t('language')"
                  density="compact"
                >
                  <template #prepend>
                    <v-icon size="small" color="primary">mdi-translate</v-icon>
                  </template>
                </v-list-item>
                <v-list-group v-else-if="group.type === 'dropdown'" :value="group.id">
                  <template #activator="{ props }">
                    <v-list-item v-bind="props" :title="group.label" density="compact">
                      <template #prepend>
                        <v-icon size="small" color="primary">mdi-menu-down</v-icon>
                      </template>
                    </v-list-item>
                  </template>
                  <v-list-item
                    v-for="item in group.items"
                    :key="item.id"
                    :title="item.label"
                    density="compact"
                    class="pl-8"
                  />
                </v-list-group>
              </template>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Custom Link Dialog -->
    <v-dialog v-model="customLinkDialog" max-width="500">
      <v-card>
        <v-card-title>
          {{ editingCustomLink ? $t('edit_item') : $t('add_custom_link') }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="customLinkForm.labels.hu"
            label="Magyar cimke"
            density="compact"
            class="mb-2"
          />
          <v-text-field
            v-model="customLinkForm.labels.sr"
            label="Српска ознака"
            density="compact"
            class="mb-2"
          />
          <v-text-field
            v-model="customLinkForm.labels.en"
            label="English label"
            density="compact"
            class="mb-2"
          />
          <v-text-field
            v-model="customLinkForm.to"
            label="Router path (pl. /about/example)"
            density="compact"
            class="mb-2"
          />
          <v-text-field
            v-model="customLinkForm.href"
            label="External URL (pl. https://...)"
            density="compact"
            hint="Router path VAGY External URL - nem mindketto"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="customLinkDialog = false">{{ $t('cancel') }}</v-btn>
          <v-btn color="primary" @click="saveCustomLink">{{ $t('save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Custom Group Dialog -->
    <v-dialog v-model="customGroupDialog" max-width="500">
      <v-card>
        <v-card-title>
          {{ editingCustomGroup ? $t('edit_group') : $t('add_new_group') }}
        </v-card-title>
        <v-card-text>
          <v-select
            v-model="customGroupForm.type"
            :items="groupTypeOptions"
            item-title="text"
            item-value="value"
            :label="$t('group_type')"
            density="compact"
            class="mb-2"
          />
          <v-text-field
            v-model="customGroupForm.labels.hu"
            label="Magyar megnevezes"
            density="compact"
            class="mb-2"
          />
          <v-text-field
            v-model="customGroupForm.labels.sr"
            label="Српски назив"
            density="compact"
            class="mb-2"
          />
          <v-text-field
            v-model="customGroupForm.labels.en"
            label="English name"
            density="compact"
            class="mb-2"
          />
          <v-text-field
            v-if="customGroupForm.type === 'direct-link'"
            v-model="customGroupForm.to"
            label="Router path (pl. /page/example)"
            density="compact"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="customGroupDialog = false">{{ $t('cancel') }}</v-btn>
          <v-btn color="primary" @click="saveCustomGroup">{{ $t('save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
  </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNotification } from '@kyvg/vue3-notification'
import draggable from 'vuedraggable'
import { menuConfigService } from '@/services/navigation/MenuConfigService'
import { DEFAULT_MENU_REGISTRY } from '@/services/navigation/MenuRegistry'
import type { MenuConfig, MenuGroupConfig, CustomLink, CustomGroup } from '@/types/MenuTypes'

interface EditableItem {
  id: string
  enabled: boolean
  order: number
  _label?: string
  _isCustom?: boolean
  _customLabels?: Record<string, string>
  _to?: string
  _href?: string
}

interface EditableGroup {
  id: string
  type: string
  enabled: boolean
  order: number
  items: EditableItem[]
  _isCustomGroup?: boolean
  _customLabels?: Record<string, string>
  _to?: string
}

export default defineComponent({
  name: 'MenuEditor',
  components: { draggable },
  setup() {
    const { t } = useI18n()
    const { notify } = useNotification()

    const loading = ref(true)
    const saving = ref(false)
    const resetting = ref(false)
    const groupDrag = ref(false)
    const itemDrag = ref(false)
    const hasChanges = ref(false)
    const editableGroups = ref<EditableGroup[]>([])
    const expandedGroups = ref<Set<string>>(new Set())
    const originalConfig = ref<MenuConfig | null>(null)

    // Custom link dialog
    const customLinkDialog = ref(false)
    const editingCustomLink = ref(false)
    const customLinkTargetGroup = ref('')
    const customLinkEditId = ref('')
    const customLinkForm = reactive({
      labels: { hu: '', sr: '', en: '' },
      to: '',
      href: ''
    })

    // Custom group dialog
    const customGroupDialog = ref(false)
    const editingCustomGroup = ref(false)
    const customGroupEditId = ref('')
    const customGroupForm = reactive({
      type: 'dropdown' as 'dropdown' | 'direct-link',
      labels: { hu: '', sr: '', en: '' },
      to: ''
    })

    const groupTypeOptions = [
      { text: 'Dropdown menu', value: 'dropdown' },
      { text: 'Kozvetlen link', value: 'direct-link' }
    ]

    const getGroupLabel = (group: EditableGroup) => {
      if (group._isCustomGroup && group._customLabels) {
        return group._customLabels.hu || group._customLabels.sr || group._customLabels.en || group.id
      }
      const regGroup = DEFAULT_MENU_REGISTRY.find(g => g.id === group.id)
      if (!regGroup) return group.id
      if (regGroup.labelKey) return t(regGroup.labelKey)
      if (regGroup.type === 'language-selector') return t('language')
      return group.id
    }

    const getItemLabel = (item: EditableItem) => {
      if (item._isCustom && item._customLabels) {
        return item._customLabels.hu || item._customLabels.sr || item._customLabels.en || item.id
      }
      if (item._label) return item._label

      for (const group of DEFAULT_MENU_REGISTRY) {
        const found = findItemInTree(group.items, item.id)
        if (found?.labelKey) return t(found.labelKey)
        if (found?.dynamicSource) return `[${found.dynamicSource}]`
      }
      return item.id
    }

    const findItemInTree = (items: any[], id: string): any | null => {
      for (const item of items) {
        if (item.id === id) return item
        if (item.children) {
          const found = findItemInTree(item.children, id)
          if (found) return found
        }
      }
      return null
    }

    const buildEditableGroups = (savedConfig: MenuConfig | null) => {
      const result: EditableGroup[] = []

      for (let i = 0; i < DEFAULT_MENU_REGISTRY.length; i++) {
        const regGroup = DEFAULT_MENU_REGISTRY[i]
        const savedGroup = savedConfig?.groups.find(g => g.id === regGroup.id)

        const items: EditableItem[] = regGroup.items.map((item, idx) => {
          const savedItem = savedGroup?.items?.find(si => si.id === item.id)
          return {
            id: item.id,
            enabled: savedItem ? savedItem.enabled : true,
            order: savedItem ? savedItem.order : idx
          }
        })

        const groupCustomLinks = (savedConfig?.customLinks || [])
          .filter(cl => cl.parentGroupId === regGroup.id)
        for (const cl of groupCustomLinks) {
          items.push({
            id: cl.id,
            enabled: cl.enabled,
            order: cl.order,
            _isCustom: true,
            _customLabels: cl.labels,
            _to: cl.to,
            _href: cl.href
          })
        }

        items.sort((a, b) => a.order - b.order)

        result.push({
          id: regGroup.id,
          type: regGroup.type,
          enabled: savedGroup ? savedGroup.enabled : true,
          order: savedGroup ? savedGroup.order : i,
          items
        })
      }

      // Add custom groups
      if (savedConfig?.customGroups) {
        for (const cg of savedConfig.customGroups) {
          const items: EditableItem[] = [...cg.items]
            .sort((a, b) => a.order - b.order)
            .map(cl => ({
              id: cl.id,
              enabled: cl.enabled,
              order: cl.order,
              _isCustom: true,
              _customLabels: cl.labels,
              _to: cl.to,
              _href: cl.href
            }))

          result.push({
            id: cg.id,
            type: cg.type,
            enabled: cg.enabled,
            order: cg.order,
            items,
            _isCustomGroup: true,
            _customLabels: cg.labels,
            _to: cg.to
          })
        }
      }

      result.sort((a, b) => a.order - b.order)
      return result
    }

    const buildConfigFromEditable = (): MenuConfig => {
      const groups: MenuGroupConfig[] = []
      const allCustomLinks: CustomLink[] = []
      const allCustomGroups: CustomGroup[] = []

      for (let groupIdx = 0; groupIdx < editableGroups.value.length; groupIdx++) {
        const group = editableGroups.value[groupIdx]

        if (group._isCustomGroup) {
          const cgItems: CustomLink[] = group.items.map((item, idx) => ({
            id: item.id,
            labels: item._customLabels || {},
            to: item._to,
            href: item._href,
            parentGroupId: group.id,
            order: idx,
            enabled: item.enabled
          }))

          allCustomGroups.push({
            id: group.id,
            type: group.type as 'dropdown' | 'direct-link',
            labels: group._customLabels || {},
            to: group._to,
            order: groupIdx,
            enabled: group.enabled,
            items: cgItems
          })
        } else {
          groups.push({
            id: group.id,
            enabled: group.enabled,
            order: groupIdx,
            items: group.items
              .filter(item => !item._isCustom)
              .map((item, itemIdx) => ({
                id: item.id,
                enabled: item.enabled,
                order: itemIdx
              }))
          })

          for (let idx = 0; idx < group.items.length; idx++) {
            const item = group.items[idx]
            if (item._isCustom) {
              allCustomLinks.push({
                id: item.id,
                labels: item._customLabels || {},
                to: item._to,
                href: item._href,
                parentGroupId: group.id,
                order: idx,
                enabled: item.enabled
              })
            }
          }
        }
      }

      return {
        version: 1,
        groups,
        customLinks: allCustomLinks,
        customGroups: allCustomGroups
      }
    }

    const loadConfig = async () => {
      loading.value = true
      try {
        const savedConfig = await menuConfigService.loadMenuConfig()
        originalConfig.value = savedConfig
        editableGroups.value = buildEditableGroups(savedConfig)
      } catch (err) {
        console.error('Failed to load menu config:', err)
        editableGroups.value = buildEditableGroups(null)
      } finally {
        loading.value = false
      }
    }

    const saveConfig = async () => {
      saving.value = true
      try {
        const config = buildConfigFromEditable()
        await menuConfigService.saveMenuConfig(config)
        originalConfig.value = config
        hasChanges.value = false
        notify({ type: 'success', title: t('menu_saved') })
      } catch (err) {
        console.error('Failed to save menu config:', err)
        notify({ type: 'error', title: t('error_occurred') })
      } finally {
        saving.value = false
      }
    }

    const resetToDefaults = async () => {
      resetting.value = true
      try {
        await menuConfigService.deleteMenuConfig()
        editableGroups.value = buildEditableGroups(null)
        originalConfig.value = null
        hasChanges.value = false
        notify({ type: 'success', title: t('menu_reset') })
      } catch (err) {
        console.error('Failed to reset menu config:', err)
        notify({ type: 'error', title: t('error_occurred') })
      } finally {
        resetting.value = false
      }
    }

    const toggleGroupExpand = (groupId: string) => {
      const newSet = new Set(expandedGroups.value)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      expandedGroups.value = newSet
    }

    const onGroupDragEnd = () => {
      groupDrag.value = false
      hasChanges.value = true
    }

    const onItemDragEnd = () => {
      itemDrag.value = false
      hasChanges.value = true
    }

    // --- Custom link management ---
    const openAddCustomLink = (groupId: string) => {
      customLinkTargetGroup.value = groupId
      editingCustomLink.value = false
      customLinkEditId.value = ''
      customLinkForm.labels = { hu: '', sr: '', en: '' }
      customLinkForm.to = ''
      customLinkForm.href = ''
      customLinkDialog.value = true
    }

    const editCustomLink = (groupId: string, item: EditableItem) => {
      customLinkTargetGroup.value = groupId
      editingCustomLink.value = true
      customLinkEditId.value = item.id
      customLinkForm.labels = { ...(item._customLabels || { hu: '', sr: '', en: '' }) }
      customLinkForm.to = item._to || ''
      customLinkForm.href = item._href || ''
      customLinkDialog.value = true
    }

    const saveCustomLink = () => {
      const group = editableGroups.value.find(g => g.id === customLinkTargetGroup.value)
      if (!group) return

      if (editingCustomLink.value) {
        const item = group.items.find(i => i.id === customLinkEditId.value)
        if (item) {
          item._customLabels = { ...customLinkForm.labels }
          item._to = customLinkForm.to || undefined
          item._href = customLinkForm.href || undefined
        }
      } else {
        group.items.push({
          id: 'custom_' + Date.now(),
          enabled: true,
          order: group.items.length,
          _isCustom: true,
          _customLabels: { ...customLinkForm.labels },
          _to: customLinkForm.to || undefined,
          _href: customLinkForm.href || undefined
        })
      }

      hasChanges.value = true
      customLinkDialog.value = false
    }

    const removeCustomLink = (groupId: string, itemId: string) => {
      const group = editableGroups.value.find(g => g.id === groupId)
      if (!group) return
      group.items = group.items.filter(i => i.id !== itemId)
      hasChanges.value = true
    }

    // --- Custom group management ---
    const openAddCustomGroup = () => {
      editingCustomGroup.value = false
      customGroupEditId.value = ''
      customGroupForm.type = 'dropdown'
      customGroupForm.labels = { hu: '', sr: '', en: '' }
      customGroupForm.to = ''
      customGroupDialog.value = true
    }

    const editCustomGroup = (group: EditableGroup) => {
      editingCustomGroup.value = true
      customGroupEditId.value = group.id
      customGroupForm.type = group.type as 'dropdown' | 'direct-link'
      customGroupForm.labels = { ...(group._customLabels || { hu: '', sr: '', en: '' }) }
      customGroupForm.to = group._to || ''
      customGroupDialog.value = true
    }

    const saveCustomGroup = () => {
      if (editingCustomGroup.value) {
        const group = editableGroups.value.find(g => g.id === customGroupEditId.value)
        if (group) {
          group.type = customGroupForm.type
          group._customLabels = { ...customGroupForm.labels }
          group._to = customGroupForm.to || undefined
        }
      } else {
        editableGroups.value.push({
          id: 'cg_' + Date.now(),
          type: customGroupForm.type,
          enabled: true,
          order: editableGroups.value.length,
          items: [],
          _isCustomGroup: true,
          _customLabels: { ...customGroupForm.labels },
          _to: customGroupForm.to || undefined
        })
      }

      hasChanges.value = true
      customGroupDialog.value = false
    }

    const removeCustomGroup = (groupId: string) => {
      editableGroups.value = editableGroups.value.filter(g => g.id !== groupId)
      hasChanges.value = true
    }

    // Preview
    const previewGroups = computed(() => {
      return editableGroups.value
        .filter(g => g.enabled)
        .map(g => ({
          id: g.id,
          type: g.type,
          label: getGroupLabel(g),
          items: g.items
            .filter(i => i.enabled)
            .map(i => ({
              id: i.id,
              label: getItemLabel(i)
            }))
        }))
    })

    onMounted(loadConfig)

    return {
      loading,
      saving,
      resetting,
      groupDrag,
      itemDrag,
      hasChanges,
      editableGroups,
      expandedGroups,
      previewGroups,
      customLinkDialog,
      editingCustomLink,
      customLinkForm,
      customGroupDialog,
      editingCustomGroup,
      customGroupForm,
      groupTypeOptions,
      getGroupLabel,
      getItemLabel,
      toggleGroupExpand,
      onGroupDragEnd,
      onItemDragEnd,
      saveConfig,
      resetToDefaults,
      openAddCustomLink,
      editCustomLink,
      saveCustomLink,
      removeCustomLink,
      openAddCustomGroup,
      editCustomGroup,
      saveCustomGroup,
      removeCustomGroup
    }
  }
})
</script>

<style scoped>
.sticky-preview {
  position: sticky;
  top: 120px;
}

.item-row {
  background: rgba(0, 0, 0, 0.02);
}

.item-row:hover {
  background: rgba(0, 0, 0, 0.05);
}

.dark .item-row {
  background: rgba(255, 255, 255, 0.02);
}

.dark .item-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.cursor-move {
  cursor: move;
}

.custom-group-card {
  border-left: 3px solid rgb(var(--v-theme-success));
}
</style>
