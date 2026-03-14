<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="440" persistent>
    <v-card class="dc-add-contact-card">
      <v-card-title class="dc-add-contact-title">
        <v-icon class="mr-2">mdi-account-plus</v-icon>
        {{ $t('dc_dm_add_contact') }}
      </v-card-title>

      <v-card-text class="dc-add-contact-body">
        <v-text-field
          v-model="searchQuery"
          :placeholder="$t('dc_dm_search_placeholder')"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-magnify"
          class="dc-add-contact-search"
          @input="onSearch"
          autofocus
        />

        <div class="dc-add-contact-results">
          <div v-if="loading" class="dc-add-contact-loading">
            <v-progress-circular size="24" indeterminate color="#5865f2" />
          </div>

          <div v-else-if="results.length === 0 && searchQuery.length >= 2" class="dc-add-contact-empty">
            {{ $t('dc_dm_no_users_found') }}
          </div>

          <div
            v-for="user in results"
            :key="user.$id"
            class="dc-add-contact-item"
            @click="selectUser(user)"
          >
            <div class="dc-add-contact-avatar" :style="{ backgroundColor: getColor(user) }">
              {{ user.nickname.charAt(0).toUpperCase() }}
            </div>
            <div class="dc-add-contact-info">
              <div class="dc-add-contact-name">{{ user.nickname }}</div>
              <div class="dc-add-contact-role">{{ user.role || 'member' }}</div>
            </div>
            <v-icon v-if="isAlreadyContact(user)" color="#23a559" size="20">mdi-check-circle</v-icon>
            <v-icon v-else size="20" color="#b5bac1">mdi-plus-circle-outline</v-icon>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="dc-add-contact-actions">
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">{{ $t('dc_dm_cancel') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { DcUser } from '@/services/DcChatService'
import { DC_ROLES, type DcRoleType } from '@/services/DcChatService'
import type { DcContact } from '@/types/DcDmTypes'

const props = defineProps<{
  modelValue: boolean
  contacts: DcContact[]
  searchFn: (query: string) => Promise<DcUser[]>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'add-contact': [user: DcUser]
}>()

const searchQuery = ref('')
const results = ref<DcUser[]>([])
const loading = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (searchQuery.value.length < 2) {
    results.value = []
    return
  }
  loading.value = true
  searchTimeout = setTimeout(async () => {
    results.value = await props.searchFn(searchQuery.value)
    loading.value = false
  }, 300)
}

function selectUser(user: DcUser) {
  if (isAlreadyContact(user)) return
  emit('add-contact', user)
}

function isAlreadyContact(user: DcUser): boolean {
  return props.contacts.some(c => c.contact_id === user.$id)
}

function getColor(user: DcUser): string {
  const role = (user.role || 'member') as DcRoleType
  return DC_ROLES[role]?.color || '#5865f2'
}
</script>

<style scoped>
.dc-add-contact-card {
  background: #2b2d31 !important;
  color: #dbdee1 !important;
  border-radius: 8px !important;
}

.dc-add-contact-title {
  background: #1e1f22;
  padding: 16px !important;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.dc-add-contact-body {
  padding: 16px !important;
}

.dc-add-contact-search {
  margin-bottom: 12px;
}

.dc-add-contact-search :deep(.v-field) {
  background: #1e1f22;
  color: #dbdee1;
}

.dc-add-contact-results {
  max-height: 300px;
  overflow-y: auto;
}

.dc-add-contact-loading,
.dc-add-contact-empty {
  padding: 24px;
  text-align: center;
  color: #949ba4;
  font-size: 14px;
}

.dc-add-contact-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  gap: 12px;
}

.dc-add-contact-item:hover {
  background: #35373c;
}

.dc-add-contact-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: white;
  flex-shrink: 0;
}

.dc-add-contact-info {
  flex: 1;
  min-width: 0;
}

.dc-add-contact-name {
  font-size: 14px;
  font-weight: 500;
  color: #dbdee1;
}

.dc-add-contact-role {
  font-size: 12px;
  color: #949ba4;
}

.dc-add-contact-actions {
  background: #1e1f22;
  padding: 12px 16px !important;
}
</style>
