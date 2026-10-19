/**
 * SEV-1: Save the Bank — 3D Voxel World (PipeCraft-quality rebuild)
 * FPS/third-person camera, instanced block world, pointer-lock controls
 */
import * as THREE from 'three';

// ─── Palette ──────────────────────────────────────────────────────────────────
const P = {
  floorTile: 0xdde0e8, floorTile2: 0xc8ccd4, carpet: 0x2a1840, carpetLit: 0x3a2050,
  wall: 0x3F0E40, wallTrim: 0x5a1a6a, ceiling: 0x1a0828,
  glass: 0x4a9fd4, glassLit: 0x6bc4f0,
  desk: 0x3d2812, deskTop: 0x5a3a18, chair: 0x1a1a2a,
  server: 0x0d2240, serverLit: 0x1a3a58, serverFront: 0x0a1828,
  ledGreen: 0x00ff66, ledRed: 0xff2244, ledAmber: 0xffaa00, ledBlue: 0x00aaff,
  screen: 0x002244, screenOn: 0x004488, screenGlow: 0x0066cc,
  neonBlue: 0x36C5F0, neonCyan: 0x00e5ff, neonGreen: 0x2EB67D,
  neonRed: 0xE01E5A, neonAmber: 0xECB22E, neonPurple: 0x8833ff,
  alertRed: 0xff0033, alertAmber: 0xff8800,
  concreteLight: 0x5a5a70, concreteDark: 0x2a2a3a,
  railing: 0x4a3060, railingTop: 0x36C5F0,
  plant: 0x2a6a2a, plantDark: 0x1a4a1a, pot: 0xd9d4c7,
  wood: 0x6b4423,
  skyHigh: 0x0a0518, skyLow: 0x1a0a30, horizon: 0xff4400,
  bldgA: 0x1a2035, bldgB: 0x15182a, bldgC: 0x1e1535,
  pathCyan: 0x28d9f2,
  gold: 0xffc857,
  skin: 0xc68642, hairDark: 0x2a1a08, hairBrown: 0x6b3a1a, hairBlond: 0xc8a040,
  shirt1: 0x36C5F0, shirt2: 0x3F0E40, shirt3: 0x2EB67D, shirt4: 0xECB22E,
  trousers: 0x1a1a30, shoes: 0x111122,
  jacketPurple: 0x5a1a6a, natwestRed: 0xda2035,
};

// ─── Voxel world ──────────────────────────────────────────────────────────────
const solidBlocks = new Map();
const visualBlocks = []; // {x,y,z,color,emissive}

function bk(x, y, z) { return `${x|0},${y|0},${z|0}`; }

function setSolid(x, y, z, color, { emissive = 0 } = {}) {
  solidBlocks.set(bk(x|0, y|0, z|0), 1);
  visualBlocks.push({ x: x|0, y: y|0, z: z|0, color, emissive });
}

function vox(x, y, z, color, opts) { setSolid(x, y, z, color, opts); }

function fillBox(x0, y0, z0, x1, y1, z1, color, opts) {
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        setSolid(x, y, z, color, opts);
}

function fillFloor(x0, x1, z0, z1, y, color, opts) {
  fillBox(x0, y, z0, x1, y, z1, color, opts);
}

function isSolid(x, y, z) {
  return solidBlocks.has(bk(Math.floor(x), Math.floor(y), Math.floor(z)));
}

function getGround(x, z) {
  for (let y = 24; y >= -1; y--) {
    if (isSolid(x, y, z)) return y + 1;
  }
  return 0;
}

// ─── Build the banking HQ world ───────────────────────────────────────────────
function buildWorld() {
  buildOutdoorGround();
  buildCentralAtrium();
  buildDataCentre();
  buildCloudInfra();
  buildPayments();
  buildTradingFloor();
  buildOperationsCentre();
  buildSecurity();
  buildCustomerServices();
  buildStaircasesAndBridges();
  addDetails();
  buildHolographicTower();
}

function buildOutdoorGround() {
  // Outdoor plaza around the building
  fillFloor(-40, 40, -40, 40, 0, P.concreteDark);
  fillFloor(-38, 38, -38, 38, 0, P.concreteLight);
  // Cyan wayfinding path
  fillFloor(-4, 4, -38, 38, 0, P.pathCyan, { emissive: P.pathCyan });
  fillFloor(-38, 38, -4, 4, 0, P.pathCyan, { emissive: P.pathCyan });
  // Trees
  const treeSpots = [[-28,-28],[-28,28],[28,-28],[28,28],[-28,0],[28,0],[0,-28],[0,28]];
  treeSpots.forEach(([tx,tz]) => plantTree(tx, 1, tz));
  // Building foundation
  fillBox(-24, 1, -20, 24, 1, 20, P.floorTile);
}

function plantTree(x, y, z) {
  fillBox(x, y, z, x, y+4, z, P.wood);                          // trunk
  fillBox(x-2, y+3, z-2, x+2, y+6, z+2, P.plant);              // canopy
  fillBox(x-1, y+6, z-1, x+1, y+7, z+1, P.plant);
}

// NatWest cube logo (diagonal diamond arrangement of brand-colour voxels)
// Built on the back wall of the atrium (z=-19), centred at x=0, y=3..7
function buildNatwestLogo(cx, y0, cz) {
  // NatWest brand colours in their cube-logo arrangement
  // Rows are laid out as a diamond (widest in middle)
  const NW = P.natwestRed;   // NatWest red  #da2035
  const AU = 0x3F0E40;       // Aubergine
  const TB = 0x36C5F0;       // Teal blue
  const GR = 0x2EB67D;       // Green
  const rows = [
    [AU, TB],
    [NW, AU, TB, GR],
    [NW, NW, AU, AU, TB, TB, GR, GR],
    [NW, AU, TB, GR],
    [AU, GR],
  ];
  rows.forEach((row, ri) => {
    const w = row.length;
    row.forEach((col, ci) => {
      const x = cx - Math.floor(w / 2) + ci;
      const y = y0 + ri;
      vox(x, y, cz, col, { emissive: col });
    });
  });
}

// Central atrium — NatWest Technology Hub corporate lobby
function buildCentralAtrium() {
  const W=24, D=20, CH=8;

  // ── Floor — corporate white marble with brand-colour veining ──
  for (let x = -W; x <= W; x++)
    for (let z = -D; z <= D; z++) {
      // Base marble: white with slight texture variation
      const tone = ((x*3+z*7) & 7) < 2 ? 0xe0dce8 : 0xeceaf2;
      setSolid(x, 1, z, tone);
    }
  // Aubergine carpet in centre 7×7
  fillFloor(-7, 7, -7, 7, 1, 0x3F0E40);
  // Brand-colour cross inlaid in marble at FLOOR level (y=1, not raised)
  for (let x = -23; x <= 23; x++) setSolid(x, 1, 0,  0x2a1040);
  for (let z = -19; z <= 19; z++) setSolid(0, 1, z,  0x2a1040);
  // Neon LED floor strips at FLOOR level (y=1) so they don't block walking
  for (let i = -8; i <= 8; i++) {
    setSolid(i,  1, -8, P.neonBlue, { emissive: P.neonBlue });
    setSolid(i,  1,  8, P.neonBlue, { emissive: P.neonBlue });
    setSolid(-8, 1, i,  P.neonBlue, { emissive: P.neonBlue });
    setSolid( 8, 1, i,  P.neonBlue, { emissive: P.neonBlue });
  }

  // ── Outer walls — NatWest aubergine with panelling ──
  fillBox(-W, 2, -D, -W, CH, D,   0x3F0E40);
  fillBox( W, 2, -D,  W, CH, D,   0x3F0E40);
  fillBox(-W, 2, -D,  W, CH, -D,  0x3F0E40);
  fillBox(-W, 2,  D,  W, CH,  D,  0x3F0E40);
  // Skirting board (darker strip at base of walls)
  fillBox(-W, 2, -D,  W, 2, -D, 0x2a0830);
  fillBox(-W, 2,  D,  W, 2,  D, 0x2a0830);
  fillBox(-W, 2, -D, -W, 2,  D, 0x2a0830);
  fillBox( W, 2, -D,  W, 2,  D, 0x2a0830);
  // Cornice strip at top (lighter fascia)
  fillBox(-W, 8, -D,  W, 8, -D, P.wallTrim);
  fillBox(-W, 8,  D,  W, 8,  D, P.wallTrim);
  fillBox(-W, 8, -D, -W, 8,  D, P.wallTrim);
  fillBox( W, 8, -D,  W, 8,  D, P.wallTrim);

  // ── Glass windows on facade walls ──
  for (let x = -22; x <= 20; x += 5) {
    fillBox(x, 3, -D, x+3, 7, -D, 0x4ab0d8);
    fillBox(x, 3,  D, x+3, 7,  D, 0x4ab0d8);
  }
  // Window frames (slightly lighter than wall)
  for (let x = -22; x <= 20; x += 5) {
    vox(x-1, 3, -D, P.wallTrim); vox(x+4, 3, -D, P.wallTrim);
    vox(x-1, 7, -D, P.wallTrim); vox(x+4, 7, -D, P.wallTrim);
    vox(x-1, 3,  D, P.wallTrim); vox(x+4, 3,  D, P.wallTrim);
    vox(x-1, 7,  D, P.wallTrim); vox(x+4, 7,  D, P.wallTrim);
  }

  // ── Ceiling — coffered panels with LED strips ──
  for (let x = -W; x <= W; x++)
    for (let z = -D; z <= D; z++)
      setSolid(x, CH+1, z, ((x+z)%4===0) ? 0x1e0e30 : 0x1a0828);
  // LED strips: main grid
  for (let x = -20; x <= 20; x += 4) vox(x, CH, 0,  P.neonBlue, { emissive: P.neonBlue });
  for (let z = -16; z <= 16; z += 4) vox(0,  CH, z, P.neonBlue, { emissive: P.neonBlue });
  // Perimeter LED strip
  for (let x = -22; x <= 22; x++) {
    vox(x, CH, -18, P.neonPurple, { emissive: P.neonPurple });
    vox(x, CH,  18, P.neonPurple, { emissive: P.neonPurple });
  }
  for (let z = -18; z <= 18; z++) {
    vox(-22, CH, z, P.neonPurple, { emissive: P.neonPurple });
    vox( 22, CH, z, P.neonPurple, { emissive: P.neonPurple });
  }

  // ── Columns — placed away from walkways ──
  const colPositions = [
    [-18,-14], [-18,14], [18,-14], [18,14],
    [-18,  0], [18,   0],
  ];
  colPositions.forEach(([cx,cz]) => buildColumn(cx, 2, cz, CH, P.neonBlue));

  // ── Interior divider walls — with doorway openings at z=0 ──
  fillBox(-24, 2, -8, -24, 7, 8, 0x3F0E40);
  fillBox( 24, 2, -8,  24, 7, 8, 0x3F0E40);
  fillBox(-8,  2, -20,  8, 7, -20, 0x3F0E40);
  fillBox(-8,  2,  20,  8, 7,  20, 0x3F0E40);
  // Left inner wall: split into north/south segments leaving a 3-wide doorway at z=0
  fillBox(-8, 2, -12, -8, 7, -3, P.wallTrim);  // north segment
  fillBox(-8, 2,   3, -8, 7, 12, P.wallTrim);  // south segment
  // Right inner wall: same
  fillBox( 8, 2, -12,  8, 7, -3, P.wallTrim);
  fillBox( 8, 2,   3,  8, 7, 12, P.wallTrim);
  // Door frame highlights around openings
  for (let y = 2; y <= 5; y++) {
    vox(-8, y, -3, P.neonBlue, { emissive: P.neonBlue });
    vox(-8, y,  3, P.neonBlue, { emissive: P.neonBlue });
    vox( 8, y, -3, P.neonBlue, { emissive: P.neonBlue });
    vox( 8, y,  3, P.neonBlue, { emissive: P.neonBlue });
  }

  // ── NatWest cube logo on back wall ──
  buildNatwestLogo(0, 4, -19);
  // Electric blue brand strip above logo
  fillBox(-8, 8, -19, 8, 8, -19, P.neonBlue, { emissive: P.neonBlue });

  // ── Reception desk — L-shaped with screens ──
  // Main desk face
  fillBox(-5, 2, -13, 5, 2, -13, P.deskTop);
  fillBox(-5, 2, -13, 5, 3, -13, 0x3d2812);
  // Side wing
  fillBox( 5, 2, -15,  5, 3, -13, 0x3d2812);
  fillBox(-5, 2, -15, -5, 3, -13, 0x3d2812);
  // Monitors (5 across)
  for (let mx = -3; mx <= 3; mx += 2) {
    vox(mx,   3, -13, P.screenOn, { emissive: mx === 1 ? P.neonRed : P.neonBlue });
    vox(mx,   4, -13, P.screenOn, { emissive: mx === 1 ? P.neonRed : P.neonBlue });
  }
  // Desk lamp
  vox(-4, 4, -13, P.neonAmber, { emissive: P.neonAmber });
  vox( 4, 4, -13, P.neonAmber, { emissive: P.neonAmber });

  // ── Floor directional arrow strips ──
  for (let i = -5; i < 0; i++) vox(i, 2,  5, P.neonRed,   { emissive: P.neonRed   });
  for (let i = 0; i <= 5; i++) vox(i, 2,  5, P.neonAmber, { emissive: P.neonAmber });
  for (let i = -5; i < 0; i++) vox(i, 2, -5, P.neonGreen, { emissive: P.neonGreen });
  for (let i = 0; i <= 5; i++) vox(i, 2, -5, P.neonCyan,  { emissive: P.neonCyan  });

  // ── Central SEV-1 emergency beacon pillar ──
  fillBox(-1, 2, -1, 1, 4, 1, 0x3a0a40);
  fillBox(-1, 4, -1, 1, 4, 1, 0x2a0028);
  vox( 0, 5, 0, P.natwestRed, { emissive: P.natwestRed });
  vox( 0, 6, 0, P.neonRed,    { emissive: P.neonRed    });
  vox(-1, 5, 0, P.neonRed,    { emissive: P.neonRed    });
  vox( 1, 5, 0, P.neonRed,    { emissive: P.neonRed    });
  vox( 0, 5,-1, P.neonRed,    { emissive: P.neonRed    });
  vox( 0, 5, 1, P.neonRed,    { emissive: P.neonRed    });

  // ── Seating area (against the left wall, not blocking walkways) ──
  for (const [sx,sz] of [[-21,-5],[-21,-3],[-19,-5],[-19,-3]]) {
    setSolid(sx, 1, sz, P.carpet);  // carpet pad at floor level
    vox(sx, 2, sz, 0x1a1040); // seat
    vox(sx, 3, sz, 0x1a1040); // back
  }
  // Coffee table (floor-level surface)
  vox(-20, 2, -4, P.deskTop);

  // ── Info kiosks against right wall ──
  for (const [kx,kz] of [[21,-5],[21,5],[21,0]]) {
    vox(kx, 2, kz, 0x1a1030);
    vox(kx, 3, kz, P.screenOn, { emissive: P.neonBlue });
    vox(kx, 4, kz, P.screenOn, { emissive: P.neonBlue });
    vox(kx, 5, kz, P.neonCyan, { emissive: P.neonCyan });
  }
}

