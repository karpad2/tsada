<template>
  <div class="dc-members">
    <div class="dc-members-header">{{ $t('dc_members') }} — {{ displayedMembers.length }}</div>
    <!-- For custom servers, show server members -->
    <template v-if="currentServer">
      <div v-for="member in serverMembers" :key="member.$id" class="dc-member">
        <v-icon size="16" class="mr-2" :color="DC_ROLES[member.role]?.color || 'grey'">
          {{ DC_ROLES[member.role]?.icon || 'mdi-account' }}
        </v-icon>
        <span :style="{ color: DC_ROLES[member.role]?.color || '#b5bac1' }">
          {{ member.nickname }}
        </span>
        <span class="dc-member-role-tag ml-auto" :style="{ color: DC_ROLES[member.role]?.color }">
          {{ $t('dc_role_' + member.role) }}
        </span>
      </div>
    </template>
    <!-- For default server, show all users grouped by role -->
    <template v-else>
      <template v-for="roleKey in roleOrder" :key="roleKey">
        <div v-if="getMembersByRole(roleKey).length > 0">
          <div class="dc-members-role-header" :style="{ color: DC_ROLES[roleKey]?.color }">
            <v-icon size="12" class="mr-1">{{ DC_ROLES[roleKey]?.icon }}</v-icon>
            {{ $t('dc_role_' + roleKey) }} — {{ getMembersByRole(roleKey).length }}
          </div>
          <div v-for="user in getMembersByRole(roleKey)" :key="user.nickname" class="dc-member">
            <v-icon size="16" class="mr-2" :color="isUserOnline(user) ? DC_ROLES[roleKey]?.color : 'grey'">
              {{ isUserOnline(user) ? 'mdi-circle' : 'mdi-circle-outline' }}
            </v-icon>
            <span :style="{ color: DC_ROLES[roleKey]?.color, opacity: isUserOnline(user) ? 1 : 0.5 }">
              {{ user.nickname }}
            </span>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  DC_ROLES,
  type DcUser,
  type DcRoleType,
  type DcServer,
  type DcServerMember
} from '@/services/DcChatService'

const props = defineProps<{
  allUsers: DcUser[]
  serverMembers: DcServerMember[]
  currentServer: DcServer | null
}>()

const roleOrder: DcRoleType[] = ['owner', 'admin', 'moderator', 'vip', 'trusted', 'member']

const displayedMembers = computed(() => {
  if (props.currentServer) return props.serverMembers
  return props.allUsers
})

function getMembersByRole(roleKey: string): DcUser[] {
  return props.allUsers.filter(user => (user.role || 'member') === roleKey)
}

function isUserOnline(user: DcUser): boolean {
  if (!user.lastSeen) return false
  const lastSeen = new Date(user.lastSeen)
  const now = new Date()
  const diff = now.getTime() - lastSeen.getTime()
  return diff < 5 * 60 * 1000
}
</script>

<style scoped>
.dc-members {
  width: 240px;
  background: #2b2d31;
  padding: 16px;
  color: #949ba4;
  overflow-y: auto;
  flex-shrink: 0;
}

.dc-members-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.dc-members-role-header {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  margin: 12px 0 4px;
  display: flex;
  align-items: center;
}

.dc-member {
  display: flex;
  align-items: center;
  padding: 4px 0;
  font-size: 14px;
  color: #b5bac1;
}

.dc-member-role-tag {
  font-size: 10px;
  opacity: 0.7;
}

@media (max-width: 960px) {
  .dc-members {
    display: none;
  }
}
</style>
