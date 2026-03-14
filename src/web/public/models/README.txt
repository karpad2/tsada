Place .obj, .mtl, .gltf, and .glb model files here.

They are served as static assets by Vite, accessible at /models/filename.obj

Usage in map data:
  { type: 'model', x: 5, z: 10, src: 'models/chair.obj', scale: 1, rotY: 0 }
  { type: 'model', x: 5, z: 10, src: 'models/lamp.glb', mtl: 'models/lamp.mtl' }

Properties:
  src   — path relative to public/ (required)
  mtl   — .mtl material file path (optional, OBJ only)
  scale — uniform scale factor (default: 1)
  rotY  — Y rotation in radians (default: 0)
  hp    — destructible health (default: 100)
  x, z  — world position