// NatWest Data Centre — hot/cold aisle, detailed racks, CRAC units, cable trays
// Room: x=-24..-14  z=-20..-10
function buildDataCentre() {
  // ── PCB circuit-board floor (dark green + copper traces)
  for (let x = -24; x <= -14; x++) {
    for (let z = -20; z <= -10; z++) {
      const hTrace = (z % 3 === 0);
      const vTrace = (x % 2 === 0);
      const pad    = hTrace && vTrace;
      const col = pad    ? 0x4a6820 :  // solder pad (bright green)
                  hTrace ? 0x2e4418 :  // horizontal trace
                  vTrace ? 0x283c14 :  // vertical trace
                           0x1a2810;   // PCB base (dark)
      setSolid(x, 1, z, col);
    }
  }

  // ── Walls — dark charcoal panels
  const DCWALL = 0x09101a;
  // Back wall with depth: two layers for visual thickness
  fillBox(-24, 2, -20, -14, 8, -20, DCWALL);
  fillBox(-24, 2, -20, -24, 8, -10, DCWALL); // left
  fillBox(-14, 2, -20, -14, 8, -10, DCWALL); // right
  fillBox(-24, 2, -10, -14, 8, -10, 0x121e2c); // front (slightly lighter)

  // Ceiling — varied panels
  for (let x = -24; x <= -14; x++)
    for (let z = -20; z <= -10; z++)
      setSolid(x, 9, z, ((x+z)%3===0) ? 0x0a0f18 : 0x080c14);

  // ── Wall detail: horizontal cable conduit runs ──
  // Left wall: data (cyan), power (magenta), mgmt (green)
  for (let z = -19; z >= -11; z--) {
    vox(-24, 7, z, P.neonCyan,  { emissive: P.neonCyan  });
    vox(-24, 6, z, 0xff44cc,    { emissive: 0xff44cc    });
    vox(-24, 5, z, P.neonGreen, { emissive: P.neonGreen });
  }
  // Right wall: network (blue), power (amber)
  for (let z = -19; z >= -11; z--) {
    vox(-14, 7, z, P.neonBlue,  { emissive: P.neonBlue  });
    vox(-14, 6, z, P.neonAmber, { emissive: P.neonAmber });
  }
  // Horizontal trim bands on all walls (lighter strip at y=3 = skirting)
  for (let x = -23; x <= -15; x++) {
    vox(x, 2, -20, 0x14202e);
    vox(x, 3, -20, 0x14202e);
    vox(x, 2, -10, 0x18283a);
    vox(x, 3, -10, 0x18283a);
  }

  // ── NatWest branding on back wall ──
  fillBox(-24, 7, -20, -14, 8, -20, 0x3F0E40);
  // Brand colour blocks spelling out NatWest identity
  vox(-23, 7, -20, P.natwestRed, { emissive: P.natwestRed });
  vox(-22, 7, -20, P.natwestRed, { emissive: P.natwestRed });
  vox(-21, 7, -20, P.neonBlue,   { emissive: P.neonBlue   });
  vox(-20, 7, -20, P.neonBlue,   { emissive: P.neonBlue   });
  vox(-19, 7, -20, P.neonGreen,  { emissive: P.neonGreen  });
  vox(-18, 7, -20, P.neonGreen,  { emissive: P.neonGreen  });
  vox(-17, 7, -20, P.neonAmber,  { emissive: P.neonAmber  });
  vox(-16, 7, -20, P.neonAmber,  { emissive: P.neonAmber  });

  // ── CRAC cooling units in the rack gaps ──
  buildCRAC(-22, 2, -19);  // left gap, row A
  buildCRAC(-16, 2, -19);  // right gap, row A
  buildCRAC(-22, 2, -15);  // left gap, row C (fault zone)
  buildCRAC(-16, 2, -13);  // right gap, row D

  // ── Overhead cable management trays (N-S runs on ceiling) ──
  for (let x = -23; x <= -15; x++) {
    vox(x, 8, -18, P.neonCyan,  { emissive: P.neonCyan  }); // over cold aisle A
    vox(x, 8, -16, 0xff44cc,    { emissive: 0xff44cc    }); // over hot aisle
    vox(x, 8, -14, P.neonCyan,  { emissive: P.neonCyan  }); // over cold aisle B
    vox(x, 8, -12, P.neonGreen, { emissive: P.neonGreen }); // NOC run
  }
  // Vertical drops from tray to racks
  for (const dropX of [-23, -21, -19, -17, -15]) {
    for (let y = 6; y <= 8; y++) {
      vox(dropX, y, -18, P.neonCyan, { emissive: P.neonCyan });
      vox(dropX, y, -16, 0xff44cc,   { emissive: 0xff44cc   });
    }
  }

  // ── Rack positions (5 individual 1-wide racks per row) ──
  const rxs = [-23, -21, -19, -17, -15];

  // Row A — z=-19, against back wall: all healthy
  rxs.forEach((rx, i) => {
    const pat = [
      ['G','G','G','G','G','G'],
      ['G','G','G','A','G','G'],
      ['G','G','G','G','G','B'],
      ['G','A','G','G','G','G'],
      ['G','G','G','G','B','G'],
    ][i];
    buildRack(rx, 2, -19, pat);
  });

  // ── Cold Aisle A — z=-18 (blue grate floor, player walkable) ──
  for (let x = -24; x <= -14; x++)
    vox(x, 2, -18, x % 2 === 0 ? P.neonBlue : 0x0a1828, { emissive: x%2===0 ? P.neonBlue : 0 });

  // Row B — z=-17: mixed health (degradation starting)
  rxs.forEach((rx, i) => {
    const pat = [
      ['G','G','A','G','G','A'],
      ['G','A','G','G','A','G'],
      ['A','G','A','A','G','A'], // most degraded rack
      ['G','G','G','A','G','G'],
      ['G','A','G','G','G','A'],
    ][i];
    buildRack(rx, 2, -17, pat);
  });

  // ── Hot Aisle — z=-16: amber hazard stripes ──
  for (let x = -24; x <= -14; x++)
    vox(x, 2, -16, x%2===0 ? P.ledAmber : 0x1a0900, { emissive: x%2===0 ? P.ledAmber : 0 });
  // Hot aisle warning strip on ceiling
  for (let x = -23; x <= -15; x++)
    vox(x, 8, -16, P.ledAmber, { emissive: P.ledAmber });

  // Row C — z=-15: FAULT ROW (incident location — all red/amber)
  rxs.forEach((rx, i) => {
    const pat = [
      ['R','R','A','R','R','R'],
      ['A','R','R','A','R','R'],
      ['R','R','R','R','R','R'], // total failure
      ['R','A','R','R','A','R'],
      ['R','R','A','R','R','A'],
    ][i];
    buildRack(rx, 2, -15, pat);
  });

  // ── Cold Aisle B — z=-14 ──
  for (let x = -24; x <= -14; x++)
    vox(x, 2, -14, x%2===1 ? P.neonBlue : 0x0a1828, { emissive: x%2===1 ? P.neonBlue : 0 });

  // Row D — z=-13: recovering (cyan = rebuild in progress)
  rxs.forEach((rx, i) => {
    const pat = [
      ['G','C','G','G','C','G'],
      ['C','G','C','G','G','C'],
      ['G','G','C','G','C','G'],
      ['C','G','G','C','G','G'],
      ['G','C','G','G','C','C'],
    ][i];
    buildRack(rx, 2, -13, pat);
  });

  // ── NOC workstation (z=-11, x=-22 to -16) ──
  // Desk surface
  fillBox(-22, 2, -11, -16, 2, -11, P.deskTop);
  fillBox(-22, 2, -11, -16, 3, -11, 0x2c1e0e);
  // 5 monitors: alternating blue/amber/red/blue/blue
  const monColors = [P.neonBlue, P.neonAmber, P.neonRed, P.neonBlue, P.neonBlue];
  for (let i = 0; i < 5; i++) {
    vox(-22+i, 3, -11, P.screenOn, { emissive: monColors[i] });
    vox(-22+i, 4, -11, P.screenOn, { emissive: monColors[i] }); // tall monitors
  }
  // Monitor stand bases
  for (const mx of [-22, -19, -16]) vox(mx, 2, -10, 0x1a2a3a);

  // ── Emergency stop panel (left wall) ──
  fillBox(-24, 3, -14, -24, 5, -14, 0x111111);
  vox(-24, 4, -14, P.alertRed, { emissive: P.alertRed }); // E-STOP
  vox(-24, 5, -14, P.neonAmber, { emissive: P.neonAmber }); // status

  // ── Env monitoring display (right wall) ──
  fillBox(-14, 3, -17, -14, 6, -13, 0x0a1828);
  vox(-14, 5, -17, P.neonCyan,  { emissive: P.neonCyan  }); // temp ok
  vox(-14, 4, -16, P.neonGreen, { emissive: P.neonGreen }); // humidity ok
  vox(-14, 3, -15, P.ledAmber,  { emissive: P.ledAmber  }); // power warn
  vox(-14, 5, -14, P.ledRed,    { emissive: P.ledRed    }); // alert

  // ── Floor cable conduits running along centre ──
  for (let z = -19; z >= -11; z--)
    vox(-19, 2, z, z%2===0 ? P.neonCyan : 0x081828, { emissive: z%2===0 ? P.neonCyan : 0 });

  zoneLabel(-19, 10, -15, 'NATWEST DATA CENTRE', P.neonBlue);
}

// Cloud & Infrastructure: x=14..24, z=12..20
function buildCloudInfra() {
  fillFloor(13, 24, 10, 20, 1, P.floorTile2);
  fillBox(24, 2, 10, 24, 8, 20, P.wall);
  fillBox(13, 2, 20, 24, 8, 20, P.wall);
  fillBox(13, 2, 10, 13, 8, 20, P.wallTrim);
  fillFloor(13, 24, 10, 20, 9, P.ceiling);
  // Network switch rack
  fillBox(22, 2, 12, 23, 4, 12, P.server);
  fillBox(22, 2, 15, 23, 4, 15, P.server);
  for (let u = 0; u < 3; u++) {
    vox(22, 2+u, 13, P.ledBlue, { emissive: P.ledBlue });
    vox(22, 2+u, 16, P.neonCyan, { emissive: P.neonCyan });
  }
  // Cloud symbol (glowing boxes)
  fillBox(17, 4, 19, 20, 5, 19, P.neonBlue, { emissive: P.neonBlue });
  vox(17, 6, 19, P.neonBlue, { emissive: P.neonBlue });
  vox(18, 6, 19, P.neonBlue, { emissive: P.neonBlue });
  vox(19, 6, 19, P.neonBlue, { emissive: P.neonBlue });
  // Floor strips
  for (let z = 11; z <= 19; z += 2) vox(16, 2, z, P.neonCyan, { emissive: P.neonCyan });
  zoneLabel(18, 8, 15, 'CLOUD & INFRA', P.neonCyan);
}

// Payments: x=14..24, z=-12..-2
function buildPayments() {
  fillFloor(13, 24, -12, -2, 1, P.carpet);
  fillBox(24, 2, -12, 24, 8, -2, P.wall);
  fillBox(13, 2, -12, 24, 8, -12, P.wall);
  fillBox(13, 2, -2, 24, 8, -2, P.wallTrim);
  fillBox(13, 2, -12, 13, 8, -2, P.wallTrim);
  fillFloor(13, 24, -12, -2, 9, P.ceiling);
  // Payment processing terminals (rows)
  for (let i = 0; i < 4; i++) {
    const z = -11 + i * 2;
    fillBox(22, 2, z, 23, 3, z, P.server);
    fillBox(21, 3, z, 21, 4, z, P.screenOn, { emissive: P.neonAmber });
    // Alert on first two
    vox(23, 4, z, i < 2 ? P.alertRed : P.ledGreen, { emissive: i < 2 ? P.alertRed : P.ledGreen });
  }
  // Transaction flow strips
  for (let z = -11; z <= -3; z++) vox(18, 2, z, P.neonAmber, { emissive: P.neonAmber });
  zoneLabel(18, 7, -7, 'PAYMENTS', P.neonAmber);
}

