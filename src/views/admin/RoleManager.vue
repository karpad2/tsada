<template>
  <v-container class="py-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-6">
          <v-icon size="32" color="primary" class="mr-3">mdi-shield-account</v-icon>
          <h1 class="text-h4 font-weight-bold text-black">{{ $t('role_manager') }}</h1>
        </div>
      </v-col>
    </v-row>

    <!-- Error Alert -->
    <v-row v-if="errorMessage">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" closable @click:close="errorMessage = ''">
          {{ errorMessage }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Success Alert -->
    <v-row v-if="successMessage">
      <v-col cols="12">
        <v-alert type="success" variant="tonal" closable @click:close="successMessage = ''">
          {{ successMessage }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Add New Role Section -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-plus-circle</v-icon>
            {{ $t('add_new_role') }}
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="newRoleUserId"
                  :label="$t('user_id')"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-account"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="newRoleType"
                  :label="$t('select_role')"
                  :items="roleOptions"
                  item-title="label"
                  item-value="value"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-shield"
                ></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-if="newRoleType === 'teacher'"
                  v-model="newRoleClasses"
                  :label="$t('select_classes')"
                  :items="availableClasses"
                  item-title="displayName"
                  item-value="$id"
                  variant="outlined"
                  density="compact"
                  multiple
                  chips
                  prepend-inner-icon="mdi-school"
                ></v-select>
              </v-col>
              <v-col cols="12" md="2" class="d-flex align-center">
                <v-btn
                  color="primary"
                  :loading="isSaving"
                  :disabled="!newRoleUserId || !newRoleType"
                  @click="saveNewRole"
                  block
                >
                  <v-icon left>mdi-content-save</v-icon>
                  {{ $t('save_role') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Existing Roles Table -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-account-group</v-icon>
            {{ $t('roles') }}
            <v-spacer></v-spacer>
            <v-btn icon size="small" @click="loadRoles" :loading="isLoading">
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
              v-if="userRoles.length > 0"
              :headers="tableHeaders"
              :items="userRoles"
              :loading="isLoading"
              density="comfortable"
              class="elevation-0"
            >
              <template #item.role="{ item }">
                <v-chip
                  :color="getRoleColor(item.role)"
                  size="small"
                  label
                >
                  {{ $t(item.role) }}
                </v-chip>
              </template>

              <template #item.assigned_classes="{ item }">
                <div v-if="item.assigned_classes && item.assigned_classes.length > 0">
                  <v-chip
                    v-for="classId in item.assigned_classes"
                    :key="classId"
                    size="x-small"
                    class="mr-1 mb-1"
                    color="info"
                  >
                    {{ getClassName(classId) }}
                  </v-chip>
                </div>
                <span v-else class="text-grey">-</span>
              </template>

              <template #item.created_at="{ item }">
                {{ formatDate(item.created_at) }}
              </template>

              <template #item.actions="{ item }">
                <v-btn
                  icon
                  size="small"
                  color="primary"
                  variant="text"
                  @click="editRole(item)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  color="error"
                  variant="text"
                  @click="confirmDeleteRole(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>

            <div v-else-if="!isLoading" class="text-center py-8 text-grey">
              <v-icon size="48" class="mb-2">mdi-account-off</v-icon>
              <p>{{ $t('no_users_with_roles') }}</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Edit Role Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-pencil</v-icon>
          {{ $t('assign_role') }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editingRole.user_id"
            :label="$t('user_id')"
            variant="outlined"
            density="compact"
            disabled
            class="mb-3"
          ></v-text-field>

          <v-select
            v-model="editingRole.role"
            :label="$t('select_role')"
            :items="roleOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="compact"
            class="mb-3"
          ></v-select>

          <v-select
            v-if="editingRole.role === 'teacher'"
            v-model="editingRole.assigned_classes"
            :label="$t('select_classes')"
            :items="availableClasses"
            item-title="displayName"
            item-value="$id"
            variant="outlined"
            density="compact"
            multiple
            chips
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showEditDialog = false">{{ $t('cancel') }}</v-btn>
          <v-btn color="primary" :loading="isSaving" @click="updateRole">
            {{ $t('save_role') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="mr-2" color="error">mdi-alert</v-icon>
          {{ $t('remove_role') }}
        </v-card-title>
        <v-card-text>
          {{ $t('confirm_remove_role') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteDialog = false">{{ $t('cancel') }}</v-btn>
          <v-btn color="error" :loading="isDeleting" @click="deleteRole">
            {{ $t('remove_role') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { Databases, Query } from 'appwrite';
import { appw, config } from '@/appwrite';
import { RoleService, type UserRole, type UserRoleDocument } from '@/services/RoleService';
import { useLoadingStore } from '@/stores/loading';
import { useI18n } from 'vue-i18n';

interface ClassItem {
  $id: string;
  displayName: string;
}

export default defineComponent({
  name: 'RoleManager',
  setup() {
    const { t } = useI18n();
    const databases = new Databases(appw);
    const roleService = RoleService.getInstance();
    const loadingStore = useLoadingStore();

    // State
    const userRoles = ref<UserRoleDocument[]>([]);
    const availableClasses = ref<ClassItem[]>([]);
    const isLoading = ref(false);
    const isSaving = ref(false);
    const isDeleting = ref(false);
    const errorMessage = ref('');
    const successMessage = ref('');

    // New role form
    const newRoleUserId = ref('');
    const newRoleType = ref<UserRole | ''>('');
    const newRoleClasses = ref<string[]>([]);

    // Edit dialog
    const showEditDialog = ref(false);
    const editingRole = ref<UserRoleDocument>({
      user_id: '',
      role: 'editor',
      assigned_classes: []
    });

    // Delete dialog
    const showDeleteDialog = ref(false);
    const deletingRole = ref<UserRoleDocument | null>(null);

    const roleOptions = computed(() => [
      { label: t('admin'), value: 'admin' },
      { label: t('editor'), value: 'editor' },
      { label: t('teacher'), value: 'teacher' },
      { label: t('photographer'), value: 'photographer' }
    ]);

    const tableHeaders = computed(() => [
      { title: t('user_id'), key: 'user_id', sortable: true },
      { title: t('role'), key: 'role', sortable: true },
      { title: t('assigned_classes'), key: 'assigned_classes', sortable: false },
      { title: t('assigned_by'), key: 'assigned_by', sortable: true },
      { title: t('created_at'), key: 'created_at', sortable: true },
      { title: '', key: 'actions', sortable: false, align: 'end' as const }
    ]);

    const getRoleColor = (role: string) => {
      switch (role) {
        case 'admin': return 'error';
        case 'editor': return 'warning';
        case 'teacher': return 'info';
        case 'photographer': return 'success';
        default: return 'grey';
      }
    };

    const getClassName = (classId: string) => {
      const cls = availableClasses.value.find(c => c.$id === classId);
      return cls?.displayName || classId;
    };

    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      try {
        return new Date(dateStr).toLocaleDateString('hu-HU', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch {
        return dateStr;
      }
    };

    const loadRoles = async () => {
      isLoading.value = true;
      errorMessage.value = '';

      try {
        const roles = await roleService.getAllUserRoles();
        userRoles.value = roles;
      } catch (error: any) {
        console.error('Error loading roles:', error);
        errorMessage.value = t('error_loading_roles');
      } finally {
        isLoading.value = false;
      }
    };

    const loadClasses = async () => {
      try {
        const result = await databases.listDocuments(
          config.website_db,
          config.classlist,
          [Query.limit(100), Query.orderAsc('year')]
        );

        availableClasses.value = result.documents.map((doc: any) => ({
          $id: doc.$id,
          displayName: `${doc.year}/${doc.designation}`
        }));
      } catch (error) {
        console.error('Error loading classes:', error);
      }
    };

    const saveNewRole = async () => {
      if (!newRoleUserId.value || !newRoleType.value) return;

      isSaving.value = true;
      errorMessage.value = '';

      try {
        const success = await roleService.setUserRole(
          newRoleUserId.value,
          newRoleType.value as UserRole,
          loadingStore.uid,
          newRoleType.value === 'teacher' ? newRoleClasses.value : undefined
        );

        if (success) {
          successMessage.value = t('role_saved_successfully');
          newRoleUserId.value = '';
          newRoleType.value = '';
          newRoleClasses.value = [];
          await loadRoles();
        } else {
          errorMessage.value = t('error_saving_role');
        }
      } catch (error: any) {
        console.error('Error saving role:', error);
        errorMessage.value = t('error_saving_role');
      } finally {
        isSaving.value = false;
      }
    };

    const editRole = (role: UserRoleDocument) => {
      editingRole.value = { ...role };
      showEditDialog.value = true;
    };

    const updateRole = async () => {
      isSaving.value = true;
      errorMessage.value = '';

      try {
        const success = await roleService.setUserRole(
          editingRole.value.user_id,
          editingRole.value.role,
          loadingStore.uid,
          editingRole.value.role === 'teacher' ? editingRole.value.assigned_classes : undefined
        );

        if (success) {
          successMessage.value = t('role_saved_successfully');
          showEditDialog.value = false;
          await loadRoles();
        } else {
          errorMessage.value = t('error_saving_role');
        }
      } catch (error: any) {
        console.error('Error updating role:', error);
        errorMessage.value = t('error_saving_role');
      } finally {
        isSaving.value = false;
      }
    };

    const confirmDeleteRole = (role: UserRoleDocument) => {
      deletingRole.value = role;
      showDeleteDialog.value = true;
    };

    const deleteRole = async () => {
      if (!deletingRole.value) return;

      isDeleting.value = true;
      errorMessage.value = '';

      try {
        const success = await roleService.removeUserRole(deletingRole.value.user_id);

        if (success) {
          successMessage.value = t('role_removed_successfully');
          showDeleteDialog.value = false;
          deletingRole.value = null;
          await loadRoles();
        } else {
          errorMessage.value = t('error_removing_role');
        }
      } catch (error: any) {
        console.error('Error deleting role:', error);
        errorMessage.value = t('error_removing_role');
      } finally {
        isDeleting.value = false;
      }
    };

    onMounted(() => {
      loadRoles();
      loadClasses();
    });

    return {
      // State
      userRoles,
      availableClasses,
      isLoading,
      isSaving,
      isDeleting,
      errorMessage,
      successMessage,

      // New role
      newRoleUserId,
      newRoleType,
      newRoleClasses,

      // Edit
      showEditDialog,
      editingRole,

      // Delete
      showDeleteDialog,
      deletingRole,

      // Computed
      roleOptions,
      tableHeaders,

      // Methods
      getRoleColor,
      getClassName,
      formatDate,
      loadRoles,
      saveNewRole,
      editRole,
      updateRole,
      confirmDeleteRole,
      deleteRole
    };
  }
});
</script>
