import { notify } from '@kyvg/vue3-notification'

export function useNotifier() {
 const notifyInstance = notify
  return {
    notify: notifyInstance,
  }
}