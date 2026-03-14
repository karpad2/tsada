// ── Game Assets barrel re-export ─────────────────────────────
// Central entry point for all shared 3D asset builders and helpers.
// Import from here instead of going into levels/assets.js directly.

export {
  // Structural
  addWall, addFloor, addCeiling, addPillar,
  // Vehicles
  addVan, addTruck, addCar, addArmoredTruck,
  // Props (destructible)
  makeProp, makeDesk, makeCrate, makeBarrel, makeShelf,
  makeCounter, makeContainer, makeDisplayCase, makeSafe,
  makeServerRack, makeGamingTable, makePedestal,
  makeFilingCab, makeLocker, makeSofa, makeWorkbench,
  makeTank, makeConsole, makeCabinet, makeGurney,
  makeCargoBox, makeConsolePod,
  // Objectives / UI
  addBag, addEscapeDisc, addPointLight,
} from '../levels/assets.ts'

// Re-export textures helper
export { getTex } from '../levels/textures.ts'
