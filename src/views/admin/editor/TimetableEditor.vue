<template>
  <section class="page-shell py-4">
    <div class="page-panel container">

      <!-- Header -->
      <div class="page-header-row">
        <div>
          <div class="inline-flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-400 rounded-full flex items-center justify-center shadow-lg shadow-sky-500/25">
              <i class="pi pi-calendar text-white text-lg"></i>
            </div>
            <h1 class="section-title !mb-0 !text-2xl">{{ $t("tt_editor") }}</h1>
          </div>
          <div class="section-accent"></div>
        </div>
      </div>

      <!-- Schedule configs list -->
      <div class="glass rounded-2xl p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="page-section-title !mb-0">{{ $t("tt_schedule_name") }}</h2>
          <button @click="showCreateConfig = true"
            class="glass-btn px-4 py-2 text-white rounded-full font-medium text-sm">
            <i class="pi pi-plus mr-1"></i> {{ $t("tt_add_schedule") }}
          </button>
        </div>

        <div v-if="loading" class="text-center py-8">
          <i class="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
        </div>

        <div v-else class="space-y-3">
          <div v-for="cfg in configs" :key="cfg.$id"
            class="flex items-center justify-between p-4 rounded-xl border transition-all"
            :class="cfg.is_active ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700' : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50'">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-gray-800 dark:text-white">{{ cfg.name }}</span>
                <span v-if="cfg.is_active" class="px-2 py-0.5 bg-green-500 text-white rounded-full text-xs font-medium">
                  {{ $t("tt_active_schedule") }}
                </span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ $t("tt_valid_from") }}: {{ cfg.valid_from }}
              </p>
            </div>
            <div class="flex gap-2">
              <button v-if="!cfg.is_active" @click="activateConfig(cfg)"
                class="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition">
                <i class="pi pi-check mr-1"></i> {{ $t("tt_active_schedule") }}
              </button>
              <button @click="editConfig(cfg)"
                class="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">
                <i class="pi pi-pencil mr-1"></i> {{ $t("tt_edit_schedule") }}
              </button>
              <button @click="deleteConfig(cfg)"
                class="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition">
                <i class="pi pi-trash mr-1"></i>
              </button>
            </div>
          </div>

          <div v-if="configs.length === 0" class="text-center py-8 text-gray-400">
            {{ $t("tt_no_schedule") }}
          </div>
        </div>
      </div>

      <!-- Create config modal -->
      <div v-if="showCreateConfig" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showCreateConfig = false">
        <div class="glass-strong rounded-2xl p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-bold mb-4 text-gray-800 dark:text-white">{{ $t("tt_add_schedule") }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t("tt_schedule_name") }}</label>
              <input v-model="newConfig.name" type="text"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                placeholder="2025/26 I. félév">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t("tt_valid_from") }}</label>
              <input v-model="newConfig.valid_from" type="date"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="flex gap-3 justify-end">
              <button @click="showCreateConfig = false" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 transition">
                {{ $t("cancel") }}
              </button>
              <button @click="createConfig" :disabled="!newConfig.name || !newConfig.valid_from"
                class="px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-400 text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50">
                {{ $t("tt_save") }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Class schedule editor (shown when editing a config) -->
      <div v-if="editingConfig" class="glass rounded-2xl p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white">{{ editingConfig.name }}</h2>
            <p class="text-sm text-gray-500">{{ $t("tt_valid_from") }}: {{ editingConfig.valid_from }}</p>
          </div>
          <button @click="editingConfig = null" class="text-gray-500 hover:text-gray-700 transition">
            <i class="pi pi-times text-xl"></i>
          </button>
        </div>

        <!-- Class list for this config -->
        <div class="flex flex-wrap gap-3 mb-6">
          <button @click="addClassSchedule"
            class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
            <i class="pi pi-plus mr-1"></i> {{ $t("tt_add_class") }}
          </button>
        </div>

        <!-- Class tabs -->
        <div class="flex flex-wrap gap-1 mb-4 border-b border-gray-200 dark:border-slate-600 pb-3">
          <button v-for="cs in editingClassSchedules" :key="cs.$id || cs._tempId"
            @click="editingClassId = cs.$id || cs._tempId"
            :class="(editingClassId === cs.$id || editingClassId === cs._tempId)
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200'"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition">
            {{ cs.class_name || '?' }} ({{ cs.shift === 'morning' ? 'DE' : 'DU' }})
          </button>
        </div>

        <!-- Currently editing class schedule -->
        <div v-if="currentEditingClass">
          <div class="flex flex-wrap gap-4 mb-4 items-end">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t("tt_class_name") }}</label>
              <input v-model="currentEditingClass.class_name" type="text"
                class="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 w-32"
                placeholder="I-1">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ $t("tt_morning_shift") }} / {{ $t("tt_afternoon_shift") }}</label>
              <select v-model="currentEditingClass.shift"
                class="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                <option value="morning">{{ $t("tt_morning_shift") }}</option>
                <option value="afternoon">{{ $t("tt_afternoon_shift") }}</option>
              </select>
            </div>
            <button @click="deleteClassSchedule(currentEditingClass)"
              class="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition">
              <i class="pi pi-trash mr-1"></i> {{ $t("tt_delete_schedule") }}
            </button>
          </div>

          <!-- Paste button -->
          <div class="flex gap-2 mb-3">
            <button @click="showPasteModal = true"
              class="px-4 py-2 glass-btn text-white rounded-lg text-sm font-medium hover:opacity-90 transition">
              <i class="pi pi-clipboard mr-1"></i> Paste from Spreadsheet
            </button>
          </div>

          <!-- Schedule grid editor -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="bg-gray-50 dark:bg-slate-700">
                  <th class="px-2 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border dark:border-slate-600 w-12">{{ $t("tt_period") }}</th>
                  <th v-for="day in 5" :key="day" class="px-2 py-2 text-center font-semibold text-gray-700 dark:text-gray-200 border dark:border-slate-600">
                    {{ $t('tt_' + dayKeys[day - 1]) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="period in 8" :key="period">
                  <td class="px-2 py-1 border dark:border-slate-600 text-center font-bold text-gray-600 dark:text-gray-300">{{ period }}</td>
                  <td v-for="day in 5" :key="day" class="px-1 py-1 border dark:border-slate-600">
                    <div class="space-y-1">
                      <input
                        :value="getCell(day, period - 1, 'teacher')"
                        @input="setCell(day, period - 1, 'teacher', ($event.target as HTMLInputElement).value)"
                        type="text"
                        class="w-full px-2 py-1 rounded border border-gray-200 dark:border-slate-500 bg-white dark:bg-slate-600 text-xs text-gray-800 dark:text-gray-200"
                        :placeholder="$t('tt_teacher_name')">
                      <input
                        :value="getCell(day, period - 1, 'room')"
                        @input="setCell(day, period - 1, 'room', ($event.target as HTMLInputElement).value)"
                        type="text"
                        class="w-full px-2 py-1 rounded border border-gray-200 dark:border-slate-500 bg-white dark:bg-slate-600 text-xs text-gray-400 dark:text-gray-400"
                        :placeholder="$t('tt_room_name')">
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end mt-4">
            <button @click="saveCurrentClass"
              class="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-sky-400 text-white rounded-lg font-medium hover:opacity-90 transition"
              :disabled="saving">
              <i :class="saving ? 'pi pi-spin pi-spinner' : 'pi pi-save'" class="mr-2"></i>
              {{ $t("tt_save") }}
            </button>
          </div>
        </div>
      </div>
      <!-- Paste modal -->
      <div v-if="showPasteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showPasteModal = false">
        <div class="glass-strong rounded-2xl p-6 w-full max-w-2xl mx-4">
          <h3 class="text-lg font-bold mb-2 text-gray-800 dark:text-white">Paste from Spreadsheet</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Paste a tab-separated grid (8 rows x 5 columns) from Excel/Sheets.<br>
            Rows = periods (1-8), Columns = days (Mon-Fri).<br>
            Each cell = teacher name. Empty cells = no lesson.
          </p>
          <textarea v-model="pasteData" rows="10"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 font-mono text-xs"
            placeholder="Paste tab-separated data here...&#10;e.g.: Gordos Emil&#9;Polyák Anna&#9;&#9;Nagy Éva&#9;Tóth István"></textarea>
          <div class="flex gap-3 justify-end mt-4">
            <button @click="showPasteModal = false" class="px-4 py-2 text-gray-600 dark:text-gray-400">
              Cancel
            </button>
            <button @click="applyPaste" class="px-4 py-2 glass-btn text-white rounded-lg font-medium hover:opacity-90 transition">
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Databases, Query, ID } from "appwrite";
import { appw, config } from "@/appwrite";
import { useLoadingStore } from "@/stores/loading";

const database = new Databases(appw);

interface ScheduleEntry {
  teacher: string;
  room: string;
}

interface ClassScheduleDoc {
  $id?: string;
  _tempId?: string;
  config_id: string;
  class_name: string;
  shift: string;
  schedule: string;
  _parsed?: Record<string, ScheduleEntry[]>;
}

interface TimetableConfig {
  $id: string;
  name: string;
  valid_from: string;
  is_active: boolean;
}

export default {
  data() {
    return {
      loading: true,
      saving: false,
      configs: [] as TimetableConfig[],
      showCreateConfig: false,
      newConfig: { name: '', valid_from: '' },
      editingConfig: null as TimetableConfig | null,
      editingClassSchedules: [] as ClassScheduleDoc[],
      editingClassId: '',
      dayKeys: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      showPasteModal: false,
      pasteData: ''
    };
  },
  computed: {
    currentEditingClass(): ClassScheduleDoc | null {
      return this.editingClassSchedules.find(
        cs => (cs.$id || cs._tempId) === this.editingClassId
      ) || null;
    }
  },
  async mounted() {
    await this.loadConfigs();
  },
  methods: {
    async loadConfigs() {
      this.loading = true;
      try {
        const result = await database.listDocuments(config.website_db, config.timetable_configs, [
          Query.orderDesc("valid_from"),
          Query.limit(50)
        ]);
        this.configs = result.documents as unknown as TimetableConfig[];
      } catch (err) {
        console.error("Failed to load timetable configs:", err);
      } finally {
        this.loading = false;
      }
    },

    async createConfig() {
      try {
        await database.createDocument(config.website_db, config.timetable_configs, ID.unique(), {
          name: this.newConfig.name,
          valid_from: this.newConfig.valid_from,
          is_active: false
        });
        this.showCreateConfig = false;
        this.newConfig = { name: '', valid_from: '' };
        await this.loadConfigs();
      } catch (err) {
        console.error("Failed to create config:", err);
      }
    },

    async activateConfig(cfg: TimetableConfig) {
      try {
        // Deactivate all others
        for (const c of this.configs) {
          if (c.is_active && c.$id !== cfg.$id) {
            await database.updateDocument(config.website_db, config.timetable_configs, c.$id, {
              is_active: false
            });
          }
        }
        // Activate selected
        await database.updateDocument(config.website_db, config.timetable_configs, cfg.$id, {
          is_active: true
        });
        await this.loadConfigs();
      } catch (err) {
        console.error("Failed to activate config:", err);
      }
    },

    async deleteConfig(cfg: TimetableConfig) {
      if (!confirm(this.$t("tt_confirm_delete"))) return;
      try {
        // Delete all class schedules for this config
        const schedules = await database.listDocuments(config.website_db, config.timetable_classes, [
          Query.equal("config_id", cfg.$id),
          Query.limit(200)
        ]);
        for (const doc of schedules.documents) {
          await database.deleteDocument(config.website_db, config.timetable_classes, doc.$id);
        }
        // Delete config
        await database.deleteDocument(config.website_db, config.timetable_configs, cfg.$id);
        if (this.editingConfig?.$id === cfg.$id) {
          this.editingConfig = null;
          this.editingClassSchedules = [];
        }
        await this.loadConfigs();
      } catch (err) {
        console.error("Failed to delete config:", err);
      }
    },

    async editConfig(cfg: TimetableConfig) {
      this.editingConfig = cfg;
      try {
        const result = await database.listDocuments(config.website_db, config.timetable_classes, [
          Query.equal("config_id", cfg.$id),
          Query.limit(200)
        ]);
        this.editingClassSchedules = result.documents.map((doc: any) => ({
          ...doc,
          _parsed: this.parseSchedule(doc.schedule)
        })) as ClassScheduleDoc[];
        if (this.editingClassSchedules.length > 0) {
          this.editingClassId = this.editingClassSchedules[0].$id || '';
        }
      } catch (err) {
        console.error("Failed to load class schedules:", err);
      }
    },

    parseSchedule(scheduleStr: string): Record<string, ScheduleEntry[]> {
      try {
        return JSON.parse(scheduleStr);
      } catch {
        return this.emptySchedule();
      }
    },

    emptySchedule(): Record<string, ScheduleEntry[]> {
      const schedule: Record<string, ScheduleEntry[]> = {};
      for (let day = 1; day <= 5; day++) {
        schedule[String(day)] = Array.from({ length: 8 }, () => ({ teacher: '', room: '' }));
      }
      return schedule;
    },

    addClassSchedule() {
      if (!this.editingConfig) return;
      const tempId = '_new_' + Date.now();
      const newCs: ClassScheduleDoc = {
        _tempId: tempId,
        config_id: this.editingConfig.$id,
        class_name: '',
        shift: 'morning',
        schedule: JSON.stringify(this.emptySchedule()),
        _parsed: this.emptySchedule()
      };
      this.editingClassSchedules.push(newCs);
      this.editingClassId = tempId;
    },

    async deleteClassSchedule(cs: ClassScheduleDoc) {
      if (!confirm(this.$t("tt_confirm_delete"))) return;
      if (cs.$id) {
        try {
          await database.deleteDocument(config.website_db, config.timetable_classes, cs.$id);
        } catch (err) {
          console.error("Failed to delete class schedule:", err);
          return;
        }
      }
      this.editingClassSchedules = this.editingClassSchedules.filter(
        c => (c.$id || c._tempId) !== (cs.$id || cs._tempId)
      );
      if (this.editingClassSchedules.length > 0) {
        this.editingClassId = this.editingClassSchedules[0].$id || this.editingClassSchedules[0]._tempId || '';
      } else {
        this.editingClassId = '';
      }
    },

    getCell(day: number, period: number, field: 'teacher' | 'room'): string {
      if (!this.currentEditingClass?._parsed) return '';
      const dayData = this.currentEditingClass._parsed[String(day)];
      if (!dayData || !dayData[period]) return '';
      return dayData[period][field] || '';
    },

    setCell(day: number, period: number, field: 'teacher' | 'room', value: string) {
      if (!this.currentEditingClass) return;
      if (!this.currentEditingClass._parsed) {
        this.currentEditingClass._parsed = this.emptySchedule();
      }
      const dayKey = String(day);
      if (!this.currentEditingClass._parsed[dayKey]) {
        this.currentEditingClass._parsed[dayKey] = Array.from({ length: 8 }, () => ({ teacher: '', room: '' }));
      }
      if (!this.currentEditingClass._parsed[dayKey][period]) {
        this.currentEditingClass._parsed[dayKey][period] = { teacher: '', room: '' };
      }
      this.currentEditingClass._parsed[dayKey][period][field] = value;
    },

    applyPaste() {
      if (!this.currentEditingClass || !this.pasteData.trim()) return;

      const lines = this.pasteData.trim().split('\n');
      if (!this.currentEditingClass._parsed) {
        this.currentEditingClass._parsed = this.emptySchedule();
      }

      for (let period = 0; period < Math.min(lines.length, 8); period++) {
        const cells = lines[period].split('\t');
        for (let day = 0; day < Math.min(cells.length, 5); day++) {
          const dayKey = String(day + 1);
          if (!this.currentEditingClass._parsed[dayKey]) {
            this.currentEditingClass._parsed[dayKey] = Array.from({ length: 8 }, () => ({ teacher: '', room: '' }));
          }
          if (!this.currentEditingClass._parsed[dayKey][period]) {
            this.currentEditingClass._parsed[dayKey][period] = { teacher: '', room: '' };
          }
          this.currentEditingClass._parsed[dayKey][period].teacher = cells[day]?.trim() || '';
        }
      }

      this.showPasteModal = false;
      this.pasteData = '';
    },

    async saveCurrentClass() {
      if (!this.currentEditingClass || !this.editingConfig) return;
      this.saving = true;

      const cs = this.currentEditingClass;
      const scheduleJson = JSON.stringify(cs._parsed || this.emptySchedule());

      try {
        if (cs.$id) {
          // Update existing
          await database.updateDocument(config.website_db, config.timetable_classes, cs.$id, {
            class_name: cs.class_name,
            shift: cs.shift,
            schedule: scheduleJson
          });
        } else {
          // Create new
          const result = await database.createDocument(config.website_db, config.timetable_classes, ID.unique(), {
            config_id: this.editingConfig.$id,
            class_name: cs.class_name,
            shift: cs.shift,
            schedule: scheduleJson
          });
          cs.$id = result.$id;
          delete cs._tempId;
        }
        cs.schedule = scheduleJson;
        alert(this.$t("tt_schedule_saved"));
      } catch (err) {
        console.error("Failed to save class schedule:", err);
        alert("Error saving schedule");
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>
