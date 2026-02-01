import { ref, reactive } from 'vue'

export interface ConfirmDialogOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  color?: string
  icon?: string
  /** If set, shows a text input field in the dialog (replaces native prompt()) */
  prompt?: boolean
  promptLabel?: string
  promptDefault?: string
}

interface DialogState {
  visible: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  color: string
  icon: string
  prompt: boolean
  promptLabel: string
  promptValue: string
  resolve: ((value: boolean | string | null) => void) | null
}

const state = reactive<DialogState>({
  visible: false,
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  color: 'primary',
  icon: '',
  prompt: false,
  promptLabel: '',
  promptValue: '',
  resolve: null
})

/**
 * Opens a confirm dialog. Returns a promise that resolves to:
 * - `true` if confirmed (for confirm dialogs)
 * - `string` with user input (for prompt dialogs)
 * - `false` / `null` if cancelled
 */
function openDialog(options: ConfirmDialogOptions): Promise<boolean | string | null> {
  return new Promise((resolve) => {
    state.title = options.title || ''
    state.message = options.message
    state.confirmText = options.confirmText || ''
    state.cancelText = options.cancelText || ''
    state.color = options.color || 'primary'
    state.icon = options.icon || ''
    state.prompt = options.prompt || false
    state.promptLabel = options.promptLabel || ''
    state.promptValue = options.promptDefault || ''
    state.resolve = resolve
    state.visible = true
  })
}

function confirmAction() {
  if (state.resolve) {
    if (state.prompt) {
      state.resolve(state.promptValue)
    } else {
      state.resolve(true)
    }
  }
  state.visible = false
  state.resolve = null
}

function cancelAction() {
  if (state.resolve) {
    if (state.prompt) {
      state.resolve(null)
    } else {
      state.resolve(false)
    }
  }
  state.visible = false
  state.resolve = null
}

export function useConfirmDialog() {
  return {
    state,
    openDialog,
    confirmAction,
    cancelAction
  }
}
