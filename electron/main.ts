import { app, BrowserWindow, shell, ipcMain } from 'electron'
import path from 'node:path'

// dist-dc/ is sibling to dist-electron/ at project root
const RENDERER_DIST = path.join(__dirname, '../dist-dc')

// In dev, vite-plugin-electron sets VITE_DEV_SERVER_URL
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, '../public/favicon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    backgroundColor: '#313338',
    title: 'DC Chat',
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'dc-index.html'))
  }

  // External links open in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    if (!VITE_DEV_SERVER_URL && !url.startsWith('file://')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
}

ipcMain.handle('window-minimize', () => BrowserWindow.getFocusedWindow()?.minimize())
ipcMain.handle('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  win?.isMaximized() ? win.unmaximize() : win?.maximize()
})
ipcMain.handle('window-close', () => BrowserWindow.getFocusedWindow()?.close())

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