// Trading Floor (mezzanine level y=9): x=-24..-8, z=-20..-10
const MEZ = 9;
function buildTradingFloor() {
  // Floor — varied carpet tiles
  for (let x = -24; x <= -8; x++)
    for (let z = -20; z <= -10; z++)
      setSolid(x, MEZ, z, ((x+z)%3===0) ? P.carpet : P.carpetLit);

  fillFloor(-24, -8, -20, -10, MEZ+5, P.ceiling);
  // Walls with panelling
  fillBox(-24, MEZ+1, -20, -8,  MEZ+5, -20, P.wall);
  fillBox(-24, MEZ+1, -10, -8,  MEZ+5, -10, P.wallTrim);
  fillBox(-24, MEZ+1, -20, -24, MEZ+5, -10, P.wall);
  fillBox(-8,  MEZ+1, -20, -8,  MEZ+5, -10, P.wallTrim);
  // Trim bands on walls
  for (let x = -23; x <= -9; x++) {
    vox(x, MEZ+2, -20, P.wallTrim);
    vox(x, MEZ+4, -20, P.wallTrim);
  }
  // Ceiling: ticker strip
  for (let x = -23; x <= -9; x += 2)
    vox(x, MEZ+5, -15, P.neonAmber, { emissive: P.neonAmber });

  // 6 trading stations with dual monitors + chairs
  for (let i = 0; i < 6; i++) {
    const x = -23 + (i % 3) * 5;
    const z = -19 + Math.floor(i / 3) * 5;
    // Desk surface (3-wide)
    fillBox(x, MEZ+1, z, x+2, MEZ+1, z, P.deskTop);
    fillBox(x, MEZ+1, z, x+2, MEZ+2, z, P.desk);
    // Dual monitors
    vox(x,   MEZ+3, z, P.screenOn, { emissive: P.neonAmber });
    vox(x+1, MEZ+3, z, P.screenOn, { emissive: i < 2 ? P.neonRed : P.neonAmber });
    vox(x+2, MEZ+3, z, P.screenOn, { emissive: P.neonBlue });
    // Tall monitor stands
    vox(x,   MEZ+4, z, P.screenOn, { emissive: P.neonAmber });
    vox(x+2, MEZ+4, z, P.screenOn, { emissive: P.neonBlue });
    // Chair: seat + back
    vox(x+1, MEZ+1, z+1, P.chair);
    vox(x+1, MEZ+2, z+1, P.chair);
    vox(x+1, MEZ+3, z+1, 0x2a1040); // chair back (aubergine)
    // Coffee cup
    vox(x+1, MEZ+2, z, P.pot);
  }
  // Alert beacons
  vox(-16, MEZ+4, -15, P.alertRed,   { emissive: P.alertRed   });
  vox(-15, MEZ+4, -15, P.alertAmber, { emissive: P.alertAmber });
  vox(-14, MEZ+4, -15, P.alertRed,   { emissive: P.alertRed   });
  // Railing overlooking atrium
  for (let x = -22; x <= -10; x++) {
    vox(x, MEZ+1, -10, P.railing);
    vox(x, MEZ+2, -10, P.railingTop, { emissive: P.neonBlue });
  }
  zoneLabel(-16, MEZ+6, -15, 'TRADING FLOOR', P.neonAmber);
}

// Operations Centre (mezzanine): x=8..24, z=-20..-10
function buildOperationsCentre() {
  fillFloor(8, 24, -20, -10, MEZ, P.floorTile);
  fillFloor(8, 24, -20, -10, MEZ+5, P.ceiling);
  fillBox(8, MEZ+1, -20, 24, MEZ+5, -20, P.wall);
  fillBox(8, MEZ+1, -10, 24, MEZ+5, -10, P.wallTrim);
  fillBox(24, MEZ+1, -20, 24, MEZ+5, -10, P.wall);
  fillBox(8, MEZ+1, -20, 8, MEZ+5, -10, P.wallTrim);
  // Big monitoring wall
  fillBox(9, MEZ+2, -19, 23, MEZ+4, -19, P.screen, { emissive: P.screenGlow });
  fillBox(10, MEZ+2, -19, 22, MEZ+4, -19, P.screenOn, { emissive: P.neonBlue });
  // Desks facing the wall
  for (let i = 0; i < 4; i++) {
    const x = 10 + i * 3;
    fillBox(x, MEZ+1, -16, x+2, MEZ+1, -16, P.deskTop);
    fillBox(x, MEZ+1, -16, x+2, MEZ+2, -16, P.desk);
    vox(x+1, MEZ+3, -15, P.screenOn, { emissive: P.neonBlue });
  }
  // Railing
  for (let x = 9; x <= 23; x++) {
    vox(x, MEZ+1, -10, P.railing);
    vox(x, MEZ+2, -10, P.railingTop, { emissive: P.neonBlue });
  }
  zoneLabel(16, MEZ+5, -15, 'OPERATIONS CENTRE', P.neonBlue);
}

// Security (mezzanine): x=-24..-8, z=10..20
function buildSecurity() {
  fillFloor(-24, -8, 10, 20, MEZ, P.floorTile2);
  fillFloor(-24, -8, 10, 20, MEZ+5, P.ceiling);
  fillBox(-24, MEZ+1, 20, -8, MEZ+5, 20, P.wall);
  fillBox(-24, MEZ+1, 10, -8, MEZ+5, 10, P.wallTrim);
  fillBox(-24, MEZ+1, 10, -24, MEZ+5, 20, P.wall);
  fillBox(-8, MEZ+1, 10, -8, MEZ+5, 20, P.wallTrim);
  // Security consoles
  for (let i = 0; i < 3; i++) {
    const x = -22 + i * 4;
    fillBox(x, MEZ+1, 18, x+2, MEZ+2, 18, 0x0a0a1a);
    vox(x, MEZ+3, 17, P.alertRed, { emissive: P.alertRed });
    vox(x+1, MEZ+3, 17, P.screenOn, { emissive: 0x220000 });
  }
  // Red locked door
  fillBox(-12, MEZ+1, 19, -10, MEZ+4, 19, P.alertRed, { emissive: P.alertRed });
  vox(-11, MEZ+3, 19, 0x000000);
  // Railing
  for (let x = -23; x <= -9; x++) {
    vox(x, MEZ+1, 10, P.railing);
    vox(x, MEZ+2, 10, P.railingTop, { emissive: P.neonRed });
  }
  zoneLabel(-16, MEZ+5, 15, 'SECURITY', P.neonRed);
}

// Customer Services (mezzanine): x=8..24, z=10..20
function buildCustomerServices() {
  fillFloor(8, 24, 10, 20, MEZ, P.carpet);
  fillFloor(8, 24, 10, 20, MEZ+5, P.ceiling);
  fillBox(8, MEZ+1, 20, 24, MEZ+5, 20, P.wall);
  fillBox(8, MEZ+1, 10, 24, MEZ+5, 10, P.wallTrim);
  fillBox(24, MEZ+1, 10, 24, MEZ+5, 20, P.wall);
  fillBox(8, MEZ+1, 10, 8, MEZ+5, 20, P.wallTrim);
  // Service desks
  for (let i = 0; i < 5; i++) {
    const x = 9 + (i % 3) * 4;
    const z = 12 + Math.floor(i / 3) * 4;
    fillBox(x, MEZ+1, z, x+2, MEZ+2, z+1, P.deskTop);
    fillBox(x, MEZ+1, z, x+2, MEZ+3, z+1, P.desk);
    vox(x+1, MEZ+3, z, P.screenOn, { emissive: P.neonGreen });
  }
  // Railing
  for (let x = 9; x <= 23; x++) {
    vox(x, MEZ+1, 10, P.railing);
    vox(x, MEZ+2, 10, P.railingTop, { emissive: P.neonGreen });
  }
  zoneLabel(16, MEZ+5, 15, 'CUSTOMER SERVICES', P.neonGreen);
}

// Stairs and bridges connecting ground to mezzanine
// Each staircase: 8 steps, y=2..9, stepping into the mezzanine zone
function buildStaircasesAndBridges() {
  // ── North staircases (toward Trading Floor / Ops Centre, z decreasing) ──
  // Left-north: x=-24..-23, z starts at -8, steps to z=-15 as y 2→9
  for (let i = 0; i < 8; i++) {
    fillBox(-24, 2+i, -8-i, -23, 2+i, -8-i, P.concreteLight);
    vox(-24, 2+i, -8-i, P.neonBlue, { emissive: P.neonBlue }); // lit edge strip
  }
  // Right-north: x=23..24, same direction
  for (let i = 0; i < 8; i++) {
    fillBox(23, 2+i, -8-i, 24, 2+i, -8-i, P.concreteLight);
    vox(24, 2+i, -8-i, P.neonBlue, { emissive: P.neonBlue });
  }

  // ── South staircases (toward Security / Customer Services, z increasing) ──
  // Left-south: x=-24..-23, z starts at 8, steps to z=15
  for (let i = 0; i < 8; i++) {
    fillBox(-24, 2+i, 8+i, -23, 2+i, 8+i, P.concreteLight);
    vox(-24, 2+i, 8+i, P.neonRed, { emissive: P.neonRed });
  }
  // Right-south: x=23..24
  for (let i = 0; i < 8; i++) {
    fillBox(23, 2+i, 8+i, 24, 2+i, 8+i, P.concreteLight);
    vox(24, 2+i, 8+i, P.neonGreen, { emissive: P.neonGreen });
  }

  // ── Mezzanine bridge corridors (flat walkways at y=MEZ) ──
  // North bridge left
  fillFloor(-24, -8, -10, -8, MEZ, P.floorTile);
  // North bridge right
  fillFloor(8, 24, -10, -8, MEZ, P.floorTile);
  // South bridge left
  fillFloor(-24, -8, 8, 10, MEZ, P.floorTile);
  // South bridge right
  fillFloor(8, 24, 8, 10, MEZ, P.floorTile);

  // Railings on north bridges
  for (let x = -22; x <= -10; x++) {
    vox(x, MEZ+1, -8, P.railing);
    vox(x, MEZ+2, -8, P.railingTop, { emissive: P.neonBlue });
  }
  for (let x = 10; x <= 22; x++) {
    vox(x, MEZ+1, -8, P.railing);
    vox(x, MEZ+2, -8, P.railingTop, { emissive: P.neonGreen });
  }
  // Railings on south bridges
  for (let x = -22; x <= -10; x++) {
    vox(x, MEZ+1, 10, P.railing);
    vox(x, MEZ+2, 10, P.railingTop, { emissive: P.neonRed });
  }
  for (let x = 10; x <= 22; x++) {
    vox(x, MEZ+1, 10, P.railing);
    vox(x, MEZ+2, 10, P.railingTop, { emissive: P.neonGreen });
  }
}

