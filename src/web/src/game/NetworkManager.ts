// ─────────────────────────────────────────────────────────────
// NetworkManager — PeerJS-based P2P co-op
// Star topology: host peer ID = room code. All clients connect to host.
// Host relays messages from each client to all others.
// Supports PUBLIC (discoverable) and INVITE (code-only) rooms.
//
// PUBLIC room discovery via PeerJS listAllPeers():
//   - Public rooms use a known prefix (`heist-p-`).
//   - Listing scans all connected peers for matching prefix.
//   - No broker required — simpler and more reliable.
// ─────────────────────────────────────────────────────────────
import { Peer } from 'peerjs'

export const PLAYER_COLORS = [0x4488ff, 0xff4444, 0x44ff88, 0xffaa44]

const PREFIX_PUB = 'heist-p-'
const PREFIX_INV = 'heist-i-'

let _peer        = null
let _conns       = []       // host: all client DataConns; client: [hostConn]
let _isHost      = false
let _peerId      = null     // own PeerJS ID

let _onMsg       = null     // (data, fromPeerId) => void
let _onJoin      = null     // (peerCount) => void
let _onLeave     = null     // (peerId) => void
let _onReady     = null     // () => void  (lobby ready-state change)
let _onHostDC    = null     // (reason?: string) => void  (client disconnect/kick/ban)

// ── Configurable PeerJS server ──────────────────────────────
let _serverHost  = null     // null = PeerJS cloud default
let _serverPort  = null

// ── Lobby peer (for listAllPeers) ───────────────────────────
let _lobbyPeer     = null   // lightweight Peer just for listing rooms
let _bannedPeers   = new Set()   // host: banned peer IDs

function _code(len = 6) {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: len }, () => c[Math.floor(Math.random() * c.length)]).join('')
}

