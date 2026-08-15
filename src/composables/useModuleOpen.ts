import { onMounted, ref } from 'vue'
import { isPublicModuleOpen, type ModuleId } from '@/services/modules/windows'

export function useModuleOpen(id: ModuleId, staffBypass = false) {
  const open = ref(true)
  const ready = ref(false)

  onMounted(async () => {
    open.value = staffBypass || (await isPublicModuleOpen(id))
    ready.value = true
  })

  return { open, ready }
}
