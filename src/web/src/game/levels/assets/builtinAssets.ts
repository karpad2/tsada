// ─────────────────────────────────────────────────────────────
// Built-in asset presets — all 21 props serialized as shape data
// ─────────────────────────────────────────────────────────────

export const BUILTIN_ASSETS = [
  {
    id: 'builtin:barrel', name: 'Barrel', icon: '🛢', hp: 40,
    shapes: [
      { kind:'cyl', rT:0.25,  rB:0.25,  h:0.88,  color:0x2255BB, lx:0, ly:0.48, lz:0, segs:14, surface:'default' },
      { kind:'cyl', rT:0.275, rB:0.275, h:0.055, color:0x999999, lx:0, ly:0.08, lz:0, segs:14, surface:'metal' },
      { kind:'cyl', rT:0.275, rB:0.275, h:0.055, color:0x999999, lx:0, ly:0.48, lz:0, segs:14, surface:'metal' },
      { kind:'cyl', rT:0.275, rB:0.275, h:0.055, color:0x999999, lx:0, ly:0.88, lz:0, segs:14, surface:'metal' },
    ],
  },
  {
    id: 'builtin:cabinet', name: 'Cabinet', icon: '🗄', hp: 100,
    shapes: [
      { kind:'box', w:0.60, h:1.80, d:0.40, color:0x5A6470, lx:0, ly:0.90, lz:0,    surface:'metal' },
      { kind:'box', w:0.56, h:0.02, d:0.04, color:0x3A4450, lx:0, ly:0.90, lz:0.21, surface:'metal' },
      { kind:'box', w:0.56, h:0.02, d:0.04, color:0x3A4450, lx:0, ly:0.45, lz:0.21, surface:'metal' },
      { kind:'box', w:0.18, h:0.04, d:0.05, color:0xBBBBBB, lx:0, ly:1.22, lz:0.22, surface:'metal' },
      { kind:'box', w:0.18, h:0.04, d:0.05, color:0xBBBBBB, lx:0, ly:0.62, lz:0.22, surface:'metal' },
    ],
  },
  {
    id: 'builtin:cargobox', name: 'Cargo Box', icon: '📥', hp: 70,
    shapes: [
      { kind:'box', w:1.60, h:0.90, d:1.10, color:0xB09050, lx:0,     ly:0.45, lz:0,     surface:'wood' },
      { kind:'box', w:1.61, h:0.07, d:0.05, color:0x6B4C10, lx:0,     ly:0.45, lz:0.45,  surface:'wood' },
      { kind:'box', w:1.61, h:0.07, d:0.05, color:0x6B4C10, lx:0,     ly:0.45, lz:-0.45, surface:'wood' },
      { kind:'box', w:0.06, h:0.92, d:0.06, color:0x8B6A30, lx:-0.78, ly:0.46, lz:-0.54, surface:'wood' },
      { kind:'box', w:0.06, h:0.92, d:0.06, color:0x8B6A30, lx:0.78,  ly:0.46, lz:-0.54, surface:'wood' },
      { kind:'box', w:0.06, h:0.92, d:0.06, color:0x8B6A30, lx:-0.78, ly:0.46, lz:0.54,  surface:'wood' },
      { kind:'box', w:0.06, h:0.92, d:0.06, color:0x8B6A30, lx:0.78,  ly:0.46, lz:0.54,  surface:'wood' },
    ],
  },
  {
    id: 'builtin:console', name: 'Console', icon: '🖲', hp: 80,
    shapes: [
      { kind:'box',  w:1.40, h:1.10, d:0.60, color:0x1A1A26, lx:0,     ly:0.55, lz:0,    surface:'metal' },
      { kind:'boxE', w:1.10, h:0.55, d:0.04, color:0x112244, emissive:0x0033CC, ei:0.9, lx:0, ly:0.72, lz:0.32 },
      { kind:'box',  w:1.10, h:0.05, d:0.22, color:0x333340, lx:0,     ly:0.33, lz:0.30, surface:'metal' },
      { kind:'box',  w:0.08, h:0.08, d:0.08, color:0x00CC44, lx:-0.40, ly:1.05, lz:0.32, surface:'default' },
    ],
  },
  {
    id: 'builtin:consolepod', name: 'Console Pod', icon: '🕹', hp: 90,
    shapes: [
      { kind:'box',  w:2.40, h:1.00, d:0.80, color:0x1A1A30, lx:0,     ly:0.50, lz:0,    surface:'metal' },
      { kind:'boxE', w:2.00, h:0.55, d:0.04, color:0x112255, emissive:0x0044CC, ei:0.9, lx:0, ly:0.72, lz:0.42 },
      { kind:'box',  w:0.80, h:0.05, d:0.15, color:0x333344, lx:0,     ly:0.20, lz:0.41, surface:'metal' },
      { kind:'box',  w:0.08, h:0.08, d:0.08, color:0xFF4400, lx:0.90,  ly:0.98, lz:0.41, surface:'default' },
      { kind:'box',  w:0.08, h:0.08, d:0.08, color:0x00CC44, lx:-0.90, ly:0.98, lz:0.41, surface:'default' },
    ],
  },
  {
    id: 'builtin:container', name: 'Container', icon: '📦', hp: 600,
    shapes: [
      { kind:'box', w:2.40, h:2.60, d:6.00, color:0x2266AA, lx:0,     ly:1.30, lz:0,     surface:'metal' },
      { kind:'box', w:0.14, h:2.60, d:0.14, color:0x0A0A14, lx:-1.14, ly:1.30, lz:-2.88, surface:'metal' },
      { kind:'box', w:0.14, h:2.60, d:0.14, color:0x0A0A14, lx:1.14,  ly:1.30, lz:-2.88, surface:'metal' },
      { kind:'box', w:0.14, h:2.60, d:0.14, color:0x0A0A14, lx:-1.14, ly:1.30, lz:2.88,  surface:'metal' },
      { kind:'box', w:0.14, h:2.60, d:0.14, color:0x0A0A14, lx:1.14,  ly:1.30, lz:2.88,  surface:'metal' },
      { kind:'box', w:2.40, h:0.10, d:6.00, color:0x1A4A88, lx:0,     ly:2.57, lz:0,     surface:'metal' },
      { kind:'box', w:0.04, h:2.40, d:0.04, color:0x0A0A14, lx:0,     ly:1.30, lz:-2.99, surface:'metal' },
    ],
  },
  {
    id: 'builtin:counter', name: 'Counter', icon: '▬', hp: 120,
    shapes: [
      { kind:'box', w:3,    h:0.87, d:0.6,  color:0x9B6A1A, lx:0, ly:0.435, lz:0,    surface:'wood' },
      { kind:'box', w:3,    h:0.10, d:0.6,  color:0xD4C48A, lx:0, ly:0.95,  lz:0,    surface:'wood' },
      { kind:'box', w:3,    h:0.87, d:0.04, color:0x7A5018, lx:0, ly:0.435, lz:0.32, surface:'wood' },
    ],
  },
  {
    id: 'builtin:crate', name: 'Crate', icon: '📦', hp: 60,
    shapes: [
      { kind:'box', w:1.1,   h:1.1,  d:1.1,   color:0xD4A040, lx:0,      ly:0.55,  lz:0,      surface:'wood' },
      { kind:'box', w:1.11,  h:0.07, d:0.03,  color:0x8B5E20, lx:0,      ly:0.55,  lz:0.565,  surface:'metal' },
      { kind:'box', w:1.11,  h:0.07, d:0.03,  color:0x8B5E20, lx:0,      ly:0.55,  lz:-0.565, surface:'metal' },
      { kind:'box', w:0.03,  h:0.07, d:1.11,  color:0x8B5E20, lx:0.565,  ly:0.55,  lz:0,      surface:'metal' },
      { kind:'box', w:0.03,  h:0.07, d:1.11,  color:0x8B5E20, lx:-0.565, ly:0.55,  lz:0,      surface:'metal' },
    ],
  },
  {
    id: 'builtin:desk', name: 'Desk', icon: '🖥', hp: 80,
    shapes: [
      { kind:'box', w:2.2,  h:0.08, d:1.0,  color:0xD4972A, lx:0,     ly:0.84, lz:0,     surface:'wood' },
      { kind:'box', w:2.16, h:0.68, d:0.04, color:0xBB8020, lx:0,     ly:0.42, lz:0.49,  surface:'wood' },
      { kind:'box', w:0.07, h:0.80, d:0.07, color:0x7A4E14, lx:-1.04, ly:0.40, lz:-0.44, surface:'wood' },
      { kind:'box', w:0.07, h:0.80, d:0.07, color:0x7A4E14, lx:1.04,  ly:0.40, lz:-0.44, surface:'wood' },
      { kind:'box', w:0.07, h:0.80, d:0.07, color:0x7A4E14, lx:-1.04, ly:0.40, lz:0.44,  surface:'wood' },
      { kind:'box', w:0.07, h:0.80, d:0.07, color:0x7A4E14, lx:1.04,  ly:0.40, lz:0.44,  surface:'wood' },
    ],
  },
  {
    id: 'builtin:displayCase', name: 'Display Case', icon: '🔳', hp: 50,
    shapes: [
      { kind:'box', w:1.00, h:0.14, d:0.50, color:0xBB9944, lx:0,     ly:0.07, lz:0,     surface:'wood' },
      { kind:'box', w:0.96, h:1.00, d:0.46, color:0xAADDFF, lx:0,     ly:0.64, lz:0,     surface:'glass', opacity:0.3 },
      { kind:'box', w:1.00, h:0.05, d:0.50, color:0xBB9944, lx:0,     ly:1.17, lz:0,     surface:'wood' },
      { kind:'box', w:0.04, h:1.02, d:0.04, color:0x9B7A2A, lx:-0.47, ly:0.65, lz:-0.22, surface:'metal' },
      { kind:'box', w:0.04, h:1.02, d:0.04, color:0x9B7A2A, lx:0.47,  ly:0.65, lz:-0.22, surface:'metal' },
      { kind:'box', w:0.04, h:1.02, d:0.04, color:0x9B7A2A, lx:-0.47, ly:0.65, lz:0.22,  surface:'metal' },
      { kind:'box', w:0.04, h:1.02, d:0.04, color:0x9B7A2A, lx:0.47,  ly:0.65, lz:0.22,  surface:'metal' },
    ],
  },
  {
    id: 'builtin:filingcab', name: 'Filing Cabinet', icon: '🗃', hp: 90,
    shapes: [
      { kind:'box', w:0.50, h:1.30, d:0.60, color:0x5A7090, lx:0, ly:0.65, lz:0,    surface:'metal' },
      { kind:'box', w:0.44, h:0.26, d:0.04, color:0x6A88A8, lx:0, ly:0.42, lz:0.32, surface:'metal' },
      { kind:'box', w:0.44, h:0.26, d:0.04, color:0x6A88A8, lx:0, ly:0.73, lz:0.32, surface:'metal' },
      { kind:'box', w:0.44, h:0.26, d:0.04, color:0x6A88A8, lx:0, ly:1.04, lz:0.32, surface:'metal' },
      { kind:'box', w:0.14, h:0.04, d:0.05, color:0xBBBBBB, lx:0, ly:0.42, lz:0.35, surface:'metal' },
      { kind:'box', w:0.14, h:0.04, d:0.05, color:0xBBBBBB, lx:0, ly:0.73, lz:0.35, surface:'metal' },
      { kind:'box', w:0.14, h:0.04, d:0.05, color:0xBBBBBB, lx:0, ly:1.04, lz:0.35, surface:'metal' },
    ],
  },
  {
    id: 'builtin:table', name: 'Gaming Table', icon: '⬜', hp: 120,
    shapes: [
      { kind:'box', w:1.60, h:0.06, d:3.20, color:0x1A7A34, lx:0,     ly:0.86, lz:0,     surface:'fabric' },
      { kind:'box', w:1.60, h:0.08, d:0.06, color:0x3A2010, lx:0,     ly:0.90, lz:1.61,  surface:'wood' },
      { kind:'box', w:1.60, h:0.08, d:0.06, color:0x3A2010, lx:0,     ly:0.90, lz:-1.61, surface:'wood' },
      { kind:'box', w:0.06, h:0.08, d:3.20, color:0x3A2010, lx:0.83,  ly:0.90, lz:0,     surface:'wood' },
      { kind:'box', w:0.06, h:0.08, d:3.20, color:0x3A2010, lx:-0.83, ly:0.90, lz:0,     surface:'wood' },
      { kind:'box', w:0.09, h:0.86, d:0.09, color:0x5A3A18, lx:-0.75, ly:0.43, lz:-1.52, surface:'wood' },
      { kind:'box', w:0.09, h:0.86, d:0.09, color:0x5A3A18, lx:0.75,  ly:0.43, lz:-1.52, surface:'wood' },
      { kind:'box', w:0.09, h:0.86, d:0.09, color:0x5A3A18, lx:-0.75, ly:0.43, lz:1.52,  surface:'wood' },
      { kind:'box', w:0.09, h:0.86, d:0.09, color:0x5A3A18, lx:0.75,  ly:0.43, lz:1.52,  surface:'wood' },
    ],
  },
  {
    id: 'builtin:gurney', name: 'Gurney', icon: '🛏', hp: 50,
    shapes: [
      { kind:'box', w:0.70, h:0.05, d:1.90, color:0xBBBBBB, lx:0,     ly:0.72, lz:0,     surface:'metal' },
      { kind:'box', w:0.62, h:0.10, d:1.80, color:0xF0F0F0, lx:0,     ly:0.77, lz:0,     surface:'fabric' },
      { kind:'box', w:0.60, h:0.08, d:0.28, color:0xDDDDDD, lx:0,     ly:0.80, lz:-0.86, surface:'fabric' },
      { kind:'box', w:0.05, h:0.72, d:0.05, color:0xAAAAAA, lx:-0.30, ly:0.36, lz:-0.88, surface:'metal' },
      { kind:'box', w:0.05, h:0.72, d:0.05, color:0xAAAAAA, lx:0.30,  ly:0.36, lz:-0.88, surface:'metal' },
      { kind:'box', w:0.05, h:0.72, d:0.05, color:0xAAAAAA, lx:-0.30, ly:0.36, lz:0.88,  surface:'metal' },
      { kind:'box', w:0.05, h:0.72, d:0.05, color:0xAAAAAA, lx:0.30,  ly:0.36, lz:0.88,  surface:'metal' },
      { kind:'cyl', rT:0.06, rB:0.06, h:0.05, color:0x444444, lx:-0.30, ly:0.03, lz:-0.88, segs:10, surface:'rubber' },
      { kind:'cyl', rT:0.06, rB:0.06, h:0.05, color:0x444444, lx:0.30,  ly:0.03, lz:-0.88, segs:10, surface:'rubber' },
      { kind:'cyl', rT:0.06, rB:0.06, h:0.05, color:0x444444, lx:-0.30, ly:0.03, lz:0.88,  segs:10, surface:'rubber' },
      { kind:'cyl', rT:0.06, rB:0.06, h:0.05, color:0x444444, lx:0.30,  ly:0.03, lz:0.88,  segs:10, surface:'rubber' },
    ],
  },
  {
    id: 'builtin:locker', name: 'Locker', icon: '🔐', hp: 100,
    shapes: [
      { kind:'box', w:0.50, h:1.80, d:0.40, color:0x3A7AB8, lx:0,    ly:0.90, lz:0,    surface:'metal' },
      { kind:'box', w:0.44, h:0.04, d:0.03, color:0x2255AA, lx:0,    ly:1.68, lz:0.205, surface:'metal' },
      { kind:'box', w:0.44, h:0.04, d:0.03, color:0x2255AA, lx:0,    ly:1.54, lz:0.205, surface:'metal' },
      { kind:'box', w:0.02, h:1.70, d:0.02, color:0x1A4A88, lx:0,    ly:0.90, lz:0.21,  surface:'metal' },
      { kind:'box', w:0.04, h:0.22, d:0.06, color:0xCCCCCC, lx:0.10, ly:0.90, lz:0.21,  surface:'metal' },
    ],
  },
  {
    id: 'builtin:pedestal', name: 'Pedestal', icon: '🏛', hp: 60,
    shapes: [
      { kind:'box', w:0.70, h:0.10, d:0.70, color:0xDDDDDD, lx:0, ly:0.05, lz:0, surface:'concrete' },
      { kind:'box', w:0.36, h:0.90, d:0.36, color:0xF0F0F0, lx:0, ly:0.55, lz:0, surface:'concrete' },
      { kind:'box', w:0.60, h:0.10, d:0.60, color:0xDDDDDD, lx:0, ly:1.05, lz:0, surface:'concrete' },
      { kind:'box', w:0.54, h:0.06, d:0.54, color:0xEEEEEE, lx:0, ly:1.13, lz:0, surface:'concrete' },
    ],
  },
  {
    id: 'builtin:safe', name: 'Safe', icon: '🔒', hp: 350,
    shapes: [
      { kind:'box', w:0.80, h:1.00, d:0.60, color:0x263C26, lx:0,     ly:0.50, lz:0,    surface:'metal' },
      { kind:'box', w:0.74, h:0.92, d:0.04, color:0x1A2C1A, lx:0,     ly:0.50, lz:0.32, surface:'metal' },
      { kind:'box', w:0.06, h:0.28, d:0.06, color:0xAA8A00, lx:0.20,  ly:0.50, lz:0.35, surface:'metal' },
      { kind:'cyl', rT:0.07, rB:0.07, h:0.04, color:0xCCCCCC, lx:-0.15, ly:0.60, lz:0.35, segs:14, surface:'metal' },
      { kind:'cyl', rT:0.02, rB:0.02, h:0.06, color:0x888888, lx:-0.15, ly:0.60, lz:0.39, segs:14, surface:'metal' },
    ],
  },
  {
    id: 'builtin:server', name: 'Server Rack', icon: '🖨', hp: 80,
    shapes: [
      { kind:'box', w:0.60, h:2.00, d:0.80, color:0x0A0A14, lx:0, ly:1.0, lz:0, surface:'metal' },
      { kind:'box',  w:0.52, h:0.12, d:0.74, color:0x1A2235, lx:0,     ly:0.16, lz:0,    surface:'metal' },
      { kind:'boxE', w:0.06, h:0.04, d:0.04, color:0x00CC44, emissive:0x00CC44, ei:1.0, lx:-0.22, ly:0.16, lz:0.41 },
      { kind:'box',  w:0.52, h:0.12, d:0.74, color:0x1A2235, lx:0,     ly:0.44, lz:0,    surface:'metal' },
      { kind:'boxE', w:0.06, h:0.04, d:0.04, color:0xFF8800, emissive:0xFF8800, ei:1.0, lx:-0.22, ly:0.44, lz:0.41 },
      { kind:'box',  w:0.52, h:0.12, d:0.74, color:0x1A2235, lx:0,     ly:0.72, lz:0,    surface:'metal' },
      { kind:'boxE', w:0.06, h:0.04, d:0.04, color:0x00CC44, emissive:0x00CC44, ei:1.0, lx:-0.22, ly:0.72, lz:0.41 },
      { kind:'box',  w:0.52, h:0.12, d:0.74, color:0x1A2235, lx:0,     ly:1.00, lz:0,    surface:'metal' },
      { kind:'boxE', w:0.06, h:0.04, d:0.04, color:0x00CC44, emissive:0x00CC44, ei:1.0, lx:-0.22, ly:1.00, lz:0.41 },
      { kind:'box',  w:0.52, h:0.12, d:0.74, color:0x1A2235, lx:0,     ly:1.28, lz:0,    surface:'metal' },
      { kind:'boxE', w:0.06, h:0.04, d:0.04, color:0xFF8800, emissive:0xFF8800, ei:1.0, lx:-0.22, ly:1.28, lz:0.41 },
      { kind:'box',  w:0.52, h:0.12, d:0.74, color:0x1A2235, lx:0,     ly:1.56, lz:0,    surface:'metal' },
      { kind:'boxE', w:0.06, h:0.04, d:0.04, color:0x00CC44, emissive:0x00CC44, ei:1.0, lx:-0.22, ly:1.56, lz:0.41 },
    ],
  },
  {
    id: 'builtin:shelf', name: 'Shelf', icon: '📚', hp: 70,
    shapes: [
      { kind:'box', w:0.05, h:2.0, d:0.40, color:0x9B6A2A, lx:-0.97, ly:1.0,  lz:0,    surface:'wood' },
      { kind:'box', w:0.05, h:2.0, d:0.40, color:0x9B6A2A, lx:0.97,  ly:1.0,  lz:0,    surface:'wood' },
      { kind:'box', w:2.0,  h:2.0, d:0.04, color:0x9B6A2A, lx:0,     ly:1.0,  lz:-0.18, surface:'wood' },
      { kind:'box', w:1.90, h:0.05, d:0.40, color:0xC8902A, lx:0,     ly:0.05, lz:0,    surface:'wood' },
      { kind:'box', w:1.90, h:0.05, d:0.40, color:0xC8902A, lx:0,     ly:0.68, lz:0,    surface:'wood' },
      { kind:'box', w:1.90, h:0.05, d:0.40, color:0xC8902A, lx:0,     ly:1.32, lz:0,    surface:'wood' },
      { kind:'box', w:1.90, h:0.05, d:0.40, color:0xC8902A, lx:0,     ly:1.96, lz:0,    surface:'wood' },
    ],
  },
  {
    id: 'builtin:sofa', name: 'Sofa', icon: '🛋', hp: 70,
    shapes: [
      { kind:'box', w:2.20, h:0.10, d:0.85, color:0x3A2A50, lx:0,    ly:0.05, lz:0,     surface:'wood' },
      { kind:'box', w:2.20, h:0.30, d:0.80, color:0x7B4DAA, lx:0,    ly:0.35, lz:0,     surface:'fabric' },
      { kind:'box', w:2.20, h:0.48, d:0.18, color:0x7B4DAA, lx:0,    ly:0.64, lz:-0.33, surface:'fabric' },
      { kind:'box', w:0.18, h:0.46, d:0.80, color:0x5A3A88, lx:-1.1, ly:0.63, lz:0,     surface:'fabric' },
      { kind:'box', w:0.18, h:0.46, d:0.80, color:0x5A3A88, lx:1.1,  ly:0.63, lz:0,     surface:'fabric' },
      { kind:'box', w:0.03, h:0.25, d:0.04, color:0x5A3A88, lx:0,    ly:0.48, lz:0.38,  surface:'fabric' },
    ],
  },
  {
    id: 'builtin:tank', name: 'Tank', icon: '💧', hp: 250,
    shapes: [
      { kind:'cyl', rT:0.41, rB:0.41, h:1.95, color:0x22AA44, lx:0,    ly:1.05, lz:0, segs:14, surface:'metal' },
      { kind:'cyl', rT:0.43, rB:0.43, h:0.10, color:0x1A8833, lx:0,    ly:0.09, lz:0, segs:14, surface:'metal' },
      { kind:'cyl', rT:0.43, rB:0.43, h:0.10, color:0x1A8833, lx:0,    ly:2.02, lz:0, segs:14, surface:'metal' },
      { kind:'box', w:0.08, h:0.18, d:0.08, color:0x888888, lx:0.12, ly:2.19, lz:0,  surface:'metal' },
      { kind:'box', w:0.08, h:0.06, d:0.16, color:0x666666, lx:0.12, ly:2.14, lz:0,  surface:'metal' },
    ],
  },
  {
    id: 'builtin:fuelBarrel', name: 'Fuel Barrel', icon: '🔥', hp: 60,
    shapes: [
      { kind:'cyl', rT:0.27, rB:0.27, h:0.92, color:0xCC2222, lx:0, ly:0.50, lz:0, segs:14, surface:'metal' },
      { kind:'cyl', rT:0.29, rB:0.29, h:0.06, color:0x333333, lx:0, ly:0.08, lz:0, segs:14, surface:'metal' },
      { kind:'cyl', rT:0.29, rB:0.29, h:0.06, color:0x333333, lx:0, ly:0.50, lz:0, segs:14, surface:'metal' },
      { kind:'cyl', rT:0.29, rB:0.29, h:0.06, color:0x333333, lx:0, ly:0.92, lz:0, segs:14, surface:'metal' },
      { kind:'cyl', rT:0.28, rB:0.28, h:0.28, color:0xFF5500, lx:0, ly:0.50, lz:0, segs:14, surface:'default' },
    ],
  },
  {
    id: 'builtin:gasTank', name: 'Gas Tank', icon: '☢', hp: 120,
    shapes: [
      { kind:'cyl', rT:0.38, rB:0.38, h:1.80, color:0x44AA44, lx:0, ly:0.95, lz:0, segs:14, surface:'metal' },
      { kind:'cyl', rT:0.40, rB:0.40, h:0.08, color:0x338833, lx:0, ly:0.08, lz:0, segs:14, surface:'metal' },
      { kind:'cyl', rT:0.40, rB:0.40, h:0.08, color:0x338833, lx:0, ly:1.85, lz:0, segs:14, surface:'metal' },
      { kind:'cyl', rT:0.385, rB:0.385, h:0.10, color:0xFFCC00, lx:0, ly:0.50, lz:0, segs:14, surface:'default' },
      { kind:'cyl', rT:0.385, rB:0.385, h:0.10, color:0xFFCC00, lx:0, ly:1.40, lz:0, segs:14, surface:'default' },
    ],
  },
  {
    id: 'builtin:electricPanel', name: 'Electric Panel', icon: '⚡', hp: 80,
    shapes: [
      { kind:'box', w:0.70, h:0.90, d:0.18, color:0x555555, lx:0, ly:0.75, lz:0, surface:'metal' },
      { kind:'box', w:0.60, h:0.78, d:0.04, color:0x333333, lx:0, ly:0.75, lz:-0.10, surface:'metal' },
      { kind:'box', w:0.68, h:0.06, d:0.04, color:0xFFCC00, lx:0, ly:1.18, lz:-0.10, surface:'default' },
    ],
  },
  {
    id: 'builtin:workbench', name: 'Workbench', icon: '🔧', hp: 100,
    shapes: [
      { kind:'box', w:2.80, h:0.08, d:0.70, color:0xA07A3A, lx:0,     ly:0.89, lz:0,     surface:'wood' },
      { kind:'box', w:2.80, h:0.06, d:0.68, color:0x7A5A1A, lx:0,     ly:0.40, lz:0,     surface:'wood' },
      { kind:'box', w:0.07, h:0.88, d:0.07, color:0x5A3A18, lx:-1.32, ly:0.44, lz:-0.30, surface:'wood' },
      { kind:'box', w:0.07, h:0.88, d:0.07, color:0x5A3A18, lx:1.32,  ly:0.44, lz:-0.30, surface:'wood' },
      { kind:'box', w:0.07, h:0.88, d:0.07, color:0x5A3A18, lx:-1.32, ly:0.44, lz:0.30,  surface:'wood' },
      { kind:'box', w:0.07, h:0.88, d:0.07, color:0x5A3A18, lx:1.32,  ly:0.44, lz:0.30,  surface:'wood' },
    ],
  },
]
