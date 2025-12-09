<template>
  <div class="w-full space-y-2">
    <div v-for="(item, index) in items" :key="index" class="border-b border-gray-200 dark:border-gray-700">
      <!-- Item with submenu -->
      <div v-if="item.children && item.children.length > 0">
        <button
          @click="toggleItem(index)"
          class="w-full px-4 py-3 flex items-center justify-between text-left dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:dark:text-white transition-colors"
        >
          <span class="font-medium">{{ item.label }}</span>
          <svg
            class="w-5 h-5 transition-transform duration-300"
            :class="{ 'rotate-180': openItems.has(index) }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Submenu with transition -->
        <transition
          name="accordion"
          @enter="onEnter"
          @after-enter="onAfterEnter"
          @leave="onLeave"
        >
          <div v-show="openItems.has(index)" class="overflow-hidden">
            <div class="bg-gray-50 dark:bg-gray-800 py-2">
              <div v-for="(child, childIndex) in item.children" :key="childIndex">
                <!-- Child with nested submenu -->
                <div v-if="child.children && child.children.length > 0">
                  <button
                    :ref="el => setChildRef(index, childIndex, el)"
                    @click="toggleChild(index, childIndex)"
                    class="w-full px-6 py-2 flex items-center justify-between text-left dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 hover:dark:text-white transition-colors"
                  >
                    <span>{{ child.label }}</span>
                    <svg
                      class="w-4 h-4 transition-transform duration-300"
                      :class="{ 'rotate-180': openChildren.has(`${index}-${childIndex}`) }"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <!-- Nested submenu with transition -->
                  <transition
                    name="accordion"
                    @enter="onEnter"
                    @after-enter="onAfterEnter"
                    @leave="onLeave"
                  >
                    <div v-show="openChildren.has(`${index}-${childIndex}`)" class="overflow-hidden">
                      <div class="bg-gray-100 dark:bg-gray-750 py-2">
                        <div v-for="(grandchild, grandchildIndex) in child.children" :key="grandchildIndex">
                          <!-- Grandchild with nested submenu (4th level) -->
                          <div v-if="grandchild.children && grandchild.children.length > 0">
                            <button
                              :ref="el => setGrandchildRef(index, childIndex, grandchildIndex, el)"
                              @click="toggleGrandchild(index, childIndex, grandchildIndex)"
                              class="w-full px-8 py-2 flex items-center justify-between text-left dark:text-white hover:bg-white dark:hover:bg-gray-800 hover:dark:text-white transition-colors"
                            >
                              <span>{{ grandchild.label }}</span>
                              <svg
                                class="w-4 h-4 transition-transform duration-300"
                                :class="{ 'rotate-180': openGrandchildren.has(`${index}-${childIndex}-${grandchildIndex}`) }"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            <!-- 4th level submenu -->
                            <transition
                              name="accordion"
                              @enter="onEnter"
                              @after-enter="onAfterEnter"
                              @leave="onLeave"
                            >
                              <div v-show="openGrandchildren.has(`${index}-${childIndex}-${grandchildIndex}`)" class="overflow-hidden">
                                <div class="bg-white dark:bg-gray-900 py-2">
                                  <div v-for="(greatGrandchild, greatGrandchildIndex) in grandchild.children" :key="greatGrandchildIndex">
                                    <router-link
                                      v-if="greatGrandchild.to"
                                      :to="greatGrandchild.to"
                                      @click="$emit('item-clicked')"
                                      class="block px-10 py-2 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 hover:dark:text-white transition-colors"
                                    >
                                      {{ greatGrandchild.label }}
                                    </router-link>
                                    <a
                                      v-else-if="greatGrandchild.href"
                                      :href="greatGrandchild.href"
                                      target="_blank"
                                      @click="$emit('item-clicked')"
                                      class="block px-10 py-2 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 hover:dark:text-white transition-colors"
                                    >
                                      {{ greatGrandchild.label }}
                                    </a>
                                    <button
                                      v-else-if="greatGrandchild.action"
                                      @click="handleAction(greatGrandchild.action)"
                                      class="w-full text-left px-10 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white hover:dark:text-white transition-colors flex items-center gap-2"
                                    >
                                      <country-flag v-if="greatGrandchild.flag" :country="greatGrandchild.flag" size="small" />
                                      {{ greatGrandchild.label }}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </transition>
                          </div>

                          <!-- Simple grandchild link -->
                          <router-link
                            v-else-if="grandchild.to"
                            :to="grandchild.to"
                            @click="$emit('item-clicked')"
                            class="block px-8 py-2 dark:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors"
                          >
                            {{ grandchild.label }}
                          </router-link>
                          <a
                            v-else-if="grandchild.href"
                            :href="grandchild.href"
                            target="_blank"
                            @click="$emit('item-clicked')"
                            class="block px-8 py-2 dark:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors"
                          >
                            {{ grandchild.label }}
                          </a>
                          <button
                            v-else-if="grandchild.action"
                            @click="handleAction(grandchild.action)"
                            class="w-full text-left px-8 py-2 dark:text-white hover:bg-white dark:hover:bg-gray-800 hover:dark:text-white transition-colors flex items-center gap-2"
                          >
                            <country-flag v-if="grandchild.flag" :country="grandchild.flag" size="small" />
                            {{ grandchild.label }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </transition>
                </div>

                <!-- Simple child link -->
                <router-link
                  v-else-if="child.to"
                  :to="child.to"
                  @click="$emit('item-clicked')"
                  class="block px-6 py-2 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {{ child.label }}
                </router-link>
                <a
                  v-else-if="child.href"
                  :href="child.href"
                  target="_blank"
                  @click="$emit('item-clicked')"
                  class="block px-6 py-2 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {{ child.label }}
                </a>
                <button
                  v-else-if="child.action"
                  @click="handleAction(child.action)"
                  class="w-full text-left px-6 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white hover:dark:text-white transition-colors flex items-center gap-2"
                >
                  <country-flag v-if="child.flag" :country="child.flag" size="small" />
                  {{ child.label }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Simple item (no submenu) -->
      <router-link
        v-else-if="item.to"
        :to="item.to"
        class="block px-4 py-3 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:dark:text-white transition-colors"
        @click="$emit('item-clicked')"
      >
        {{ item.label }}
      </router-link>
      <a
        v-else-if="item.href"
        :href="item.href"
        class="block px-4 py-3 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:dark:text-white transition-colors"
        target="_blank"
        @click="$emit('item-clicked')"
      >
        {{ item.label }}
      </a>
      <button
        v-else-if="item.action"
        @click="handleAction(item.action)"
        class="w-full text-left px-4 py-3 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 hover:dark:text-white transition-colors flex items-center gap-2"
      >
        <country-flag v-if="item.flag" :country="item.flag" size="small" />
        {{ item.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

interface MenuItem {
  label: string
  to?: string
  href?: string
  flag?: string
  action?: () => void | Promise<void>
  children?: MenuItem[]
}

interface Props {
  items: MenuItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'item-clicked'): void
}>()

// Track open state
const openItems = ref<Set<number>>(new Set())
const openChildren = ref<Set<string>>(new Set())
const openGrandchildren = ref<Set<string>>(new Set())

// Refs for child elements to enable scrolling
const childRefs = ref<Map<string, HTMLElement>>(new Map())
const grandchildRefs = ref<Map<string, HTMLElement>>(new Map())

const setChildRef = (parentIndex: number, childIndex: number, el: any) => {
  if (el) {
    childRefs.value.set(`${parentIndex}-${childIndex}`, el)
  }
}

const setGrandchildRef = (parentIndex: number, childIndex: number, grandchildIndex: number, el: any) => {
  if (el) {
    grandchildRefs.value.set(`${parentIndex}-${childIndex}-${grandchildIndex}`, el)
  }
}

const toggleItem = (index: number) => {
  const newSet = new Set(openItems.value)
  if (newSet.has(index)) {
    newSet.delete(index)
  } else {
    newSet.add(index)
  }
  openItems.value = newSet
}

const toggleChild = async (parentIndex: number, childIndex: number) => {
  const key = `${parentIndex}-${childIndex}`
  const newSet = new Set(openChildren.value)

  if (newSet.has(key)) {
    newSet.delete(key)
  } else {
    newSet.add(key)

    // Scroll the opened child into view after animation
    await nextTick()
    setTimeout(() => {
      const childElement = childRefs.value.get(key)
      if (childElement) {
        // Find the scrollable parent (nav element with overflow)
        const scrollParent = childElement.closest('.overflow-y-auto')

        if (scrollParent) {
          // Calculate position relative to scroll parent
          const parentRect = scrollParent.getBoundingClientRect()
          const childRect = childElement.getBoundingClientRect()
          const relativeTop = childRect.top - parentRect.top + scrollParent.scrollTop

          // Scroll to show the element with some padding
          scrollParent.scrollTo({
            top: relativeTop - 20,
            behavior: 'smooth'
          })
        }
      }
    }, 350) // Match animation duration
  }
  openChildren.value = newSet
}

const toggleGrandchild = async (parentIndex: number, childIndex: number, grandchildIndex: number) => {
  const key = `${parentIndex}-${childIndex}-${grandchildIndex}`
  const newSet = new Set(openGrandchildren.value)

  if (newSet.has(key)) {
    newSet.delete(key)
  } else {
    newSet.add(key)

    // Scroll the opened grandchild into view after animation
    await nextTick()
    setTimeout(() => {
      const grandchildElement = grandchildRefs.value.get(key)
      if (grandchildElement) {
        // Find the scrollable parent (nav element with overflow)
        const scrollParent = grandchildElement.closest('.overflow-y-auto')

        if (scrollParent) {
          // Calculate position relative to scroll parent
          const parentRect = scrollParent.getBoundingClientRect()
          const childRect = grandchildElement.getBoundingClientRect()
          const relativeTop = childRect.top - parentRect.top + scrollParent.scrollTop

          // Scroll to show the element with some padding
          scrollParent.scrollTo({
            top: relativeTop - 20,
            behavior: 'smooth'
          })
        }
      }
    }, 350) // Match animation duration
  }
  openGrandchildren.value = newSet
}

const handleAction = async (action: () => void | Promise<void>) => {
  await action()
  emit('item-clicked')
}

// Transition hooks for smooth height animations
const onEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
}

const onAfterEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = `${element.scrollHeight}px`
  setTimeout(() => {
    element.style.height = 'auto'
  }, 300)
}

const onLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = `${element.scrollHeight}px`
  setTimeout(() => {
    element.style.height = '0'
  }, 10)
}
</script>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: height 0.3s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  height: 0;
}
</style>
