const { app, BrowserWindow } = require('electron')
const path = require('path')
const { PeerServer } = require('peer')
const os = require('os')

const PEER_PORT = 9000

let win
let peerServer

// ── LAN IP detection ───────────────────────────────────────
function getLanIp() {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return 'localhost'
}

// ── Start PeerJS signaling server ──────────────────────────
function startPeerServer() {
  try {
    peerServer = PeerServer({
      port: PEER_PORT,
      path: '/',
      allow_discovery: true,
    })
    console.log(`[PeerServer] running on port ${PEER_PORT}`)
  } catch (e) {
    console.warn('[PeerServer] failed to start:', e.message)
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Pass server info to renderer via a global
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(`
      window.__PEER_SERVER__ = {
        host: 'localhost',
        port: ${PEER_PORT},
        lanIp: '${getLanIp()}',
      }
    `)
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  startPeerServer()
  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
