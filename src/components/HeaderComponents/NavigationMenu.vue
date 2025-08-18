<template>
    <nav v-if="mobile_mode" :class="[{'flex-col':mobile_view},{'mx-auto':mobile_view||tablet_mode},{'flex-row':!mobile_view}]" class="md:ml-auto flex items-center text-base justify-center flex-wrap">
      <template v-for="item in menu">
        <!-- Egyszerű link -->
        <router-link
          v-if="!item.children && !item.external && checkCondition(item)"
          :key="item.label"
          :to="item.to"
          class="btn btn-ghost cursor-pointer dark:text-white"
        >
          {{ $t(item.label) }}
        </router-link>
  
        <!-- Külső link -->
        <a
          v-else-if="!item.children && item.external && checkCondition(item)"
          :key="item.label"
          :href="item.to"
          target="_blank"
          class="btn btn-ghost cursor-pointer dark:text-white"
        >
          {{ $t(item.label) }}
        </a>
  
        <!-- Dropdown menü -->
        <div
          v-else-if="item.children && checkCondition(item)"
          :key="item.label"
          class="dropdown dropdown-hover"
        >
          <div
            tabindex="0"
            role="button"
            class="btn btn-ghost cursor-pointer dark:text-white"
          >
            {{ $t(item.label) }}
            <i class="pi pi-angle-down ml-1"></i>
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 bg-base-100 rounded-box w-52">
            <template v-for="child in item.children">
              <!-- Nested dropdown -->
              <li v-if="child.children && checkCondition(child)">
                <details :class="{'dropdown-right': !mobile_view}" class="dropdown dropdown-hover">
                  <summary>{{ $t(child.label) }}</summary>
                  <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                    <li v-for="sub in child.children" v-if="checkCondition(sub)">
                      <router-link :to="sub.to">{{ $t(sub.label) }}</router-link>
                    </li>
                  </ul>
                </details>
              </li>
  
              <!-- Normál menüpont -->
              <li v-else-if="checkCondition(child)">
                <router-link v-if="!child.external" :to="child.to">{{ $t(child.label) }}</router-link>
                <a v-else :href="child.to" target="_blank">{{ $t(child.label) }}</a>
              </li>
            </template>
          </ul>
        </div>
      </template>
    </nav>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  // Props vagy inject szerint (használhatod kívülről vagy fixen)
  const props = defineProps({
    mobile_mode: Boolean,
    mobile_view: Boolean,
    tablet_mode: Boolean,
    reload: Boolean,
    isLoggedin: Boolean,
    erasmus_apply_on: Boolean,
    erasmus_list: Boolean,
    _students: Array,
    _erasmus: Array,
  })
  
  const menu = computed(() => [
    { label: 'home', to: '/home' },
    {
      label: 'aboutus',
      condition: props.reload,
      children: [
        { label: 'history_of_school', to: '/renderer/about/history' },
        ...props.reload ? props._students.map(s => ({ label: s.name, to: `/renderer/about/${s.id}` })) : [],
        { label: 'workers', to: '/about/workers' },
        { label: 'classlist', to: '/about/classlist' },
      ],
    },
    {
      label: 'education',
      children: [
        {
          label: 'courses',
          children: [
            {
              label: 'machine',
              children: [
                { label: 'mechanical_technician', to: '/renderer/education/mechanical_technician' },
                { label: 'cnc_miller', to: '/renderer/education/cnc_miller' },
              ],
            },
            {
              label: 'electrotechnic',
              children: [
                { label: 'mechatronic_technician', to: '/renderer/education/mechatronic_technician' },
                { label: 'computer_electrotechnician', to: '/renderer/education/computer_electrotechnician' },
              ],
            },
            {
              label: 'civil_engineering',
              children: [
                { label: 'primary_construction_works_operator', to: '/renderer/education/primary_construction_works_operator' },
              ],
            },
          ],
        },
        { label: 'timetable', to: '/about/timetable' },
        { label: 'teachers_receiving_hour', to: '/about/workerstimetable' },
        { label: 'parentsvisiting', to: '/about/parentvisiting' },
        { label: 'examslist', to: '/renderer/education/examslist' },
        { label: 'textbooks', to: '/renderer/education/textbooks' },
      ],
    },
    { label: 'gallery', to: '/gallery' },
    {
      label: 'for_students',
      children: [
        ...props._students.map(s => ({ label: s.name, to: `/renderer/students/${s.id}` })),
        { label: 'studentdocuments', to: '/studentdocuments' },
        { label: 'eclassroom', to: 'https://moodle.tsada.edu.rs', external: true },
      ],
    },
    {
      label: 'documents',
      children: [
        { label: 'school_documents', to: '/documents' },
        { label: 'public_procurements', to: '/docs/public_procurements' },
        { label: 'lease', to: '/docs/leases' },
        { label: 'duplicates_of_diplomas', to: '/renderer/education/67b4d43f0017f6a974b8' },
      ],
    },
    { label: 'adult_education', to: '/renderer/education/adult_education' },
    {
      label: 'Erasmus',
      condition: props.reload,
      children: [
        ...props._erasmus.map(e => ({ label: e.name, to: `/renderer/erasmus/${e.id}` })),
        { label: 'erasmus_apply', to: '/erasmus/apply', condition: props.erasmus_apply_on },
        { label: 'erasmus_applies_result', to: '/erasmus/results', condition: props.erasmus_list },
        { label: 'erasmus_applies', to: '/admin/erasmus/applies', condition: props.isLoggedin },
      ],
    },
    {
      label: 'account',
      condition: props.isLoggedin,
      children: [
        { label: 'messages', to: '/admin/messages' },
        { label: 'presentation_editor', to: '/admin/slide-editor' },
        { label: 'logout', to: '/', action: 'logout' }, // Itt lehet `@click` is külön
      ],
    },
    {
      label: 'login',
      to: '/login',
      condition: !props.isLoggedin,
    },
  ])
  
  function checkCondition(item) {
    return item.condition === undefined || item.condition
  }
  </script>
  