function addDetails() {
  // ── Atrium: tall potted plants in corners ──
  [[-20,-16],[-20,16],[20,-16],[20,16],[-12,-16],[-12,16],[12,-16],[12,16]].forEach(([x,z]) => {
    vox(x, 2, z, P.pot);       // ceramic pot
    vox(x, 3, z, P.plantDark); // stem
    vox(x-1, 4, z, P.plant); vox(x+1, 4, z, P.plant);
    vox(x, 4, z-1, P.plant);  vox(x, 4, z+1, P.plant);
    vox(x, 5, z, P.plant);
    vox(x-1, 5, z, P.plantDark); vox(x+1, 5, z, P.plantDark);
  });

  // ── Corridor lighting strips at zone transitions ──
  for (let x = -6; x <= 6; x++) {
    vox(x, 9, -9, P.neonBlue, { emissive: P.neonBlue });
    vox(x, 9,  9, P.neonBlue, { emissive: P.neonBlue });
  }
  for (let z = -8; z <= 8; z++) {
    vox(-9, 9, z, P.neonPurple, { emissive: P.neonPurple });
    vox(  9, 9, z, P.neonPurple, { emissive: P.neonPurple });
  }

  // ── Wayfinding floor arrows ──
  for (let i = 0; i < 3; i++) {
    vox(-1+i, 2, -11, P.neonAmber, { emissive: P.neonAmber });
    vox(-1+i, 2,  11, P.neonGreen, { emissive: P.neonGreen });
    vox(-11,  2, -1+i, P.neonRed,  { emissive: P.neonRed   });
    vox( 11,  2, -1+i, P.neonCyan, { emissive: P.neonCyan  });
  }

  // ── Drink/snack machine near entrance ──
  vox(-21, 2, -6, 0x1a1a2a);
  vox(-21, 3, -6, P.screenOn, { emissive: P.neonCyan });
  vox(-21, 4, -6, P.screenOn, { emissive: P.neonCyan });
  vox(-21, 5, -6, 0x2a2a3a);
  // Second machine
  vox(-21, 2, -4, 0x1a2a1a);
  vox(-21, 3, -4, P.screenOn, { emissive: P.neonGreen });
  vox(-21, 4, -4, P.screenOn, { emissive: P.neonGreen });
  vox(-21, 5, -4, 0x1a2a1a);

  // ── Security turnstile by atrium entrance ──
  for (const tx of [-2, 0, 2]) {
    vox(tx, 2, 17, 0x1a1030);
    vox(tx, 3, 17, P.neonBlue, { emissive: P.neonBlue });
  }

  // ── Mezzanine railing along atrium void ──
  for (let x = -7; x <= 7; x++) {
    vox(x, MEZ+1, -9, 0x3a1850);
    vox(x, MEZ+2, -9, P.neonBlue, { emissive: P.neonBlue });
    vox(x, MEZ+1,  9, 0x3a1850);
    vox(x, MEZ+2,  9, P.neonGreen, { emissive: P.neonGreen });
  }
  for (let z = -9; z <= 9; z++) {
    vox(-7, MEZ+1, z, 0x3a1850);
    vox(-7, MEZ+2, z, P.neonPurple, { emissive: P.neonPurple });
    vox( 7, MEZ+1, z, 0x3a1850);
    vox( 7, MEZ+2, z, P.neonPurple, { emissive: P.neonPurple });
  }

  // ── Extra detail in zone corridors ──
  // Extinguisher cabinets every 8 blocks along corridors
  for (const [ex,ez] of [[-23,0],[23,0],[0,-19],[0,19],[-10,-10],[10,-10],[-10,10],[10,10]]) {
    vox(ex, 2, ez, 0x1a0a0a);
    vox(ex, 3, ez, P.alertRed, { emissive: P.alertRed });
  }

  // ── Trading floor: extra screens and props ──
  for (let x = -22; x <= -10; x += 3) {
    vox(x, MEZ+5, -11, P.neonAmber, { emissive: P.neonAmber }); // ceiling tickers
  }

  // ── Operations centre: wall-mounted screens ──
  fillBox(10, MEZ+2, -19, 22, MEZ+4, -19, P.screenOn, { emissive: P.neonBlue });
  // Individual screen panels within the monitoring wall
  for (let x = 10; x <= 22; x += 3)
    vox(x, MEZ+3, -19, P.screenOn, { emissive: x < 16 ? P.neonGreen : P.neonAmber });

  // ── Security: biometric scanners on mez ──
  for (const [sx,sz] of [[-20,12],[-16,12],[-12,12]]) {
    vox(sx, MEZ+3, sz, P.screenOn, { emissive: P.neonRed });
    vox(sx, MEZ+4, sz, P.neonRed,  { emissive: P.neonRed });
  }
}

// Zone label helper (thin vertical sign built from blocks)
function zoneLabel(x, y, z, _name, _color) {
  vox(x, y, z, P.wall);
  vox(x, y+1, z, _color, { emissive: _color });
}

// Detailed 1-wide rack column. statuses = array of chars per U-slot:
//   G=green(ok), A=amber(warn), R=red(fault), C=cyan(rebuild), B=blue(idle), W=off
function buildRack(x, baseY, z, statuses) {
  const LED = {
    G: P.ledGreen, A: P.ledAmber, R: P.ledRed,
    C: P.neonCyan, B: P.neonBlue, W: 0x223344
  };
  // Rack body tones alternate slightly per U-slot to simulate panel seams
  const tones = [0x06101c, 0x091420, 0x0a121e, 0x081018, 0x0c1528, 0x080f1a, 0x0b1326];
  for (let i = 0; i < statuses.length; i++) {
    const em = LED[statuses[i]] ?? P.ledGreen;
    setSolid(x, baseY + i, z, tones[i % tones.length], { emissive: em });
  }
  setSolid(x, baseY + statuses.length,     z, 0x192838); // cable mgmt bar
  setSolid(x, baseY + statuses.length + 1, z, 0x0c1424); // vent cap
}

// CRAC cooling unit (1 wide, 4 tall)
function buildCRAC(x, baseY, z) {
  setSolid(x, baseY,   z, 0x05101a);
  setSolid(x, baseY+1, z, 0x081828, { emissive: P.neonCyan });
  setSolid(x, baseY+2, z, 0x091a30, { emissive: P.neonBlue });
  setSolid(x, baseY+3, z, 0x0a1c32, { emissive: P.neonCyan });
  setSolid(x, baseY+4, z, 0x0c2040);
}

// Column / pillar (1×1 footprint, decorative — aubergine base, neon cap)
function buildColumn(x, baseY, z, h, capColor) {
  for (let y = 0; y < h; y++) {
    setSolid(x, baseY + y, z,
      y === 0        ? 0x2a0a30 :
      y === h-1      ? capColor  :
      y % 4 === 0    ? P.wallTrim :
                       P.wall,
      y === h-1 ? { emissive: capColor } : {});
  }
}

// Holographic data-core tower — animates in tick()
const holoRings = [];
function buildHolographicTower() {
  const g = new THREE.Group();

  // Core column: 14 blocks tall, deep blue glow
  for (let yi = 0; yi < 14; yi++) {
    const shade = new THREE.Color().setHSL(0.62, 0.9, 0.12 + yi * 0.018);
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 1.05, 0.55),
      new THREE.MeshStandardMaterial({ color: shade, emissive: shade, emissiveIntensity: 1.4, roughness: 0.15 })
    );
    m.position.y = yi + 2.5;
    g.add(m);
  }

  // Spinning rings at 6 heights
  const ringCols = [0x0066ff, 0x0099ff, 0x00ccff, 0x44eeff, 0x88ffcc, 0xffffff];
  ringCols.forEach((col, ri) => {
    const rg = new THREE.Group();
    rg.position.y = 3.5 + ri * 2.2;
    const radius  = 1.1 + ri * 0.18;
    const mat = new THREE.MeshStandardMaterial({
      color: col, emissive: new THREE.Color(col), emissiveIntensity: 1.3,
      roughness: 0.2, transparent: true, opacity: 0.88
    });
    const segCount = 6 + ri;
    for (let si = 0; si < segCount; si++) {
      const a = (si / segCount) * Math.PI * 2;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18 + ri * 0.04, 0.3), mat);
      m.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      rg.add(m);
    }
    g.add(rg);
    holoRings.push({ rg, speed: 0.35 + ri * 0.12, dir: ri % 2 === 0 ? 1 : -1 });
  });

  // Base platform ring (wide, static)
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x001144, emissive: new THREE.Color(0x003399), emissiveIntensity: 0.9, roughness: 0.3 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const bm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), baseMat);
    bm.position.set(Math.cos(a) * 2.5, 2.15, Math.sin(a) * 2.5);
    g.add(bm);
  }

  g.position.set(0.5, 1, 0.5);
  scene.add(g);
  return g;
}

// ─── Three.js setup ───────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.2;
document.getElementById('renderer-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x2a1060, 60, 140);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 200);

function resizeRenderer() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeRenderer);
resizeRenderer();

// ─── Lights ───────────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0xd0c8ff, 5.5);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff4e0, 3.5);
sun.position.set(15, 40, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 120;
sun.shadow.camera.left = sun.shadow.camera.bottom = -40;
sun.shadow.camera.right = sun.shadow.camera.top = 40;
scene.add(sun);

// Fill light from opposite direction so shadows aren't pitch black
const fillLight = new THREE.DirectionalLight(0x80a0ff, 1.5);
fillLight.position.set(-10, 20, -15);
scene.add(fillLight);

function ptLight(x, y, z, color, intensity, dist) {
  const l = new THREE.PointLight(color, intensity, dist);
  l.position.set(x, y, z);
  scene.add(l);
  return l;
}
// Atrium lights — very bright
ptLight(0, 8, 0, 0xaa66ff, 20, 35);
ptLight(0, 3, 0, 0x36C5F0, 14, 26);
// Zone fills — cranked up
ptLight(-19, 5, -15, 0x22aaff, 18, 28);  // data centre
ptLight(18, 5, 15, 0x00e5ff, 16, 26);    // cloud
ptLight(18, 5, -7, 0xffaa00, 16, 24);    // payments
ptLight(-16, 14, -15, 0xffcc00, 18, 28); // trading floor
ptLight(16, 14, -15, 0x22aaff, 18, 28);  // ops centre
ptLight(-16, 14, 15, 0xff2244, 16, 26);  // security
ptLight(16, 14, 15, 0x22ff88, 16, 26);   // customer services
// Corridor fills
ptLight(0, 4, -14, 0x7799ff, 10, 20);
ptLight(0, 4,  14, 0x7799ff, 10, 20);
ptLight(-12, 4, 0, 0xaa66ff, 8, 18);
ptLight( 12, 4, 0, 0xaa66ff, 8, 18);

const hemi = new THREE.HemisphereLight(0x8866ff, 0x4422aa, 3.0);
scene.add(hemi);

// Zone alert lights — start dark, turn red when incidents active
const zoneLights = {
  beacon:     (() => { const l = new THREE.PointLight(0xff0033, 0, 22); l.position.set( 0,  5,  0); scene.add(l); return l; })(),
  datacenter: (() => { const l = new THREE.PointLight(0xff1122, 0, 24); l.position.set(-19, 5,-15); scene.add(l); return l; })(),
  cloud:      (() => { const l = new THREE.PointLight(0xff2200, 0, 22); l.position.set( 18, 5, 15); scene.add(l); return l; })(),
  payments:   (() => { const l = new THREE.PointLight(0xff3300, 0, 20); l.position.set( 18, 5, -7); scene.add(l); return l; })(),
  ops:        (() => { const l = new THREE.PointLight(0xff0044, 0, 22); l.position.set( 16,14,-15); scene.add(l); return l; })(),
};

// ─── Instanced block renderer ─────────────────────────────────────────────────
const matCache = new Map();
function getMat(color, emissive) {
  const k = `${color}_${emissive}`;
  if (!matCache.has(k)) {
    matCache.set(k, new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: emissive ? new THREE.Color(emissive) : new THREE.Color(0),
      emissiveIntensity: emissive ? 1.8 : 0,
      roughness: 0.65,
      metalness: emissive ? 0.2 : 0,
    }));
  }
  return matCache.get(k);
}

function buildInstancedMeshes() {
  // Group blocks by material key
  const groups = new Map();
  for (const blk of visualBlocks) {
    const k = `${blk.color}_${blk.emissive}`;
    if (!groups.has(k)) groups.set(k, { color: blk.color, emissive: blk.emissive, positions: [] });
    groups.get(k).positions.push([blk.x, blk.y, blk.z]);
  }
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const m4 = new THREE.Matrix4();
  for (const [k, grp] of groups) {
    const mesh = new THREE.InstancedMesh(geo, getMat(grp.color, grp.emissive), grp.positions.length);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    grp.positions.forEach(([x, y, z], i) => {
      m4.makeTranslation(x + 0.5, y + 0.5, z + 0.5);
      mesh.setMatrixAt(i, m4);
    });
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
  }
}

// ─── Sky ──────────────────────────────────────────────────────────────────────
function buildSky() {
  const skyGeo = new THREE.SphereGeometry(150, 16, 8);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    fog: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `
      varying vec3 vPos;
      void main(){
        float t=clamp((vPos.y+20.)/80.,0.,1.);
        vec3 top=vec3(0.05,0.12,0.38);
        vec3 mid=vec3(0.12,0.28,0.60);
        vec3 hor=vec3(0.70,0.30,0.10);
        vec3 col=mix(mix(hor,mid,smoothstep(0.,.22,t)),mix(mid,top,smoothstep(.22,1.,t)),step(.22,t));
        gl_FragColor=vec4(col,1.);
      }`,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // City skyline buildings
  const rng = makeRng(7);
  const bMat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1 });
  const bCols = [P.bldgA, P.bldgB, P.bldgC];
  for (let i = 0; i < 24; i++) {
    const h = 10 + rng() * 35;
    const w = 4 + rng() * 6;
    const d = 4 + rng() * 6;
    const angle = (i / 24) * Math.PI * 2;
    const r = 55 + rng() * 20;
    const bx = Math.cos(angle) * r;
    const bz = Math.sin(angle) * r;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bMat(bCols[i % 3]));
    b.position.set(bx, h/2 - 2, bz);
    scene.add(b);
    // Windows
    for (let wy = 2; wy < h; wy += 3) {
      for (let wx = -1; wx <= 1; wx++) {
        if (rng() > 0.4) {
          const win = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.6, 0.1),
            new THREE.MeshBasicMaterial({ color: rng() > 0.5 ? 0xECB22E : 0x36C5F0 })
          );
          win.position.set(bx + wx * 1.5, wy, bz - d/2 - 0.05);
          scene.add(win);
        }
      }
    }
  }
}

function makeRng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

// ─── NPC characters ───────────────────────────────────────────────────────────
const npcAnimated = [];

