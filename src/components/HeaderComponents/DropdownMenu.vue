<template>
  <div class="dropdown dropdown-hover">
    <div
      tabindex="0"
      role="button"
      class="btn btn-ghost cursor-pointer dark:text-white"
      :class="buttonClass"
    >
      {{ label }}
      <i class="pi pi-angle-down"></i>
    </div>
    <ul
      v-if="items.length > 0"
      tabindex="0"
      class="dropdown-content z-[1] menu p-2 bg-base-100 rounded-box w-52"
    >
      <slot name="before-items"></slot>
      <li v-for="item in items" :key="item.id">
        <component
          :is="item.external ? 'a' : 'router-link'"
          :to="item.external ? undefined : item.link"
          :href="item.external ? item.link : undefined"
          :target="item.external ? '_blank' : undefined"
        >
          {{ item.label }}
        </component>
      </li>
      <slot name="after-items"></slot>
    </ul>
  </div>
</template>

<script setup lang="ts">
interface DropdownItem {
  id: string;
  label: string;
  link: string;
  external?: boolean;
}

interface Props {
  label: string;
  items: DropdownItem[];
  buttonClass?: string;
}

withDefaults(defineProps<Props>(), {
  buttonClass: '',
});
</script>