export const NetworkManager = {
  // Public state
  connected:    false,
  isHost:       false,
  isPublic:     false,
  roomCode:     null,       // display code (short for invite, full peer ID for public)
  playerIndex:  0,          // 0 = host, 1-3 = clients
  playerCount:  1,
  players:      [],         // [{ peerId, index, ready }]
  enabled:      false,      // true when in a coop session

  // ── Lobby init/destroy ──────────────────────────────────────
  // Creates a lightweight Peer for listing rooms via listAllPeers().
  initLobby(): Promise<void> {
    return new Promise((resolve) => {
      if (_lobbyPeer && !_lobbyPeer.destroyed) { resolve(); return }

      _lobbyPeer = new Peer(undefined, _peerCfg())
      const timeout = setTimeout(() => resolve(), 5000)

      _lobbyPeer.on('open', () => {
        clearTimeout(timeout)
        console.log('[Lobby] ready for room discovery')
        resolve()
      })
      _lobbyPeer.on('error', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  },

  destroyLobby() {
    try { _lobbyPeer?.destroy() } catch {}
    _lobbyPeer = null
  },

  // ── Create room (become host) ────────────────────────────────
  createRoom(isPublic = false) {
    return new Promise((resolve, reject) => {
      const prefix = isPublic ? PREFIX_PUB : PREFIX_INV
      const roomPeerId = prefix + _code()
      _peer = new Peer(roomPeerId, _peerCfg())
      _peer.on('open', id => {
        _peerId = id
        _isHost = true
        NetworkManager.isHost      = true
        NetworkManager.isPublic    = isPublic
        NetworkManager.connected   = true
        NetworkManager.enabled     = true
        NetworkManager.roomCode    = isPublic ? id : id.replace(PREFIX_INV, '')
        NetworkManager.playerIndex = 0
        NetworkManager.playerCount = 1
        NetworkManager.players     = [{ peerId: id, index: 0, ready: false }]

        // Accept incoming connections from clients
        _peer.on('connection', _onIncomingConn)
        _peer.on('error', e => console.warn('[Net] peer error', e))

        // Public rooms are discoverable via listAllPeers() — no registration needed

        resolve(NetworkManager.roomCode)
      })
      _peer.on('error', reject)
    })
  },

  // ── List public rooms (via PeerJS listAllPeers) ─────────────
  listPublicRooms(): Promise<string[]> {
    return new Promise((resolve) => {
      const peer = _lobbyPeer
      if (!peer || peer.destroyed) { resolve([]); return }

      const timeout = setTimeout(() => resolve([]), 4000)

      peer.listAllPeers((peers: string[]) => {
        clearTimeout(timeout)
        // Filter to only public room IDs (host peer IDs start with PREFIX_PUB)
        const rooms = peers.filter(id => id.startsWith(PREFIX_PUB))
        resolve(rooms)
      })
    })
  },

  // ── Join room ────────────────────────────────────────────────
  joinRoom(codeOrPeerId) {
    // If it's a short invite code, prepend prefix
    let peerId = codeOrPeerId
    if (!codeOrPeerId.startsWith('heist-')) {
      peerId = PREFIX_INV + codeOrPeerId
    }
    return new Promise((resolve, reject) => {
      _peer = new Peer(undefined, _peerCfg())
      _peer.on('open', myId => {
        _peerId = myId
        _isHost = false
        NetworkManager.isHost    = false
        NetworkManager.isPublic  = peerId.startsWith(PREFIX_PUB)
        NetworkManager.enabled   = true
        NetworkManager.roomCode  = codeOrPeerId

        const conn = _peer.connect(peerId, { reliable: true })
        conn.on('open', () => {
          _conns.push(conn)
          conn.send({ type: 'hello', peerId: myId })
          conn.on('data',  data => _handleData(data))
          conn.on('close', () => {
            _handleDisconnect(conn.peer)
            // Client lost connection to host — notify UI
            _onHostDC?.('disconnect')
          })
          NetworkManager.connected = true
          resolve()
        })
        conn.on('error', reject)
      })
      _peer.on('error', reject)
    })
  },

  // ── Send to all others ───────────────────────────────────────
  send(type, payload = {}) {
    if (!NetworkManager.enabled) return
    const msg = { type, ...payload, _from: _peerId }
    if (_isHost) {
      for (const c of _conns) { try { c.send(msg) } catch {} }
    } else {
      try { _conns[0]?.send(msg) } catch {}
    }
  },

  // ── Event callbacks ──────────────────────────────────────────
  onMessage(cb)        { _onMsg    = cb },
  onJoin(cb)           { _onJoin   = cb },
  onLeave(cb)          { _onLeave  = cb },
  onReady(cb)          { _onReady  = cb },
  onHostDisconnect(cb) { _onHostDC = cb },

  // ── Set ready (lobby) ────────────────────────────────────────
  setReady(ready) {
    const me = NetworkManager.players.find(p => p.peerId === _peerId)
    if (me) me.ready = ready
    NetworkManager.send('ready', { ready, peerId: _peerId })
    _onReady?.()
  },

  // ── Start game (host only) ───────────────────────────────────
  startGame(levelData = null) {
    if (!_isHost) return
    NetworkManager.send('start', levelData ? { levelData } : {})
    _onMsg?.({ type: 'start', levelData })
  },

  // ── Server config ────────────────────────────────────────────
  setServer(host: string | null, port?: number) {
    _serverHost = host
    _serverPort = port || 9000
  },

  getServerInfo() {
    const ps = (window as any).__PEER_SERVER__
    return ps ? { host: ps.host, port: ps.port, lanIp: ps.lanIp } : null
  },

  // ── Kick / Ban (host only) ───────────────────────────────────
  kick(peerId) {
    if (!_isHost) return
    const conn = _conns.find(c => c.peer === peerId)
    if (!conn) return
    try { conn.send({ type: 'kicked', reason: 'kick' }) } catch {}
    setTimeout(() => { try { conn.close() } catch {} }, 100)
  },

  ban(peerId) {
    if (!_isHost) return
    _bannedPeers.add(peerId)
    const conn = _conns.find(c => c.peer === peerId)
    if (!conn) return
    try { conn.send({ type: 'kicked', reason: 'ban' }) } catch {}
    setTimeout(() => { try { conn.close() } catch {} }, 100)
  },

  // ── Disconnect ───────────────────────────────────────────────
  disconnect() {
    for (const c of _conns) { try { c.close() } catch {} }
    _conns = []
    try { _peer?.destroy() } catch {}
    _peer = null
    _bannedPeers.clear()
    NetworkManager.connected   = false
    NetworkManager.enabled     = false
    NetworkManager.isPublic    = false
    NetworkManager.roomCode    = null
    NetworkManager.players     = []
    NetworkManager.playerCount = 1
  },
}

// ── Incoming connection handler (host side) ──────────────────
function _onIncomingConn(conn) {
  conn.on('open', () => {
    // Reject banned peers
    if (_bannedPeers.has(conn.peer)) {
      try { conn.send({ type: 'kicked', reason: 'ban' }) } catch {}
      setTimeout(() => { try { conn.close() } catch {} }, 100)
      return
    }

    _conns.push(conn)

    // Assign player index to new joiner
    const idx = _conns.length  // host=0, first client=1 …
    const newPlayer = { peerId: conn.peer, index: idx, ready: false }
    NetworkManager.players.push(newPlayer)
    NetworkManager.playerCount = NetworkManager.players.length

    // Welcome the new client with the full player list
    conn.send({
      type: 'welcome',
      playerIndex: idx,
      players: NetworkManager.players,
    })

    // Notify everyone else a new player joined
    const joinMsg = { type: 'playerJoined', players: NetworkManager.players }
    for (const c of _conns) {
      if (c !== conn) { try { c.send(joinMsg) } catch {} }
    }
    _onJoin?.(NetworkManager.playerCount)

    conn.on('data', data => {
      // Relay to all other connections (including host's own listener)
      for (const c of _conns) {
        if (c !== conn) { try { c.send(data) } catch {} }
      }
      _handleData(data)
    })

    conn.on('close', () => {
      _conns.splice(_conns.indexOf(conn), 1)
      _handleDisconnect(conn.peer)
    })
  })

  conn.on('error', e => console.warn('[Net] conn error', e))
}

// ── Incoming message handler ─────────────────────────────────
function _handleData(data) {
  if (!data?.type) return

  // Lobby management
  if (data.type === 'welcome') {
    NetworkManager.playerIndex = data.playerIndex
    NetworkManager.players     = data.players
    NetworkManager.playerCount = data.players.length
    _onJoin?.(NetworkManager.playerCount)
    return
  }
  if (data.type === 'playerJoined') {
    NetworkManager.players     = data.players
    NetworkManager.playerCount = data.players.length
    _onJoin?.(NetworkManager.playerCount)
    return
  }
  if (data.type === 'playerLeft') {
    NetworkManager.players     = NetworkManager.players.filter(p => p.peerId !== data.peerId)
    NetworkManager.playerCount = NetworkManager.players.length
    _onLeave?.(data.peerId)
    return
  }
  if (data.type === 'ready') {
    const p = NetworkManager.players.find(pl => pl.peerId === data.peerId)
    if (p) p.ready = data.ready
    _onReady?.()
    return
  }
  if (data.type === 'kicked') {
    _onHostDC?.(data.reason ?? 'kick')
    return
  }

  // Game data → pass to Engine
  _onMsg?.(data)
}

function _handleDisconnect(peerId) {
  NetworkManager.players     = NetworkManager.players.filter(p => p.peerId !== peerId)
  NetworkManager.playerCount = NetworkManager.players.length
  const leaveMsg = { type: 'playerLeft', peerId }
  if (_isHost) {
    for (const c of _conns) { try { c.send(leaveMsg) } catch {} }
  }
  _onLeave?.(peerId)
}

function _peerCfg() {
  const cfg: any = {
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    },
  }
  if (_serverHost) {
    cfg.host   = _serverHost
    cfg.port   = _serverPort || 9000
    cfg.path   = '/'
    cfg.secure = false
  }
  return cfg
}
