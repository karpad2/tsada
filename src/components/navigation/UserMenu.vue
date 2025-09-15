<template>
  <div v-if="isAuthenticated" class="user-menu">
    <div class="dropdown dropdown-hover dropdown-end">
      <div
        tabindex="0"
        role="button"
        class="btn btn-ghost btn-circle avatar"
        :title="$t('user_menu')"
        @click="onUserMenuClick"
      >
        <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <i class="pi pi-user text-primary"></i>
        </div>
      </div>

      <ul
        tabindex="0"
        class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
      >
        <!-- Admin Panel Link -->
        <li>
          <router-link
            to="/admin"
            class="flex items-center gap-3"
            @click="onAdminClick"
          >
            <i class="pi pi-cog"></i>
            <span>{{ $t('admin_panel') }}</span>
          </router-link>
        </li>

        <!-- Profile Link (if implemented) -->
        <li v-if="showProfile">
          <router-link
            to="/profile"
            class="flex items-center gap-3"
            @click="onProfileClick"
          >
            <i class="pi pi-user"></i>
            <span>{{ $t('profile') }}</span>
          </router-link>
        </li>

        <!-- Settings Link (if implemented) -->
        <li v-if="showSettings">
          <router-link
            to="/settings"
            class="flex items-center gap-3"
            @click="onSettingsClick"
          >
            <i class="pi pi-sliders-h"></i>
            <span>{{ $t('settings') }}</span>
          </router-link>
        </li>

        <li><hr class="my-1" /></li>

        <!-- Logout -->
        <li>
          <a
            @click="handleLogout"
            class="flex items-center gap-3 text-error hover:bg-error/10"
          >
            <i class="pi pi-sign-out"></i>
            <span>{{ $t('logout') }}</span>
          </a>
        </li>
      </ul>
    </div>
  </div>

  <!-- Login button for non-authenticated users -->
  <div v-else class="login-section">
    <router-link
      to="/login"
      class="btn btn-primary btn-sm"
      @click="onLoginClick"
    >
      <i class="pi pi-sign-in mr-2"></i>
      {{ $t('login') }}
    </router-link>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { trackUserInteraction, trackError } from '@/utils/analytics'

export default defineComponent({
  name: 'UserMenu',
  props: {
    isAuthenticated: {
      type: Boolean,
      default: false
    },
    userName: {
      type: String,
      default: ''
    },
    userEmail: {
      type: String,
      default: ''
    },
    showProfile: {
      type: Boolean,
      default: false
    },
    showSettings: {
      type: Boolean,
      default: false
    }
  },
  emits: ['logout'],
  methods: {
    onUserMenuClick() {
      trackUserInteraction('user_menu_open', 'auth', {
        user_email: this.userEmail
      })
    },

    onAdminClick() {
      trackUserInteraction('admin_panel_access', 'admin', {
        user_email: this.userEmail
      })
    },

    onProfileClick() {
      trackUserInteraction('profile_access', 'user', {
        user_email: this.userEmail
      })
    },

    onSettingsClick() {
      trackUserInteraction('settings_access', 'user', {
        user_email: this.userEmail
      })
    },

    onLoginClick() {
      trackUserInteraction('login_button_click', 'auth', {})
    },

    async handleLogout() {
      try {
        trackUserInteraction('logout_initiated', 'auth', {
          user_email: this.userEmail
        })

        this.$emit('logout')
      } catch (error: any) {
        console.error('Error during logout:', error)
        trackError('logout_error', error, {
          user_email: this.userEmail
        })
      }
    }
  }
})
</script>

<style scoped>
.user-menu .avatar {
  transition: all 0.2s ease;
}

.user-menu .avatar:hover {
  transform: scale(1.05);
}

.user-menu .dropdown-content {
  min-width: 200px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.login-section .btn {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}

.user-menu .dropdown-content li a:hover {
  transition: all 0.2s ease;
}

.user-menu .dropdown-content hr {
  border-color: rgba(0, 0, 0, 0.1);
}
</style>