// Roles: 'branch' | 'engineering' | 'security' | 'product' | 'leadership' | 'ai'
function makeNPC(x, y, z, role) {
  const rng = makeRng((x * 31 + z * 17) & 0xffff);
  const g = new THREE.Group();

  function part(w,h,d,col,ox,oy,oz,em=0) {
    const mat = new THREE.MeshStandardMaterial({
      color: col, roughness: 0.8,
      emissive: em ? new THREE.Color(em) : undefined,
      emissiveIntensity: em ? 0.7 : 0,
    });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    m.position.set(ox,oy,oz);
    g.add(m);
    return m;
  }

  const skinTones = [0xc68642, 0xd4956a, 0x8d5524, 0xe8b89a];
  const skin = skinTones[Math.floor(rng() * skinTones.length)];
  const hairCols = [P.hairDark, P.hairBrown, P.hairBlond, 0x1a1a1a];
  const hair = hairCols[Math.floor(rng() * hairCols.length)];

  let lleg, rleg;

  if (role === 'ai') {
    // Floating blue robot
    part(0.8,0.8,0.6, 0x1a4a8a, 0, 0.4, 0);                          // torso
    part(0.7,0.65,0.65, 0x2266cc, 0, 1.1, 0);                         // head
    part(0.1,0.5,0.1, P.neonBlue, 0, 1.6, 0, P.neonBlue);            // antenna
    part(0.15,0.15,0.15, P.neonCyan, 0, 1.6, 0, P.neonCyan);         // antenna tip
    part(0.28,0.2,0.1, P.neonBlue, -0.15, 1.1, 0.34, P.neonBlue);   // eye L
    part(0.28,0.2,0.1, P.neonBlue,  0.15, 1.1, 0.34, P.neonBlue);   // eye R
    part(0.25,0.55,0.25, 0x1a4a8a, -0.55, 0.38, 0);                   // arm L
    part(0.25,0.55,0.25, 0x1a4a8a,  0.55, 0.38, 0);                   // arm R
    lleg = part(0.3,0.45,0.3, 0x163a70, -0.2, -0.225, 0);
    rleg = part(0.3,0.45,0.3, 0x163a70,  0.2, -0.225, 0);
    g.position.set(x + 0.5, y + 1.5, z + 0.5); // floats slightly higher
  } else if (role === 'engineering') {
    // Hoodie, casual — SRE/DevOps/Platform engineers
    const hoodieCols = [0x3a2060, 0x1e3a5a, 0x2a4030, 0x3a1a1a];
    const hoodie = hoodieCols[Math.floor(rng() * hoodieCols.length)];
    part(0.65,0.85,0.45, hoodie, 0, 0.425, 0);     // body/hoodie
    part(0.55,0.55,0.55, skin, 0, 1.1, 0);          // head
    part(0.55,0.2,0.57, hair, 0, 1.38, 0);          // hair
    part(0.16,0.12,0.05, 0x888888, -0.14, 1.1, 0.29); // glasses L
    part(0.16,0.12,0.05, 0x888888,  0.14, 1.1, 0.29); // glasses R
    lleg = part(0.24,0.52,0.24, 0x222235, -0.18, -0.26, 0); // dark jeans
    rleg = part(0.24,0.52,0.24, 0x222235,  0.18, -0.26, 0);
    part(0.18,0.12,0.28, 0x333355, -0.18, -0.56, 0);  // trainers L
    part(0.18,0.12,0.28, 0x333355,  0.18, -0.56, 0);  // trainers R
    part(0.22,0.55,0.22, hoodie, -0.48, 0.38, 0);      // arm L
    part(0.22,0.55,0.22, hoodie,  0.48, 0.38, 0);      // arm R
    // Laptop in hand
    part(0.35,0.22,0.04, 0x444455, 0.6, 0.45, 0.12);
    g.position.set(x + 0.5, y + 1.2, z + 0.5);
  } else if (role === 'security') {
    // Dark uniform, badge
    part(0.65,0.85,0.45, 0x1a1a2a, 0, 0.425, 0);  // dark jacket
    part(0.55,0.55,0.55, skin, 0, 1.1, 0);          // head
    part(0.55,0.2,0.57, hair, 0, 1.38, 0);          // hair
    lleg = part(0.24,0.52,0.24, 0x0a0a14, -0.18, -0.26, 0); // black trousers
    rleg = part(0.24,0.52,0.24, 0x0a0a14,  0.18, -0.26, 0);
    part(0.18,0.12,0.28, 0x111118, -0.18, -0.56, 0);  // boots
    part(0.18,0.12,0.28, 0x111118,  0.18, -0.56, 0);
    part(0.22,0.55,0.22, 0x1a1a2a, -0.48, 0.38, 0);   // arm L
    part(0.22,0.55,0.22, 0x1a1a2a,  0.48, 0.38, 0);   // arm R
    part(0.18,0.12,0.06, P.neonAmber, 0.18, 0.72, 0.25, P.neonAmber); // badge (glows)
    part(0.12,0.06,0.04, 0xffffff, -0.22, 0.65, 0.25); // name tag
    g.position.set(x + 0.5, y + 1.2, z + 0.5);
  } else if (role === 'leadership') {
    // Smart business attire — suit jacket
    const suitCols = [0x3F0E40, 0x1a2055, 0x222222, 0x2a1a40];
    const suit = suitCols[Math.floor(rng() * suitCols.length)];
    part(0.65,0.85,0.45, suit, 0, 0.425, 0);     // jacket
    part(0.2,0.55,0.12, 0xffffff, 0, 0.5, 0.24); // shirt front
    part(0.06,0.35,0.08, P.natwestRed, 0, 0.62, 0.27); // tie
    part(0.55,0.55,0.55, skin, 0, 1.1, 0);        // head
    part(0.55,0.2,0.57, hair, 0, 1.38, 0);
    lleg = part(0.24,0.52,0.24, 0x222235, -0.18, -0.26, 0);
    rleg = part(0.24,0.52,0.24, 0x222235,  0.18, -0.26, 0);
    part(0.18,0.12,0.28, P.shoes, -0.18, -0.56, 0);
    part(0.18,0.12,0.28, P.shoes,  0.18, -0.56, 0);
    part(0.22,0.55,0.22, suit, -0.48, 0.38, 0);
    part(0.22,0.55,0.22, suit,  0.48, 0.38, 0);
    g.position.set(x + 0.5, y + 1.2, z + 0.5);
  } else if (role === 'product') {
    // Colourful casual tech clothing
    const casualCols = [0xe05050, 0x50a0e0, 0x50c080, 0xd080d0, 0xe0c050];
    const casual = casualCols[Math.floor(rng() * casualCols.length)];
    part(0.65,0.85,0.45, casual, 0, 0.425, 0);    // top
    part(0.55,0.55,0.55, skin, 0, 1.1, 0);
    part(0.55,0.2,0.57, hair, 0, 1.38, 0);
    lleg = part(0.24,0.52,0.24, 0x2a2a50, -0.18, -0.26, 0);
    rleg = part(0.24,0.52,0.24, 0x2a2a50,  0.18, -0.26, 0);
    part(0.18,0.12,0.28, P.shoes, -0.18, -0.56, 0);
    part(0.18,0.12,0.28, P.shoes,  0.18, -0.56, 0);
    part(0.22,0.55,0.22, casual, -0.48, 0.38, 0);
    part(0.22,0.55,0.22, casual,  0.48, 0.38, 0);
    g.position.set(x + 0.5, y + 1.2, z + 0.5);
  } else {
    // Branch: formal navy/purple suit with lanyard
    const branchSuit = rng() > 0.5 ? 0x1a2055 : 0x3F0E40;
    part(0.65,0.85,0.45, branchSuit, 0, 0.425, 0);
    part(0.2,0.55,0.12, 0xffffff, 0, 0.5, 0.24);
    // Lanyard
    part(0.06,0.5,0.04, P.neonAmber, 0, 0.8, 0.26, P.neonAmber);
    part(0.12,0.1,0.04, 0xffffff, 0, 0.55, 0.27);
    part(0.55,0.55,0.55, skin, 0, 1.1, 0);
    part(0.55,0.2,0.57, hair, 0, 1.38, 0);
    lleg = part(0.24,0.52,0.24, 0x1a1a30, -0.18, -0.26, 0);
    rleg = part(0.24,0.52,0.24, 0x1a1a30,  0.18, -0.26, 0);
    part(0.18,0.12,0.28, P.shoes, -0.18, -0.56, 0);
    part(0.18,0.12,0.28, P.shoes,  0.18, -0.56, 0);
    part(0.22,0.55,0.22, branchSuit, -0.48, 0.38, 0);
    part(0.22,0.55,0.22, branchSuit,  0.48, 0.38, 0);
    g.position.set(x + 0.5, y + 1.2, z + 0.5);
  }

  scene.add(g);
  const phase = rng() * Math.PI * 2;
  g.userData.baseY = g.position.y;
  npcAnimated.push({ g, lleg, rleg, phase, isAI: role === 'ai' });
  return g;
}

// Floating issue enemies — 5 visually distinct types
const issueEnemies = [];
function makeIssueEnemy(x, y, z, type) {
  const g = new THREE.Group();
  function part(w,h,d,col,ox,oy,oz,em=0) {
    const mat = new THREE.MeshStandardMaterial({
      color: col, roughness: 0.35,
      emissive: em ? new THREE.Color(em) : undefined,
      emissiveIntensity: em ? 1.0 : 0,
    });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    m.position.set(ox,oy,oz);
    g.add(m); return m;
  }

  let core, mat, orbiters = [];

  if (type === 'dbLock') {
    // ERROR CRAWLER — red mechanical spider with error-symbol carapace
    const bm = new THREE.MeshStandardMaterial({ color: 0xaa0011, emissive: new THREE.Color(0x880011), emissiveIntensity: 0.9, roughness: 0.35 });
    core = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.75), bm); g.add(core); mat = bm;
    // Error X on carapace
    const xm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    [Math.PI/4, -Math.PI/4].forEach(r => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.12), xm);
      bar.rotation.z = r; bar.position.set(0, 0.32, 0.38); g.add(bar);
    });
    // Red eyes
    part(0.16, 0.16, 0.1, 0xff0000, -0.2, 0.1, 0.39, 0xff2200);
    part(0.16, 0.16, 0.1, 0xff0000,  0.2, 0.1, 0.39, 0xff2200);
    // 6 articulated legs (3 per side)
    [-0.52, 0.52].forEach(sx => {
      [-0.22, 0, 0.22].forEach(sz => {
        const leg = part(0.3, 0.07, 0.07, 0x771122, sx, -0.05, sz);
        leg.rotation.z = sx < 0 ? 0.6 : -0.6;
        orbiters.push({ m: leg, type: 'leg', phase: Math.random()*Math.PI*2 });
      });
    });
    // Spark bits
    part(0.1, 0.1, 0.1, 0xffaa00,  0.55, 0.4, 0.1, 0xff8800);
    part(0.1, 0.1, 0.1, 0xffaa00, -0.55, 0.35, 0.05, 0xff6600);

  } else if (type === 'memLeak') {
    // MEMORY LEAK — translucent purple blob with orbiting memory fragment shards
    const bm = new THREE.MeshStandardMaterial({ color: 0x7722cc, emissive: new THREE.Color(0x4411aa), emissiveIntensity: 1.1, roughness: 0.2, transparent: true, opacity: 0.82 });
    core = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.88, 0.65), bm); g.add(core); mat = bm;
    // Glowing horizontal eyes
    part(0.32, 0.12, 0.1, 0xff88ff, -0.15, 0.2, 0.34, 0xff66ee);
    part(0.32, 0.12, 0.1, 0xff88ff,  0.15, 0.2, 0.34, 0xff66ee);
    // Bottom drips
    part(0.14, 0.26, 0.14, 0x8833cc, -0.22, -0.6, 0, 0x6622cc);
    part(0.14, 0.26, 0.14, 0x8833cc,  0.22, -0.6, 0, 0x6622cc);
    part(0.1,  0.22, 0.1,  0x6622cc,   0,  -0.62, 0, 0x4411aa);
    // Orbiting memory-block fragments
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const fr = part(0.22, 0.14, 0.12, 0xbb55ff, Math.cos(a)*0.72, 0.08, Math.sin(a)*0.72, 0xaa44ee);
      orbiters.push({ m: fr, type: 'orbit', baseAngle: a, radius: 0.72, speed: 1.4, yBase: 0.08 });
    }

  } else if (type === 'apiError') {
    // PACKET PHANTOM — fast cyan/magenta data-fragment cluster
    const bm = new THREE.MeshStandardMaterial({ color: 0x00ccff, emissive: new THREE.Color(0x0088cc), emissiveIntensity: 1.0, roughness: 0.15, transparent: true, opacity: 0.75 });
    core = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.72, 0.45), bm); g.add(core); mat = bm;
    // Core eyes
    part(0.18, 0.14, 0.08, 0xff44cc, -0.12, 0.12, 0.24, 0xff22cc);
    part(0.18, 0.14, 0.08, 0xff44cc,  0.12, 0.12, 0.24, 0xff22cc);
    // Data packet fragments
    const fragCols = [0xff44cc, 0x00e5ff, 0xcc44ff, 0x44ffff, 0xff88ff, 0x00ffcc, 0xff00aa, 0x44aaff];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = 0.42 + (i % 3) * 0.1;
      const yOff = (i % 2 === 0 ? 0.18 : -0.18);
      const fr = part(0.14, 0.1, 0.08, fragCols[i], Math.cos(a)*r, yOff, Math.sin(a)*r, fragCols[i]);
      orbiters.push({ m: fr, type: 'orbit', baseAngle: a, radius: r, speed: 2.8 - i*0.1, yBase: yOff });
    }

  } else if (type === 'latency') {
    // CORRUPTION GOLEM — large heavy broken-server-rack enemy
    const bm = new THREE.MeshStandardMaterial({ color: 0x3d1430, emissive: new THREE.Color(0x1a0818), emissiveIntensity: 0.5, roughness: 0.75 });
    core = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.9), bm); g.add(core); mat = bm;
    // Broken server rack shoulder pads
    part(0.48, 0.38, 0.38, 0x0a1220, -0.88, 0.28, 0);
    part(0.48, 0.38, 0.38, 0x0a1220,  0.88, 0.28, 0);
    // Warning lights (pulsing red)
    part(0.15, 0.15, 0.15, 0xff2244, -0.88, 0.58, 0.22, 0xff0022);
    part(0.15, 0.15, 0.15, 0xff2244,  0.88, 0.58, 0.22, 0xff0022);
    // Fractured shell cracks
    part(0.28, 0.28, 0.14, 0x551033, -0.48, 0.5, 0.47);
    part(0.22, 0.24, 0.12, 0x441028,  0.38, 0.58, 0.47);
    // Glowing red eyes (large)
    part(0.28, 0.24, 0.14, 0xff0000, -0.3, 0.22, 0.47, 0xff0000);
    part(0.28, 0.24, 0.14, 0xff0000,  0.3, 0.22, 0.47, 0xff0000);
    // Stubby legs
    part(0.38, 0.34, 0.38, 0x2d0d22, -0.38, -0.72, 0);
    part(0.38, 0.34, 0.38, 0x2d0d22,  0.38, -0.72, 0);

  } else {
    // RANSOMWARE OVERLORD — fortified boss with crown, glyphs, glowing eyes
    const bm = new THREE.MeshStandardMaterial({ color: 0x1a0033, emissive: new THREE.Color(0x0d0022), emissiveIntensity: 0.6, roughness: 0.55 });
    core = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.1, 0.85), bm); g.add(core); mat = bm;
    // Crown battlements
    [-0.32, 0, 0.32].forEach(cx => part(0.24, 0.3, 0.24, 0x2a0055, cx, 0.7, 0));
    // Warning glyph side panels (pulsing red)
    part(0.3, 0.42, 0.1, 0x880000, -0.55, 0.1, 0.44, 0xff1133);
    part(0.3, 0.42, 0.1, 0x880000,  0.55, 0.1, 0.44, 0xff1133);
    // Large glowing red eyes
    part(0.28, 0.26, 0.14, 0xff0000, -0.22, 0.28, 0.44, 0xff0000);
    part(0.28, 0.26, 0.14, 0xff0000,  0.22, 0.28, 0.44, 0xff0000);
    // Armored pauldrons
    part(0.42, 0.6, 0.42, 0x280044, -0.74, 0.28, 0);
    part(0.42, 0.6, 0.42, 0x280044,  0.74, 0.28, 0);
    // Short thick legs
    part(0.38, 0.32, 0.38, 0x200033, -0.3, -0.74, 0);
    part(0.38, 0.32, 0.38, 0x200033,  0.3, -0.74, 0);
    // Orbiting glyph fragments
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const gl = part(0.2, 0.2, 0.08, 0xff2244, Math.cos(a)*1.0, 0.1, Math.sin(a)*1.0, 0xff0033);
      orbiters.push({ m: gl, type: 'orbit', baseAngle: a, radius: 1.0, speed: 0.8, yBase: 0.1 });
    }
  }

  g.position.set(x, y, z);
  scene.add(g);
  const phase = Math.random() * Math.PI * 2;
  issueEnemies.push({ g, core, mat, phase, baseY: y, orbiters, type });
  return g;
}

