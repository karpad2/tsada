<template>
  <div class="table-block" :class="tableBlockClasses">
    <div v-if="localizedContent.title" class="table-title mb-6">
      <h3 class="text-2xl font-semibold text-gray-800 dark:text-white">
        {{ localizedContent.title }}
      </h3>
    </div>

    <div v-if="localizedContent.description" class="table-description mb-6">
      <p class="text-gray-600 dark:text-gray-300">
        {{ localizedContent.description }}
      </p>
    </div>

    <div class="table-container" :class="containerClasses">
      <!-- Search -->
      <div v-if="searchable" class="table-search mb-4">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('search_table')"
            class="w-full px-3 py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <i class="pi pi-search absolute left-3 top-3 text-gray-400"></i>
        </div>
      </div>

      <!-- Table -->
      <div class="table-wrapper overflow-x-auto">
        <table class="table" :class="tableClasses">
          <!-- Header -->
          <thead v-if="tableHeaders.length > 0">
            <tr>
              <th
                v-for="(header, index) in tableHeaders"
                :key="index"
                class="table-header"
                :class="headerClasses"
                @click="sortable ? toggleSort(index) : null"
              >
                <div class="flex items-center">
                  <span>{{ header }}</span>
                  <div v-if="sortable" class="ml-2 flex flex-col">
                    <i
                      class="pi pi-caret-up text-xs"
                      :class="{ 'text-blue-500': sortColumn === index && sortDirection === 'asc' }"
                    ></i>
                    <i
                      class="pi pi-caret-down text-xs"
                      :class="{ 'text-blue-500': sortColumn === index && sortDirection === 'desc' }"
                    ></i>
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody>
            <tr
              v-for="(row, rowIndex) in paginatedRows"
              :key="rowIndex"
              class="table-row"
              :class="{ 'hover:bg-gray-50 dark:hover:bg-gray-700': hoverable }"
            >
              <td
                v-for="(cell, cellIndex) in row"
                :key="cellIndex"
                class="table-cell"
                :class="cellClasses"
              >
                <div v-if="responsive && cellIndex === 0" class="md:hidden font-medium text-gray-900 dark:text-white">
                  {{ tableHeaders[cellIndex] }}
                </div>
                <span v-html="cell"></span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-if="filteredRows.length === 0" class="text-center py-8">
          <i class="pi pi-table text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500 dark:text-gray-400">
            {{ searchQuery ? $t('no_search_results') : $t('no_data_available') }}
          </p>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && filteredRows.length > itemsPerPage" class="table-pagination mt-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            {{ $t('showing') }} {{ startItem }} {{ $t('to') }} {{ endItem }} {{ $t('of') }} {{ filteredRows.length }} {{ $t('results') }}
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="pagination-btn"
              :class="paginationButtonClasses"
            >
              <i class="pi pi-chevron-left"></i>
            </button>

            <span class="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
              {{ currentPage }} / {{ totalPages }}
            </span>

            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="pagination-btn"
              :class="paginationButtonClasses"
            >
              <i class="pi pi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import type { ContentComponent, TableComponentContent } from '@/types/contentTypes';
import { convertifserbian } from '@/lang';

