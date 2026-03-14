import { buildFromData } from './LevelBuilder.ts'

// ── Individual map data files ─────────────────────────────────
import bank         from './maps/01_bank/index.ts'
// import jewelry      from './maps/02_jewelry/index.ts'
// import pawn         from './maps/03_pawn/index.ts'
// import office       from './maps/04_office/index.ts'
// import casino       from './maps/05_casino/index.ts'
// import museum       from './maps/06_museum/index.ts'
// import warehouse    from './maps/07_warehouse/index.ts'
// import hotel        from './maps/08_hotel/index.ts'
// import airport      from './maps/09_airport/index.ts'
// import penthouse    from './maps/10_penthouse/index.ts'
// import chemplant    from './maps/11_chemplant/index.ts'
// import policestation from './maps/12_policestation/index.ts'
// import techlab      from './maps/13_techlab/index.ts'
// import armored      from './maps/14_armored/index.ts'
// import dockyard     from './maps/15_dockyard/index.ts'
// import mall         from './maps/16_mall/index.ts'
// import powerplant   from './maps/17_powerplant/index.ts'
// import military     from './maps/18_military/index.ts'
// import prison       from './maps/19_prison/index.ts'
// import bunker       from './maps/20_bunker/index.ts'
// import hospital     from './maps/21_hospital/index.ts'

// ── Level registry ────────────────────────────────────────────
// Each entry adds a build() function that LevelBuilder uses.
// V1: only the bank map is active.
const _raw = [
  bank,
  // jewelry, pawn, office, casino, museum,
  // warehouse, hotel, airport, penthouse, chemplant, policestation,
  // techlab, armored, dockyard, mall, powerplant, military, prison, bunker,
  // hospital,
]

export const LEVELS = _raw.map(data => ({
  ...data,
  build: (scene) => buildFromData(scene, data),
}))