function spawnNPCs() {
  // Central atrium — Branch staff (reception)
  [[-5,1,-5],[-3,1,5],[5,1,-3],[2,1,6]].forEach(([x,y,z]) => makeNPC(x, y, z, 'branch'));
  // AI Assistant robot in atrium centre
  makeNPC(1, 1, 1, 'ai');
  // Data centre — Engineering NPCs
  [[-22,1,-15],[-20,1,-13],[-18,1,-16],[-16,1,-14]].forEach(([x,y,z]) => makeNPC(x, y, z, 'engineering'));
  // Cloud & Infra — Engineering NPCs
  [[16,1,14],[18,1,16],[20,1,13]].forEach(([x,y,z]) => makeNPC(x, y, z, 'engineering'));
  // Payments — Product NPCs
  [[16,1,-9],[18,1,-7],[20,1,-11]].forEach(([x,y,z]) => makeNPC(x, y, z, 'product'));
  // Trading Floor mezzanine — Leadership
  [[-22,MEZ,-17],[-18,MEZ,-13]].forEach(([x,y,z]) => makeNPC(x, y, z, 'leadership'));
  // Operations Centre mezzanine — Engineering
  [[10,MEZ,-14],[14,MEZ,-12],[18,MEZ,-15]].forEach(([x,y,z]) => makeNPC(x, y, z, 'engineering'));
  // Security mezzanine — Security NPCs
  [[-22,MEZ,17],[-18,MEZ,15],[-14,MEZ,18]].forEach(([x,y,z]) => makeNPC(x, y, z, 'security'));
  // Customer Services mezzanine — Product/Branch
  [[12,MEZ,14],[16,MEZ,16],[20,MEZ,13]].forEach(([x,y,z]) => makeNPC(x, y, z, 'product'));

  // Issue enemies near incident zones
  makeIssueEnemy(-19.5, 4,  -15,   'dbLock');   // data centre — DB Lock
  makeIssueEnemy( 18,   4,   14,   'latency');   // cloud — Latency Spike
  makeIssueEnemy( 18,   4,   -7,   'apiError');  // payments — API Error
  makeIssueEnemy( 16, MEZ+4, -14,  'svcDown');   // ops centre — Service Down
  makeIssueEnemy( -1,   5,    0,   'queue');      // atrium beacon — Queue Backlog
  makeIssueEnemy(-16, MEZ+4, -15,  'memLeak');   // trading floor — Memory Leak
}

// ─── Player character (tech engineer — headphones, glowing vest) ──────────────
const playerMesh = new THREE.Group();
function b3(w,h,d,col,ox,oy,oz,em=0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({
      color: col,
      emissive: em ? new THREE.Color(em) : undefined,
      emissiveIntensity: em ? 1.4 : 0,
      roughness: 0.6,
    }));
  m.position.set(ox,oy,oz);
  playerMesh.add(m);
  return m;
}
// Body — purple/blue tech jacket
b3(0.75,0.90,0.52, 0x3d1a6e, 0, 0.45, 0);
// Jacket lapels
b3(0.18,0.55,0.1, 0x2a1250, -0.2, 0.5, 0.27);
b3(0.18,0.55,0.1, 0x2a1250,  0.2, 0.5, 0.27);
// Chest panel (glowing tech display)
b3(0.38,0.38,0.08, 0x0e1a40, 0, 0.56, 0.29);
b3(0.26,0.26,0.08, P.neonCyan, 0, 0.58, 0.30, P.neonCyan);  // glowing circle
// Chest buttons row
b3(0.1,0.08,0.06, P.neonAmber, -0.12, 0.38, 0.29, P.neonAmber);
b3(0.1,0.08,0.06, P.neonGreen,  0.0,  0.38, 0.29, P.neonGreen);
b3(0.1,0.08,0.06, P.neonRed,    0.12, 0.38, 0.29, P.neonRed);
// NatWest back logo
b3(0.38,0.22,0.06, P.natwestRed, 0, 0.6, -0.28, P.natwestRed);
// Head
b3(0.68,0.68,0.68, P.skin, 0, 1.14, 0);
// Hair (dark brown)
b3(0.70,0.22,0.70, 0x3a1a08, 0, 1.47, 0);
// Eyes
b3(0.14,0.13,0.06, 0x111122, -0.16, 1.14, 0.35);
b3(0.14,0.13,0.06, 0x111122,  0.16, 1.14, 0.35);
// Headphone cups — cyan glow (matches image 3)
b3(0.12,0.38,0.38, 0x1a55cc, -0.45, 1.16, 0, 0x2266ee);
b3(0.12,0.38,0.38, 0x1a55cc,  0.45, 1.16, 0, 0x2266ee);
// Headphone band over top
b3(0.80,0.10,0.10, 0x223388, 0, 1.54, 0);
// Legs
const plLegL = b3(0.30,0.54,0.30, 0x1a1a38, -0.21, -0.27, 0);
const plLegR = b3(0.30,0.54,0.30, 0x1a1a38,  0.21, -0.27, 0);
b3(0.26,0.16,0.32, 0x111122, -0.21, -0.58, 0.05);
b3(0.26,0.16,0.32, 0x111122,  0.21, -0.58, 0.05);
// Arms — blue/purple
const plArmL = b3(0.26,0.58,0.26, 0x2244aa, -0.53, 0.40, 0);
const plArmR = b3(0.26,0.58,0.26, 0x2244aa,  0.53, 0.40, 0);
// Tablet in right hand (glowing)
b3(0.38,0.28,0.05, P.neonBlue, 0.68, 0.48, 0.14, P.neonBlue);
scene.add(playerMesh);

// ─── Player physics & camera ──────────────────────────────────────────────────
const PLAYER_HEIGHT = 1.75;
const PLAYER_RADIUS = 0.3;
const GRAVITY = -22;
const JUMP_SPEED = 7;
const WALK_SPEED = 5;
const RUN_SPEED = 9;

const player = {
  x: 0, y: 3, z: 3,
  vx: 0, vy: 0, vz: 0,
  yaw: 0, pitch: 0.25,
  onGround: false,
};

// Third-person camera — fixed offset behind player; pitch only tilts lookAt, not cam position
const CAM_BACK = 7;
const CAM_UP   = 3.5;
const camPos   = new THREE.Vector3();
const camLook  = new THREE.Vector3();

function updateCamera(dt) {
  const sinY = Math.sin(player.yaw);
  const cosY = Math.cos(player.yaw);
  const alpha = 1 - Math.pow(0.04, dt);

  if (viewMode === 1) {
    // First-person: camera at eye level, no back offset, hides player mesh
    const eyeTarget = new THREE.Vector3(
      player.x,
      player.y + PLAYER_HEIGHT * 0.9,
      player.z,
    );
    camPos.lerp(eyeTarget, alpha * 2);
    camera.position.copy(camPos);
    const lookDist = 8;
    const lookY = player.y + PLAYER_HEIGHT * 0.9 - Math.sin(player.pitch) * lookDist;
    const lookTarget = new THREE.Vector3(
      player.x + sinY * lookDist,
      lookY,
      player.z + cosY * lookDist,
    );
    camLook.lerp(lookTarget, alpha * 2);
    camera.lookAt(camLook);

  } else if (viewMode === 2) {
    // Top-down overview: directly above, looking down
    const topTarget = new THREE.Vector3(
      player.x,
      player.y + 28,
      player.z,
    );
    camPos.lerp(topTarget, alpha);
    camera.position.copy(camPos);
    const downLook = new THREE.Vector3(player.x, player.y, player.z);
    camLook.lerp(downLook, alpha * 1.5);
    camera.lookAt(camLook);

  } else {
    // Third-person: fixed offset behind+above, pitch only moves lookAt
    const target = new THREE.Vector3(
      player.x - sinY * CAM_BACK,
      player.y + PLAYER_HEIGHT + CAM_UP,
      player.z - cosY * CAM_BACK,
    );
    camPos.lerp(target, alpha);
    camera.position.copy(camPos);
    const lookDist = 6;
    const lookY = player.y + PLAYER_HEIGHT * 0.8 - Math.sin(player.pitch) * lookDist;
    const lookTarget = new THREE.Vector3(
      player.x + sinY * lookDist,
      lookY,
      player.z + cosY * lookDist,
    );
    camLook.lerp(lookTarget, alpha * 1.5);
    camera.lookAt(camLook);
  }
}

// ─── Input ────────────────────────────────────────────────────────────────────
const keys = {};
let pointerLocked = false;
let mouseDX = 0, mouseDY = 0;

// 0 = third-person, 1 = first-person, 2 = top-down overview
let viewMode = 0;
const VIEW_LABELS = ['Third Person', 'First Person', 'Top Down'];

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (gameState === 'playing') togglePause();
    else if (gameState === 'paused') togglePause();
  }
  if ((e.key === 'e' || e.key === 'E') && (gameState === 'playing' || gameState === 'dialog')) doInteract();
  if ((e.key === 'h' || e.key === 'H') && gameState === 'playing') showHint();
  if ((e.key === 'v' || e.key === 'V') && gameState === 'playing') {
    viewMode = (viewMode + 1) % 3;
    showToast('View: ' + VIEW_LABELS[viewMode], '#36C5F0');
    // Show/hide player mesh in first-person
    playerMesh.visible = viewMode !== 1;
  }
  if (e.key === ' ' && gameState === 'playing' && player.onGround) {
    player.vy = JUMP_SPEED;
    player.onGround = false;
  }
});
window.addEventListener('keyup', e => { delete keys[e.key]; });

renderer.domElement.addEventListener('click', () => {
  if (gameState === 'playing' || gameState === 'dialog') {
    renderer.domElement.requestPointerLock();
  }
});
const $ctrlGuide  = document.getElementById('controls-guide');
const $lockNotice = document.getElementById('lock-notice');

document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
  if (pointerLocked) {
    $lockNotice.style.display = 'none';
    $ctrlGuide.style.display  = 'block';
  } else {
    $ctrlGuide.style.display  = 'none';
    if (gameState === 'playing') $lockNotice.style.display = 'block';
  }
});
document.addEventListener('mousemove', e => {
  if (!pointerLocked) return;
  mouseDX += e.movementX;
  mouseDY += e.movementY;
});

