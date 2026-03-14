<template>
  <div class="dc-server-bar">
    <!-- DM Button -->
    <div
      class="dc-server-icon"
      :class="{ active: dmActive }"
      :title="$t('dc_dm_title')"
      @click="emit('select-dm')"
    >
      <v-icon size="24">mdi-message-text</v-icon>
      <div v-if="dmUnreadCount > 0" class="dc-server-badge">{{ dmUnreadCount > 99 ? '99+' : dmUnreadCount }}</div>
    </div>
    <div class="dc-server-divider"></div>
    <!-- Default "Iskola" server -->
    <div
      class="dc-server-icon"
      :class="{ active: !currentServerId && !dmActive }"
      :title="$t('dc_default_server')"
      @click="emit('select-default')"
    >
      <v-icon size="24">mdi-school</v-icon>
    </div>
    <div class="dc-server-divider"></div>
    <!-- User's servers -->
    <div
      v-for="srv in servers"
      :key="srv.$id"
      class="dc-server-icon"
      :class="{ active: currentServerId === srv.$id }"
      :title="srv.name"
      @click="emit('select-server', srv)"
    >
      <span v-if="srv.icon && !srv.icon.startsWith('mdi-')" class="dc-server-emoji">{{ srv.icon }}</span>
      <v-icon v-else size="24">{{ srv.icon || 'mdi-server' }}</v-icon>
    </div>
    <!-- Add Server -->
    <div class="dc-server-icon dc-server-add" @click="emit('create-server')" :title="$t('dc_create_server')">
      <v-icon size="24" color="green">mdi-plus</v-icon>
    </div>
    <!-- Join Server -->
    <div class="dc-server-icon dc-server-add" @click="emit('join-server')" :title="$t('dc_join_server')">
      <v-icon size="24" color="blue">mdi-login</v-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DcServer } from '@/services/DcChatService'

defineProps<{
  servers: DcServer[]
  currentServerId: string | null
  dmActive?: boolean
  dmUnreadCount?: number
}>()

const emit = defineEmits<{
  'select-server': [server: DcServer]
  'select-default': []
  'create-server': []
  'join-server': []
  'select-dm': []
}>()
</script>

<style scoped>
.dc-server-bar {
  width: 72px;
  background: #1e1f22;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 8px;
  overflow-y: auto;
  flex-shrink: 0;
}

.dc-server-icon {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: #313338;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #b5bac1;
  position: relative;
}

.dc-server-icon:hover {
  border-radius: 16px;
  background: #5865f2;
  color: white;
}

.dc-server-icon.active {
  border-radius: 16px;
  background: #5865f2;
  color: white;
}

.dc-server-add {
  background: #2b2d31;
}

.dc-server-add:hover {
  background: #3ba55d;
}

.dc-server-emoji {
  font-size: 22px;
}

.dc-server-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: #ed4245;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
  line-height: 14px;
}

.dc-server-divider {
  width: 32px;
  height: 2px;
  background: #35373c;
  border-radius: 1px;
}

@media (max-width: 960px) {
  .dc-server-bar {
    width: 50px;
  }
  .dc-server-icon {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 600px) {
  .dc-server-bar {
    width: 42px;
  }
  .dc-server-icon {
    width: 36px;
    height: 36px;
  }
}
</style>
