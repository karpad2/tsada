// ── Structural ────────────────────────────────────────────────
export { addWall, addFloor, addCeiling, addPillar } from './structural/index.ts'

// ── Base prop factory (used by LevelBuilder for generic 'makeProp' type) ──
export { makeProp } from './_utils.ts'

// ── Props ─────────────────────────────────────────────────────
export { makeDesk }        from './props/desk/index.ts'
export { makeCrate }       from './props/crate/index.ts'
export { makeBarrel }      from './props/barrel/index.ts'
export { makeShelf }       from './props/shelf/index.ts'
export { makeCounter }     from './props/counter/index.ts'
export { makeContainer }   from './props/container/index.ts'
export { makeDisplayCase } from './props/displayCase/index.ts'
export { makeSafe }        from './props/safe/index.ts'
export { makeServerRack }  from './props/serverRack/index.ts'
export { makeGamingTable } from './props/gamingTable/index.ts'
export { makePedestal }    from './props/pedestal/index.ts'
export { makeFilingCab }   from './props/filingCab/index.ts'
export { makeLocker }      from './props/locker/index.ts'
export { makeSofa }        from './props/sofa/index.ts'
export { makeWorkbench }   from './props/workbench/index.ts'
export { makeTank }        from './props/tank/index.ts'
export { makeConsole }     from './props/console/index.ts'
export { makeCabinet }     from './props/cabinet/index.ts'
export { makeGurney }      from './props/gurney/index.ts'
export { makeCargoBox }    from './props/cargoBox/index.ts'
export { makeConsolePod }  from './props/consolePod/index.ts'
export { makeGasTank }     from './props/gasTank/index.ts'
export { makeFuelBarrel }  from './props/fuelBarrel/index.ts'
export { makeElectricPanel } from './props/electricPanel/index.ts'

// ── Vehicles ──────────────────────────────────────────────────
export { addVan }          from './vehicles/van/index.ts'
export { addTruck }        from './vehicles/truck/index.ts'
export { addCar }          from './vehicles/car/index.ts'
export { addArmoredTruck } from './vehicles/armoredTruck/index.ts'

// ── Specials ──────────────────────────────────────────────────
export { addEscapeDisc }   from './specials/escapeDisc/index.ts'
export { addBag }          from './specials/bag/index.ts'
export { addPointLight }   from './specials/pointLight/index.ts'