// ─── Player movement & collision ──────────────────────────────────────────────
function movePlayer(dt) {
  // Mouse look
  const SENS = 0.002;
  player.yaw   += mouseDX * SENS;
  player.pitch  = Math.max(-0.6, Math.min(1.1, player.pitch - mouseDY * SENS));
  mouseDX = 0; mouseDY = 0;

  const sprint = keys['Shift'];
  const speed  = sprint ? RUN_SPEED : WALK_SPEED;
  const sinY   = Math.sin(player.yaw);
  const cosY   = Math.cos(player.yaw);

  let fwd = 0, strafe = 0;
  if (keys['w'] || keys['W'] || keys['ArrowUp'])    fwd   += 1;
  if (keys['s'] || keys['S'] || keys['ArrowDown'])  fwd   -= 1;
  if (keys['a'] || keys['A'] || keys['ArrowLeft'])  strafe -= 1;
  if (keys['d'] || keys['D'] || keys['ArrowRight']) strafe += 1;

  const len = Math.hypot(fwd, strafe) || 1;
  const nx = (fwd * sinY + strafe * cosY) / len;
  const nz = (fwd * cosY - strafe * sinY) / len;
  const moving = fwd !== 0 || strafe !== 0;

  if (moving) {
    player.vx = nx * speed;
    player.vz = nz * speed;
  } else {
    player.vx *= 0.8;
    player.vz *= 0.8;
  }

  // Gravity
  if (!player.onGround) player.vy += GRAVITY * dt;

  // Move X (with 1-block step-up for stairs)
  const npx = player.x + player.vx * dt;
  if (!collidesXZ(npx, player.y, player.z)) {
    player.x = npx;
  } else if (player.onGround && !collidesXZ(npx, player.y + 1.01, player.z)) {
    player.x = npx;
    player.y += 1.01;
  } else {
    player.vx = 0;
  }

  // Move Z (with 1-block step-up for stairs)
  const npz = player.z + player.vz * dt;
  if (!collidesXZ(player.x, player.y, npz)) {
    player.z = npz;
  } else if (player.onGround && !collidesXZ(player.x, player.y + 1.01, npz)) {
    player.z = npz;
    player.y += 1.01;
  } else {
    player.vz = 0;
  }

  // Move Y
  const npy = player.y + player.vy * dt;
  const groundY = getGround(player.x, player.z);
  if (player.vy < 0 && npy <= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.y = npy;
    player.onGround = false;
  }

  // Update player mesh — offset +0.66 so feet sit on the floor surface, not inside it
  playerMesh.position.set(player.x, player.y + 0.66, player.z);
  if (moving) {
    const targetFace = Math.atan2(nx, nz);
    // Smooth rotation towards movement direction
    let diff = targetFace - playerMesh.rotation.y;
    while (diff > Math.PI)  diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    playerMesh.rotation.y += diff * 0.2;
  }

  // Walk animation
  if (moving) {
    const t = performance.now() / 1000;
    plLegL.rotation.x =  Math.sin(t * (sprint ? 14 : 9)) * 0.5;
    plLegR.rotation.x = -Math.sin(t * (sprint ? 14 : 9)) * 0.5;
    plArmL.rotation.x = -Math.sin(t * (sprint ? 14 : 9)) * 0.4;
    plArmR.rotation.x =  Math.sin(t * (sprint ? 14 : 9)) * 0.4;
  } else {
    plLegL.rotation.x = plLegR.rotation.x = plArmL.rotation.x = plArmR.rotation.x = 0;
  }
}

function collidesXZ(x, y, z) {
  const r = PLAYER_RADIUS;
  const checks = [[x-r, y+0.1, z-r],[x+r, y+0.1, z-r],[x-r, y+0.1, z+r],[x+r, y+0.1, z+r],
                  [x-r, y+1.0, z-r],[x+r, y+1.0, z-r],[x-r, y+1.0, z+r],[x+r, y+1.0, z+r]];
  return checks.some(([cx,cy,cz]) => isSolid(cx, cy, cz));
}

// ─── Game state ───────────────────────────────────────────────────────────────
let gameState = 'title';
let score = 0, health = 100, timeLeft = 300;
let incidentsDone = 0;
const TOTAL = 5;
let evidenceList = [];
let hintCooldown = 0;
let nearestObjective = null;
let lastTime = 0;

const objectives = [
  { id: 'beacon', label: 'E — Inspect SEV-1 Alert Beacon', px: 0, py: 2, pz: 0, r: 3,
    done: false, avail: () => incidentsDone === 0,
    dialog: [
      { who: 'SEV-1 ALERT — INCIDENT-0042 | CRITICAL', text: 'All services degraded. Customer logins failing. Payments timing out.\nBank health: 68% and falling.\n\nObjectives assigned:\n1. Data Centre — investigate the server fault\n2. Cloud & Infra — restore the failed network link\n3. Payments — recover transaction processing\n4. Ops Centre — verify full service restoration' },
      { who: 'AI ASSISTANT', text: 'Start with the Data Centre (left wing, ground floor). Look for red LED indicators on the server racks.' },
    ],
    onDone: () => { incidentsDone++; addScore(100, 'Alert inspected'); },
  },
  { id: 'datacenter', label: 'E — Investigate Server Fault', px: -19, py: 1, pz: -14, r: 4,
    done: false, avail: () => incidentsDone >= 1,
    dialog: [
      { who: 'DATA CENTRE — RACK-DB-03', text: 'FAULT DETECTED\nDisk array DEGRADED — RAID-5 rebuild active.\nI/O wait: 94%  |  Queue depth: 847\nConnection pool: 50/50 SATURATED\nLast healthy: 08:58 UTC' },
      { who: 'DATA CENTRE', text: 'Root cause identified: RAID rebuild starving the DB of I/O bandwidth. Auth and payments services are cascading from this.' },
    ],
    onDone: () => {
      incidentsDone++; health = Math.min(100, health+5);
      addScore(300, 'Server fault diagnosed!');
      collectEvidence('db_fault', 'DB RAID rebuild causing I/O saturation');
    },
  },
  { id: 'cloud', label: 'E — Restore Network Link', px: 18, py: 1, pz: 14, r: 4,
    done: false, avail: () => incidentsDone >= 2,
    dialog: [
      { who: 'CLOUD & INFRASTRUCTURE — NET-SW-07', text: 'Failover path to DB replica: DEGRADED\n\nApplying fix: re-enabling replica routing...\n✓ Replica connection restored\n✓ Failover path verified\n✓ Connection pool pressure: 44/50 ↓' },
    ],
    onDone: () => {
      incidentsDone++; health = Math.min(100, health+15);
      addScore(500, 'Network link restored!');
      collectEvidence('network_fix', 'DB replica routing restored via Cloud Infra');
    },
  },
  { id: 'payments', label: 'E — Recover Payments Processing', px: 19, py: 1, pz: -7, r: 4,
    done: false, avail: () => incidentsDone >= 3,
    dialog: [
      { who: 'PAYMENTS — PAY-API-01', text: 'Transaction queue draining: 847 → 112 pending\nLatency: 12400ms → 890ms\nError rate: 78% → 4.2%\n\n✓ Circuit breaker reset\n✓ Pool expanded: 50 → 120 connections\n✓ Transaction rate normalising' },
    ],
    onDone: () => {
      incidentsDone++; health = Math.min(100, health+20);
      addScore(500, 'Payments recovered!');
    },
  },
  { id: 'ops', label: 'E — Verify Service Restoration', px: 16, py: MEZ+1, pz: -14, r: 4,
    done: false, avail: () => incidentsDone >= 4,
    dialog: [
      { who: 'OPERATIONS CENTRE — FULL HEALTH CHECK', text: '✓ auth-service     HEALTHY  p99: 180ms\n✓ db-primary        HEALTHY  I/O: 22%\n✓ db-replica        HEALTHY  connections: 28/120\n✓ payments-api      HEALTHY  error rate: 0.1%\n✓ mobile-app        HEALTHY  apdex: 0.96\n✓ branch-services   HEALTHY  all terminals OK\n\nBank Health: RESTORED' },
      { who: 'OPERATIONS CENTRE', text: 'SEV-1 RESOLVED.\nRoot cause: RAID-5 rebuild on db-primary caused I/O saturation.\nPrevention: Increase pool limit; enable proactive RAID monitoring.' },
    ],
    onDone: () => {
      incidentsDone++; health = Math.min(100, health+20);
      addScore(350, 'Services verified — mission complete!');
      setTimeout(() => endGame(), 2000);
    },
  },
];

// ─── UI ───────────────────────────────────────────────────────────────────────
const $timer    = document.getElementById('timer-val');
const $fill     = document.getElementById('health-fill');
const $hpct     = document.getElementById('health-pct');
const $incidents= document.getElementById('incidents-val');
const $dialog   = document.getElementById('dialog');
const $dlgWho   = document.getElementById('dialog-who');
const $dlgTxt   = document.getElementById('dialog-text');
const $toast    = document.getElementById('toast');
const $prompt   = document.getElementById('interact-prompt');
const $evPanel  = document.getElementById('evidence-panel');
const $evList   = document.getElementById('evidence-list');