export default defineComponent({
  name: 'TableBlock',
  props: {
    component: {
      type: Object as () => ContentComponent,
      required: true
    },
    language: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const searchQuery = ref('');
    const sortColumn = ref<number | null>(null);
    const sortDirection = ref<'asc' | 'desc'>('asc');
    const currentPage = ref(1);
    const itemsPerPage = ref(10);

    const localizedContent = computed((): TableComponentContent => {
      let content: TableComponentContent;

      switch (props.language) {
        case 'sr':
        case 'rs':
          content = props.component.content_rs as TableComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
          // Convert headers and rows if needed
          if (content.headers) {
            content.headers = content.headers.map(header => convertifserbian(header));
          }
          break;
        case 'hu':
          content = props.component.content_hu as TableComponentContent;
          break;
        case 'en':
          content = props.component.content_en as TableComponentContent;
          break;
        default:
          content = props.component.content_rs as TableComponentContent;
          if (content.title) content.title = convertifserbian(content.title);
          if (content.description) content.description = convertifserbian(content.description);
          if (content.headers) {
            content.headers = content.headers.map(header => convertifserbian(header));
          }
      }

      return content || {
        headers: [],
        rows: [],
        sortable: false,
        searchable: false,
        pagination: false,
        responsive: true
      };
    });

    const tableHeaders = computed(() => localizedContent.value.headers || []);
    const tableRows = computed(() => localizedContent.value.rows || []);
    const sortable = computed(() => localizedContent.value.sortable === true);
    const searchable = computed(() => localizedContent.value.searchable === true);
    const pagination = computed(() => localizedContent.value.pagination === true);
    const responsive = computed(() => localizedContent.value.responsive !== false);
    const hoverable = computed(() => props.component.settings?.hoverable !== false);

    const filteredRows = computed(() => {
      let rows = [...tableRows.value];

      // Apply search filter
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        rows = rows.filter(row =>
          row.some(cell =>
            cell.toString().toLowerCase().includes(query)
          )
        );
      }

      // Apply sorting
      if (sortColumn.value !== null && sortable.value) {
        rows.sort((a, b) => {
          const aValue = a[sortColumn.value!]?.toString() || '';
          const bValue = b[sortColumn.value!]?.toString() || '';

          const comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
          return sortDirection.value === 'asc' ? comparison : -comparison;
        });
      }

      return rows;
    });

    const totalPages = computed(() => {
      if (!pagination.value) return 1;
      return Math.ceil(filteredRows.value.length / itemsPerPage.value);
    });

    const startItem = computed(() => {
      if (!pagination.value) return 1;
      return (currentPage.value - 1) * itemsPerPage.value + 1;
    });

    const endItem = computed(() => {
      if (!pagination.value) return filteredRows.value.length;
      return Math.min(currentPage.value * itemsPerPage.value, filteredRows.value.length);
    });

    const paginatedRows = computed(() => {
      if (!pagination.value) return filteredRows.value;

      const start = (currentPage.value - 1) * itemsPerPage.value;
      const end = start + itemsPerPage.value;
      return filteredRows.value.slice(start, end);
    });

    const tableBlockClasses = computed(() => {
      const classes = ['table-wrapper'];

      if (props.component.settings?.alignment) {
        classes.push(`text-${props.component.settings.alignment}`);
      }

      return classes.join(' ');
    });

    const containerClasses = computed(() => {
      const classes = [];

      const style = props.component.settings?.style || 'default';
      switch (style) {
        case 'bordered':
          classes.push('border', 'border-gray-200', 'dark:border-gray-700', 'rounded-lg', 'p-4');
          break;
        case 'card':
          classes.push('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-lg', 'p-6');
          break;
      }

      return classes.join(' ');
    });

    const tableClasses = computed(() => {
      const classes = ['min-w-full', 'divide-y', 'divide-gray-200', 'dark:divide-gray-700'];

      const tableStyle = props.component.settings?.table_style || 'default';
      switch (tableStyle) {
        case 'striped':
          classes.push('table-striped');
          break;
        case 'bordered':
          classes.push('border', 'border-gray-200', 'dark:border-gray-700');
          break;
      }

      return classes.join(' ');
    });

    const headerClasses = computed(() => {
      const classes = [
        'px-6',
        'py-3',
        'text-left',
        'text-xs',
        'font-medium',
        'text-gray-500',
        'dark:text-gray-400',
        'uppercase',
        'tracking-wider'
      ];

      if (sortable.value) {
        classes.push('cursor-pointer', 'hover:bg-gray-50', 'dark:hover:bg-gray-700');
      }

      return classes.join(' ');
    });

    const cellClasses = computed(() => {
      const classes = ['px-6', 'py-4', 'whitespace-nowrap', 'text-sm', 'text-gray-900', 'dark:text-white'];

      return classes.join(' ');
    });

    const paginationButtonClasses = computed(() => {
      const classes = [
        'px-3',
        'py-1',
        'text-sm',
        'border',
        'border-gray-300',
        'dark:border-gray-600',
        'rounded',
        'hover:bg-gray-50',
        'dark:hover:bg-gray-700',
        'disabled:opacity-50',
        'disabled:cursor-not-allowed'
      ];

      return classes.join(' ');
    });

    const toggleSort = (columnIndex: number) => {
      if (sortColumn.value === columnIndex) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn.value = columnIndex;
        sortDirection.value = 'asc';
      }
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };

    const previousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    return {
      searchQuery,
      sortColumn,
      sortDirection,
      currentPage,
      localizedContent,
      tableHeaders,
      filteredRows,
      paginatedRows,
      totalPages,
      startItem,
      endItem,
      sortable,
      searchable,
      pagination,
      responsive,
      hoverable,
      tableBlockClasses,
      containerClasses,
      tableClasses,
      headerClasses,
      cellClasses,
      paginationButtonClasses,
      toggleSort,
      nextPage,
      previousPage
    };
  }
});
</script>

<style scoped>
.table-wrapper {
  @apply w-full mb-8;
}

.table-striped tbody tr:nth-child(even) {
  @apply bg-gray-50 dark:bg-gray-800;
}

.pagination-btn {
  @apply flex items-center justify-center;
}

/* Responsive table */
@media (max-width: 768px) {
  .table-responsive {
    @apply block;
  }

  .table-responsive thead {
    @apply hidden;
  }

  .table-responsive tbody,
  .table-responsive tr,
  .table-responsive td {
    @apply block;
  }

  .table-responsive tr {
    @apply border border-gray-200 dark:border-gray-700 rounded-lg mb-4 p-4;
  }

  .table-responsive td {
    @apply px-0 py-2 border-none;
  }

  .table-responsive td:before {
    content: attr(data-label) ": ";
    @apply font-semibold mr-2;
  }
}
</style>