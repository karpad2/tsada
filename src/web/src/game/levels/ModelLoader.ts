// ─────────────────────────────────────────────────────────────
// ModelLoader — OBJ + GLTF model loading with cache
// Place model files in public/models/.
// Usage in map data:
//   { type: 'model', x: 5, z: 10, src: 'models/chair.obj', scale: 1, rotY: 0 }
//   { type: 'model', x: 5, z: 10, src: 'models/lamp.glb', mtl: 'models/lamp.mtl' }
// ─────────────────────────────────────────────────────────────

import * as THREE from 'three'
import { OBJLoader }  from 'three/addons/loaders/OBJLoader.js'
import { MTLLoader }  from 'three/addons/loaders/MTLLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const _objLoader  = new OBJLoader()
const _mtlLoader  = new MTLLoader()
const _gltfLoader = new GLTFLoader()

// Cache: url → loaded Group (cloned on retrieval)
const _cache = new Map<string, THREE.Group>()

// ── OBJ loading (optionally with .mtl materials) ────────────
export async function loadOBJ(url: string, mtlUrl?: string): Promise<THREE.Group> {
  const key = mtlUrl ? `${url}|${mtlUrl}` : url

  if (_cache.has(key)) return _cache.get(key)!.clone()

  if (mtlUrl) {
    const mats = await _mtlLoader.loadAsync(mtlUrl)
    mats.preload()
    _objLoader.setMaterials(mats)
  }

  const obj = await _objLoader.loadAsync(url)
  _cache.set(key, obj)
  return obj.clone()
}

// ── GLTF / GLB loading ──────────────────────────────────────
export async function loadGLTF(url: string): Promise<THREE.Group> {
  if (_cache.has(url)) return _cache.get(url)!.clone()

  const gltf = await _gltfLoader.loadAsync(url)
  _cache.set(url, gltf.scene)
  return gltf.scene.clone()
}

// ── Universal loader — picks the right one by extension ─────
export function loadModel(url: string, mtlUrl?: string): Promise<THREE.Group> {
  const lc = url.toLowerCase()
  if (lc.endsWith('.gltf') || lc.endsWith('.glb')) return loadGLTF(url)
  return loadOBJ(url, mtlUrl)
}

// ── Apply shadow flags to all meshes in a group ─────────────
export function enableShadows(group: THREE.Object3D) {
  group.traverse(child => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}