function fmtT(s) { return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`; }

let toastTmr;
function showToast(msg, bg='#2EB67D') {
  $toast.textContent = msg;
  $toast.style.background = bg;
  $toast.style.color = bg === '#ECB22E' ? '#090817' : '#fff';
  $toast.style.display = 'block';
  clearTimeout(toastTmr);
  toastTmr = setTimeout(() => $toast.style.display = 'none', 3200);
}

function addScore(pts, reason) {
  score += pts;
  showToast(`+${pts} — ${reason}`, pts >= 500 ? '#2EB67D' : '#36C5F0');
}

function collectEvidence(id, label) {
  if (evidenceList.includes(id)) return;
  evidenceList.push(id);
  const d = document.createElement('div');
  d.className = 'ev-item';
  d.textContent = '✓ ' + label;
  $evList.appendChild(d);
  $evPanel.style.display = 'block';
  addScore(50, 'Evidence collected');
}

const $recovFill = document.getElementById('recovery-fill');
const $recovPct  = document.getElementById('recovery-pct');

function updateHUD() {
  $timer.textContent = fmtT(timeLeft);
  $timer.style.color = timeLeft < 60 ? '#E01E5A' : '#ECB22E';
  const hp = Math.max(0, Math.round(health));
  $fill.style.width = hp + '%';
  $fill.style.background = hp > 60 ? '#2EB67D' : hp > 30 ? '#ECB22E' : '#E01E5A';
  $hpct.textContent = hp + '%';
  $hpct.style.color = $fill.style.background;
  $incidents.innerHTML = `${incidentsDone} / ${TOTAL} <span style="font-size:11px;color:#E01E5A">RESOLVED</span>`;
  // Recovery bar = incidents done / total
  const recovPct = Math.round((incidentsDone / TOTAL) * 100);
  $recovFill.style.width = recovPct + '%';
  $recovPct.textContent  = `RECOVERY ${recovPct}%`;
}

// ─── Dialog ───────────────────────────────────────────────────────────────────
let dlgSeq = null, dlgIdx = 0, dlgOnEnd = null;

function openDialog(seq, onEnd) {
  dlgSeq = seq; dlgIdx = 0; dlgOnEnd = onEnd || null;
  advanceDialog();
  gameState = 'dialog';
}

function advanceDialog() {
  if (!dlgSeq || dlgIdx >= dlgSeq.length) {
    $dialog.style.display = 'none';
    gameState = 'playing';
    if (dlgOnEnd) { dlgOnEnd(); dlgOnEnd = null; }
    dlgSeq = null;
    return;
  }
  const d = dlgSeq[dlgIdx++];
  $dlgWho.textContent = d.who;
  $dlgTxt.textContent = d.text;
  $dialog.style.display = 'block';
}

function doInteract() {
  if (gameState === 'dialog') { advanceDialog(); return; }
  if (!nearestObjective) return;
  const obj = objectives.find(o => o.id === nearestObjective);
  if (!obj || obj.done) return;
  obj.done = true;
  openDialog(obj.dialog, obj.onDone);
}

// ─── Hints ────────────────────────────────────────────────────────────────────
const HINTS = [
  'Find the glowing red alert beacon in the central atrium (the cube). Walk up and press E.',
  'Head left — the Data Centre has neon-blue server racks. Look for the red LED indicators.',
  'Cloud & Infrastructure is in the far-right corner. Walk there and restore the network switch.',
  'The Payments zone is to the right. Find the amber-lit processing terminals.',
  'Take the stairs up to the mezzanine. The Operations Centre is to the upper right. Press E to run the final health check.',
];

function showHint() {
  if (hintCooldown > 0) { showToast(`Hint cooldown: ${Math.ceil(hintCooldown)}s`, '#ECB22E'); return; }
  const hint = HINTS[Math.min(incidentsDone, HINTS.length - 1)];
  openDialog([{ who: 'AI ASSISTANT', text: hint }]);
  hintCooldown = 20;
}

// ─── Pause / end ─────────────────────────────────────────────────────────────
function togglePause() {
  if (gameState === 'playing') {
    gameState = 'paused';
    document.getElementById('pause-overlay').style.display = 'flex';
    $lockNotice.style.display = 'none';
    $ctrlGuide.style.display  = 'none';
    if (document.pointerLockElement) document.exitPointerLock();
  } else if (gameState === 'paused') {
    gameState = 'playing';
    document.getElementById('pause-overlay').style.display = 'none';
    $lockNotice.style.display = 'block';
  }
}

function endGame() {
  gameState = 'end';
  if (document.pointerLockElement) document.exitPointerLock();
  let g, t, s;
  if (score >= 1700 && timeLeft > 120)    { g='S'; t='SEV-1 CHAMPION';     s='Perfect run. Bank is back. Customers never noticed.'; }
  else if (score >= 1100)                 { g='A'; t='INCIDENT HERO';       s='Strong diagnosis and recovery. Well done.'; }
  else if (score >= 700)                  { g='B'; t='RELIABLE RESPONDER';  s='Service recovered with some delay.'; }
  else                                    { g='C'; t='RECOVERY REQUIRED';   s='Services restored but key steps were missed.'; }
  const gc = { S: '#ECB22E', A: '#2EB67D', B: '#36C5F0', C: '#888' };
  document.getElementById('end-grade').textContent = g;
  document.getElementById('end-grade').style.color = gc[g];
  document.getElementById('end-title').textContent = t;
  document.getElementById('end-summary').textContent = s;
  document.getElementById('end-score').textContent  = `Final score: ${score.toLocaleString()}`;
  document.getElementById('end-overlay').style.display = 'flex';
}

// ─── Start/restart ────────────────────────────────────────────────────────────
function startGame() {
  score = 0; health = 100; timeLeft = 300;
  incidentsDone = 0; evidenceList = [];
  hintCooldown = 0;
  objectives.forEach(o => o.done = false);
  $evList.innerHTML = '';
  $evPanel.style.display = 'none';
  $dialog.style.display = 'none';
  $toast.style.display  = 'none';
  player.x = 0; player.y = 3; player.z = 3;
  player.vx = player.vy = player.vz = 0;
  player.yaw = Math.PI; player.pitch = 0.2;
  camPos.set(0, player.y + PLAYER_HEIGHT + CAM_UP, 3 + CAM_BACK);
  ['title-overlay','end-overlay','pause-overlay'].forEach(id =>
    document.getElementById(id).style.display = 'none');
  gameState = 'playing';
  $lockNotice.style.display = 'block';
  $ctrlGuide.style.display  = 'none';
  updateHUD();
}

// ─── Portrait ─────────────────────────────────────────────────────────────────
function drawPortrait() {
  const pc = document.getElementById('portrait-canvas');
  const c  = pc.getContext('2d');
  c.fillStyle = '#1a0a2a'; c.fillRect(0,0,36,36);
  c.fillStyle = '#c68642'; c.fillRect(12,6,12,11);
  c.fillStyle = '#2a1a08'; c.fillRect(12,6,12,5);
  c.fillStyle = '#5a1a6a'; c.fillRect(10,17,16,11);
  c.fillStyle = '#36C5F0'; c.fillRect(23,18,5,7);
  c.fillStyle = '#1a1a3a'; c.fillRect(12,28,5,7); c.fillRect(19,28,5,7);
}

// ─── Pulsing alert objects ────────────────────────────────────────────────────
const alertMats = [];
function addAlertDecor(x, y, z) {
  const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: new THREE.Color(0xff0033), emissiveIntensity: 1.5, roughness: 0.3 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x + 0.5, y + 0.75, z + 0.5);
  scene.add(m);
  alertMats.push({ m, mat, phase: Math.random() * Math.PI * 2 });
}

// ─── Zone labels (canvas sprites) ────────────────────────────────────────────
function makeSprite(text, color) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(9,8,23,0.9)';
  g.fillRect(0, 0, 256, 64);
  g.strokeStyle = '#' + color.toString(16).padStart(6,'0');
  g.lineWidth = 2;
  g.strokeRect(1, 1, 254, 62);
  g.fillStyle = '#' + color.toString(16).padStart(6,'0');
  g.font = 'bold 16px Courier New';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 1.25),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
  );
  plane.renderOrder = 1;
  return plane;
}

function addLabel(text, x, y, z, color) {
  const s = makeSprite(text, color);
  s.position.set(x, y, z);
  scene.add(s);
  return s;
}

// ─── Slackbot markers — one above each incident ───────────────────────────────
// Design matches the Slack brand: four-quadrant body in Slack colors (#36C5F0 / #2EB67D / #E01E5A / #ECB22E)
const slackbotMarkers = []; // { g, objId, baseY }

function makeSlackbot(x, y, z) {
  const g = new THREE.Group();
  function p(w,h,d,col,ox,oy,oz,em=0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
      new THREE.MeshStandardMaterial({ color:col, emissive: em ? new THREE.Color(em):undefined, emissiveIntensity:em?1.0:0, roughness:0.6 }));
    m.position.set(ox,oy,oz);
    g.add(m);
    return m;
  }
  // ── Body (four Slack-color quadrants) ──
  p(0.5, 0.55, 0.55, 0x36C5F0, -0.26, 0.27, 0);   // top-left: Slack blue
  p(0.5, 0.55, 0.55, 0x2EB67D,  0.26, 0.27, 0);   // top-right: Slack green
  p(0.5, 0.55, 0.55, 0xE01E5A, -0.26,-0.27, 0);   // bot-left: Slack red
  p(0.5, 0.55, 0.55, 0xECB22E,  0.26,-0.27, 0);   // bot-right: Slack amber
  // White cross divider
  p(0.12, 1.12, 0.58, 0xffffff, 0, 0, 0.01);      // vertical
  p(1.12, 0.12, 0.58, 0xffffff, 0, 0, 0.01);      // horizontal
  // ── Head ──
  p(0.88, 0.72, 0.72, 0x36C5F0, 0, 0.92, 0);      // teal head
  p(0.90, 0.18, 0.74, 0x1a0a2a, 0, 1.27, 0);      // dark hair/top
  // Eyes
  p(0.18, 0.18, 0.12, 0x1a0a2a, -0.20, 0.95, 0.37);
  p(0.18, 0.18, 0.12, 0x1a0a2a,  0.20, 0.95, 0.37);
  // Smile
  p(0.30, 0.10, 0.10, 0x1a0a2a, 0, 0.72, 0.38);
  // ── Stubby arms ──
  p(0.28, 0.50, 0.30, 0xECB22E, -0.72, 0.05, 0);  // left arm
  p(0.28, 0.50, 0.30, 0xECB22E,  0.72, 0.05, 0);  // right arm
  // ── Chunky legs ──
  p(0.36, 0.46, 0.36, 0xECB22E, -0.23, -0.78, 0);
  p(0.36, 0.46, 0.36, 0xECB22E,  0.23, -0.78, 0);
  // ── Alert "!" above head ──
  p(0.14, 0.40, 0.14, 0xe01e5a, 0, 1.72, 0, 0xe01e5a);  // exclamation bar
  p(0.14, 0.14, 0.14, 0xe01e5a, 0, 2.05, 0, 0xe01e5a);  // exclamation dot

  g.position.set(x, y, z);
  scene.add(g);
  return g;
}

function spawnSlackbots() {
  // One Slackbot per objective — position is above the objective location
  const defs = [
    { id: 'beacon',     x:  0,  y: 9,        z:  0  },
    { id: 'datacenter', x: -19, y: 6,        z: -15 },
    { id: 'cloud',      x:  18, y: 6,        z:  15 },
    { id: 'payments',   x:  19, y: 6,        z:  -7 },
    { id: 'ops',        x:  16, y: MEZ + 7,  z: -14 },
  ];
  defs.forEach(({ id, x, y, z }) => {
    const g = makeSlackbot(x, y, z);
    slackbotMarkers.push({ g, id, baseY: y, phase: Math.random() * Math.PI * 2 });
  });
}

// ─── Main loop ────────────────────────────────────────────────────────────────
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min((now - lastTime) / 1000, 0.08);
  lastTime = now;
  const t = now / 1000;

  if (gameState === 'playing') {
    // Timer
    timeLeft   = Math.max(0, timeLeft - dt);
    hintCooldown = Math.max(0, hintCooldown - dt);
    if (incidentsDone < TOTAL) health = Math.max(0, health - dt * 0.25);
    if (timeLeft <= 0 && gameState === 'playing') endGame();

    movePlayer(dt);

    // Find nearest objective
    let nearest = null, nearDist = Infinity;
    for (const obj of objectives) {
      if (obj.done || !obj.avail()) continue;
      const dx = player.x - obj.px, dy = (player.y - obj.py), dz = player.z - obj.pz;
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (d < obj.r && d < nearDist) { nearDist = d; nearest = obj.id; }
    }
    nearestObjective = nearest;
    const obj = nearest ? objectives.find(o => o.id === nearest) : null;
    $prompt.textContent = obj ? obj.label : '';
    $prompt.style.display = nearest ? 'block' : 'none';

    updateHUD();
  }

  // Camera always follows
  updateCamera(dt);

  // NPC animation
  npcAnimated.forEach(({ g, lleg, rleg, phase, isAI }) => {
    if (isAI) {
      // Float up and down, slow rotation
      g.position.y = g.userData.baseY + Math.sin(t * 1.2 + phase) * 0.18;
      g.rotation.y += 0.008;
    } else {
      g.position.y += Math.sin(t * 1.5 + phase) * 0.0005;
      const walk = Math.sin(t * 2.5 + phase) * 0.12;
      if (lleg) lleg.rotation.x =  walk;
      if (rleg) rleg.rotation.x = -walk;
    }
  });

  // Issue enemy animation — bob, pulse, orbit fragments
  issueEnemies.forEach(({ g, mat, phase, baseY, orbiters, type }) => {
    const bobSpeed = type === 'latency' ? 1.4 : 2.2;
    const bobAmt   = type === 'latency' ? 0.15 : 0.28;
    g.position.y = baseY + Math.sin(t * bobSpeed + phase) * bobAmt;
    const spinSpeed = type === 'latency' ? 0.012 : type === 'apiError' ? 0.04 : 0.025;
    g.rotation.y += spinSpeed;
    mat.emissiveIntensity = 0.6 + Math.sin(t * 3.5 + phase) * 0.5;
    // Animate orbiting fragments
    orbiters.forEach(orb => {
      if (orb.type === 'orbit') {
        const a = orb.baseAngle + t * orb.speed;
        orb.m.position.set(Math.cos(a) * orb.radius, orb.yBase + Math.sin(t*1.5+orb.baseAngle)*0.1, Math.sin(a) * orb.radius);
      } else if (orb.type === 'leg') {
        orb.m.rotation.x = Math.sin(t * 4 + orb.phase) * 0.4;
      }
    });
  });

  // Holographic tower ring animation
  holoRings.forEach(({ rg, speed, dir }) => {
    rg.rotation.y += speed * dir * 0.008;
  });

  // Zone alert lights — pulse red when incident is active and not resolved
  if (gameState === 'playing') {
    Object.entries(zoneLights).forEach(([id, light]) => {
      const obj = objectives.find(o => o.id === id);
      const active = obj && !obj.done && obj.avail();
      light.intensity = active ? (10 + Math.sin(t * 3.5) * 5) : 0;
    });
  }

  // Slackbot markers — bob + spin; hide when incident resolved
  slackbotMarkers.forEach(({ g, id, baseY, phase }) => {
    const obj = objectives.find(o => o.id === id);
    const resolved = obj && obj.done;
    g.visible = !resolved;
    if (!resolved) {
      g.position.y = baseY + Math.sin(t * 1.6 + phase) * 0.35;
      g.rotation.y += 0.03;
    }
  });

  // Alert pulsing
  alertMats.forEach(({ m, mat, phase }) => {
    mat.emissiveIntensity = 0.7 + Math.sin(t * 4 + phase) * 0.7;
    m.scale.setScalar(0.9 + Math.sin(t * 4 + phase) * 0.12);
  });

  // Zone label billboarding
  scene.traverse(obj => {
    if (obj.isMesh && obj.material.map && obj.geometry.type === 'PlaneGeometry') {
      obj.lookAt(camera.position);
    }
  });

  renderer.render(scene, camera);
}

// ─── Initialise ───────────────────────────────────────────────────────────────
drawPortrait();
buildWorld();
buildInstancedMeshes();
buildSky();
spawnNPCs();
spawnSlackbots();

// Alert decor beacons
addAlertDecor(-1, 4, -1);      // central atrium beacon
addAlertDecor(-21, 1, -15);    // data centre
addAlertDecor(18, 1, -7);      // payments

// Zone labels
addLabel('DATA CENTRE',          -19, 10.5, -15, 0x36C5F0);
addLabel('CLOUD & INFRASTRUCTURE', 18, 10.5, 15, 0x00e5ff);
addLabel('PAYMENTS',              19,  9.5, -7,  0xECB22E);
addLabel('TRADING FLOOR',        -16, 15.5, -15, 0xECB22E);
addLabel('OPERATIONS CENTRE',     16, 15.5, -15, 0x36C5F0);
addLabel('SECURITY',             -16, 15.5,  15, 0xE01E5A);
addLabel('CUSTOMER SERVICES',     16, 15.5,  15, 0x2EB67D);
addLabel('CENTRAL ATRIUM',         0,  9.5,   0, 0x8833ff);

// Wire buttons
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('resume-btn').addEventListener('click', togglePause);
document.getElementById('replay-btn').addEventListener('click', startGame);
document.getElementById('hint-btn').addEventListener('click', showHint);

requestAnimationFrame(t => { lastTime = t; tick(t); });
