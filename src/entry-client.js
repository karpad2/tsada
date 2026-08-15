import { createApp } from './main'

const { app, router } = createApp()

const el = document.getElementById('app')
if (el) el.innerHTML = ''

function mount() {
  if (!el || el.__vue_app__) return
  app.mount('#app')
}

router.isReady().then(mount).catch((err) => {
  console.warn('Router failed to start, mounting app anyway', err)
  mount()
})
