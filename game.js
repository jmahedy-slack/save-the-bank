/**
 * SEV-1: Save the Bank — 3D Voxel World (PipeCraft-quality rebuild)
 * FPS/third-person camera, instanced block world, pointer-lock controls
 */
import * as THREE from 'three';

// ─── Palette ──────────────────────────────────────────────────────────────────
const P = {
  floorTile: 0xdde0e8, floorTile2: 0xc8ccd4, carpet: 0x2a1840, carpetLit: 0x3a2050,
  wall: 0x2a1a38, wallTrim: 0x4a2860, ceiling: 0x1a1028,
  glass: 0x4a9fd4, glassLit: 0x6bc4f0,
  desk: 0x3d2812, deskTop: 0x5a3a18, chair: 0x1a1a2a,
  server: 0x0d1f30, serverLit: 0x163348, serverFront: 0x0a1520,
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

// Central atrium: 48×40 building footprint, open 10H atrium in middle 16×16
function buildCentralAtrium() {
  const W=24, D=20, CH=8; // half-widths, ceiling height
  // Outer floor
  fillFloor(-W, W, -D, D, 1, P.floorTile2);
  // Atrium inner area (special floor)
  fillFloor(-8, 8, -8, 8, 1, P.carpet, { emissive: 0 });
  // Illuminated strips
  for (let i = -7; i <= 7; i += 2) {
    vox(i, 2, 0, P.neonBlue, { emissive: P.neonBlue });
    vox(0, 2, i, P.neonPurple, { emissive: P.neonPurple });
  }
  // Outer walls
  fillBox(-W, 2, -D, -W, CH, -D+1, P.wall);
  fillBox( W, 2, -D,  W, CH, D, P.wall);
  fillBox(-W, 2, -D,  W, CH, -D, P.wall);
  fillBox(-W, 2,  D,  W, CH,  D, P.wall);
  // Glass panels on outer walls
  for (let x = -20; x <= 20; x += 5) {
    fillBox(x, 3, -D, x+3, 7, -D, P.glassLit, { emissive: 0 });
    fillBox(x, 3, D,  x+3, 7,  D, P.glassLit, { emissive: 0 });
  }
  // Ceiling
  fillFloor(-W, W, -D, D, CH+1, P.ceiling);
  // Interior wall dividers (partitions between zones)
  fillBox(-24, 2, -8, -24, 7, 8, P.wall);
  fillBox( 24, 2, -8,  24, 7, 8, P.wall);
  fillBox(-8, 2, -20, 8, 7, -20, P.wall);
  fillBox(-8, 2,  20, 8, 7,  20, P.wall);
  // Interior corridor walls
  fillBox(-8, 2, -12, -8, 7, 12, P.wallTrim);
  fillBox( 8, 2, -12,  8, 7, 12, P.wallTrim);
  fillBox(-12, 2, -8, 12, 2, -8, P.wallTrim);
  fillBox(-12, 2,  8, 12, 2,  8, P.wallTrim);
  // NatWest signage on wall
  fillBox(-6, 6, -19, 6, 8, -19, P.wall);
  fillBox(-4, 7, -19, 4, 7, -19, P.natwestRed, { emissive: P.natwestRed });
  // Central cube installation
  fillBox(-2, 2, -2, 2, 4, 2, P.neonBlue, { emissive: P.neonBlue });
  fillBox(-1, 5, -1, 1, 5, 1, P.neonPurple, { emissive: P.neonPurple });
  // Alert beacon at centre
  vox(0, 5, 0, P.neonRed, { emissive: P.neonRed });
}

// Data Centre: x=-24..-16, z=-20..-12
function buildDataCentre() {
  fillFloor(-24, -14, -20, -10, 1, P.floorTile);
  fillBox(-24, 2, -20, -14, 8, -20, P.wall);
  fillBox(-24, 2, -10, -14, 8, -10, P.wallTrim);
  fillBox(-24, 2, -20, -24, 8, -10, P.wall);
  fillBox(-14, 2, -20, -14, 8, -10, P.wallTrim);
  fillFloor(-24, -14, -20, -10, 9, P.ceiling);
  // Server racks (2 wide, 5 high, standing against back wall)
  for (let i = 0; i < 4; i++) {
    const x = -23 + i * 2;
    fillBox(x, 2, -19, x+1, 6, -19, P.server);
    fillBox(x, 2, -19, x+1, 6, -19, P.serverFront);
    // LEDs
    for (let u = 0; u < 6; u++) {
      const lc = u < 4 ? P.ledGreen : P.ledRed;
      vox(x, 2+u, -18, lc, { emissive: lc });
    }
  }
  // More racks facing other way
  for (let i = 0; i < 3; i++) {
    const x = -22 + i * 2;
    fillBox(x, 2, -12, x+1, 5, -12, P.server);
    for (let u = 0; u < 4; u++) vox(x, 2+u, -13, P.ledGreen, { emissive: P.ledGreen });
  }
  // Floor cable trays
  fillBox(-23, 2, -17, -16, 2, -17, P.concreteDark);
  // Zone sign
  zoneLabel(-19, 8, -15, 'DATA CENTRE', P.neonBlue);
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
  fillFloor(-24, -8, -20, -10, MEZ, P.carpet);
  fillFloor(-24, -8, -20, -10, MEZ+5, P.ceiling);
  fillBox(-24, MEZ+1, -20, -8, MEZ+5, -20, P.wall);
  fillBox(-24, MEZ+1, -10, -8, MEZ+5, -10, P.wallTrim);
  fillBox(-24, MEZ+1, -20, -24, MEZ+5, -10, P.wall);
  fillBox(-8, MEZ+1, -20, -8, MEZ+5, -10, P.wallTrim);
  // Trading desks
  for (let i = 0; i < 6; i++) {
    const x = -23 + (i % 3) * 4;
    const z = -19 + Math.floor(i / 3) * 4;
    fillBox(x, MEZ+1, z, x+2, MEZ+1, z, P.deskTop);
    fillBox(x, MEZ+1, z, x+2, MEZ+2, z, P.desk);
    // Screens
    vox(x, MEZ+3, z, P.screenOn, { emissive: P.neonAmber });
    vox(x+2, MEZ+3, z, P.screenOn, { emissive: 0x004400 });
    // Chair
    fillBox(x+1, MEZ+1, z+1, x+1, MEZ+2, z+1, P.chair);
  }
  // Alert beacon
  vox(-16, MEZ+4, -15, P.alertRed, { emissive: P.alertRed });
  vox(-15, MEZ+4, -15, P.alertAmber, { emissive: P.alertAmber });
  // Railing overlooking atrium
  for (let x = -22; x <= -10; x++) {
    vox(x, MEZ+1, -10, P.railing);
    vox(x, MEZ+2, -10, P.railingTop, { emissive: P.neonBlue });
  }
  zoneLabel(-16, MEZ+5, -15, 'TRADING FLOOR', P.neonAmber);
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
function buildStaircasesAndBridges() {
  // Staircase left side (x=-24, z=-8 to -3) going up to MEZ
  for (let i = 0; i < MEZ; i++) {
    fillBox(-24, i+2, -8+i, -23, i+2, -8+i, P.concreteLight);
  }
  // Staircase right side (x=23, z=8 to 3) going up to MEZ
  for (let i = 0; i < MEZ; i++) {
    fillBox(23, i+2, 8-i, 24, i+2, 8-i, P.concreteLight);
  }
  // Bridge on mezzanine connecting left zones over atrium
  fillFloor(-24, -8, -10, -8, MEZ, P.floorTile);
  // Railing on bridge
  for (let x = -22; x <= -10; x++) {
    vox(x, MEZ+1, -8, P.railing);
    vox(x, MEZ+2, -8, P.railingTop, { emissive: P.neonBlue });
  }
  // Bridge right side
  fillFloor(8, 24, -10, -8, MEZ, P.floorTile);
  for (let x = 10; x <= 22; x++) {
    vox(x, MEZ+1, -8, P.railing);
    vox(x, MEZ+2, -8, P.railingTop, { emissive: P.neonGreen });
  }
  // Second staircase up left: x=8, z=-10 to -5
  for (let i = 0; i < MEZ; i++) {
    fillBox(-10, i+2, -10+i, -9, i+2, -10+i, P.concreteLight);
  }
  // Staircase right up: x=10, z=5
  for (let i = 0; i < MEZ; i++) {
    fillBox(9, i+2, 10-i, 10, i+2, 10-i, P.concreteLight);
  }
}

function addDetails() {
  // Plants in atrium
  [[-12,-12],[-12,12],[12,-12],[12,12]].forEach(([x,z]) => {
    vox(x, 2, z, P.pot);
    vox(x, 3, z, P.plant);
    vox(x-1, 4, z, P.plant); vox(x+1, 4, z, P.plant);
    vox(x, 4, z-1, P.plant); vox(x, 4, z+1, P.plant);
  });
  // Atrium lighting strips on ceiling (above corridor ring)
  for (let x = -6; x <= 6; x++) vox(x, 9, -7, P.neonBlue, { emissive: P.neonBlue });
  for (let x = -6; x <= 6; x++) vox(x, 9,  7, P.neonBlue, { emissive: P.neonBlue });
  for (let z = -6; z <= 6; z++) vox(-7, 9, z, P.neonPurple, { emissive: P.neonPurple });
  for (let z = -6; z <= 6; z++) vox( 7, 9, z, P.neonPurple, { emissive: P.neonPurple });
  // Some desks in main atrium floor (reception area)
  fillBox(-6, 2, -5, -4, 2, -5, P.deskTop);
  fillBox( 4, 2, -5,  6, 2, -5, P.deskTop);
  // Wayfinding arrow strips on floor
  for (let i = 0; i < 3; i++) vox(-3+i, 2, -9, P.neonAmber, { emissive: P.neonAmber });
  for (let i = 0; i < 3; i++) vox(-3+i, 2,  9, P.neonGreen, { emissive: P.neonGreen });
}

// Zone label helper (thin vertical sign built from blocks)
function zoneLabel(x, y, z, _name, _color) {
  // Physical block sign
  vox(x, y, z, P.wall);
  vox(x, y+1, z, _color, { emissive: _color });
}

// ─── Three.js setup ───────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
document.getElementById('renderer-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a0520, 40, 90);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 200);

function resizeRenderer() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeRenderer);
resizeRenderer();

// ─── Lights ───────────────────────────────────────────────────────────────────
// Generous ambient so the interior is always legible
const ambient = new THREE.AmbientLight(0x9080c0, 1.2);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff0e8, 0.8);
sun.position.set(10, 30, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 100;
sun.shadow.camera.left = sun.shadow.camera.bottom = -35;
sun.shadow.camera.right = sun.shadow.camera.top = 35;
scene.add(sun);

function ptLight(x, y, z, color, intensity, dist) {
  const l = new THREE.PointLight(color, intensity, dist);
  l.position.set(x, y, z);
  scene.add(l);
  return l;
}
// Atrium lights
ptLight(0, 7, 0, 0x8840ff, 4, 24);
ptLight(0, 3, 0, 0x36C5F0, 3, 18);
// Zone fills
ptLight(-19, 5, -15, 0x00aaff, 3, 18);  // data centre
ptLight(18, 5, 15, 0x00e5ff, 3, 16);    // cloud
ptLight(18, 5, -7, 0xffaa00, 3, 14);    // payments
ptLight(-16, 14, -15, 0xffcc00, 3, 18); // trading floor
ptLight(16, 14, -15, 0x0099ff, 3, 18);  // ops centre
ptLight(-16, 14, 15, 0xff2244, 3, 16);  // security
ptLight(16, 14, 15, 0x00ff88, 3, 16);   // customer services
// Corridor fills
ptLight(0, 4, -14, 0x6688ff, 2, 12);
ptLight(0, 4, 14, 0x6688ff, 2, 12);

const hemi = new THREE.HemisphereLight(0x2a1050, 0x0a0820, 0.6);
scene.add(hemi);

// ─── Instanced block renderer ─────────────────────────────────────────────────
const matCache = new Map();
function getMat(color, emissive) {
  const k = `${color}_${emissive}`;
  if (!matCache.has(k)) {
    matCache.set(k, new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: emissive ? new THREE.Color(emissive) : new THREE.Color(0),
      emissiveIntensity: emissive ? 0.85 : 0,
      roughness: 0.8,
      metalness: emissive ? 0.1 : 0,
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
        vec3 top=vec3(0.04,0.02,0.08);
        vec3 mid=vec3(0.10,0.04,0.18);
        vec3 hor=vec3(0.50,0.15,0.02);
        vec3 col=mix(mix(hor,mid,smoothstep(0.,.18,t)),mix(mid,top,smoothstep(.18,1.,t)),step(.18,t));
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
function makeNPC(x, y, z, shirt) {
  const g = new THREE.Group();
  function b(w,h,d,col,ox,oy,oz) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.8 }));
    m.position.set(ox,oy,oz);
    g.add(m);
    return m;
  }
  b(0.6,0.8,0.4, shirt, 0, 0.4, 0);    // body
  b(0.5,0.5,0.5, P.skin, 0, 1.05, 0);  // head
  b(0.5,0.15,0.52, makeRng(shirt)() > 0.5 ? P.hairDark : P.hairBrown, 0, 1.35, 0); // hair
  const lleg = b(0.22,0.5,0.22, P.trousers, -0.18, -0.25, 0);
  const rleg = b(0.22,0.5,0.22, P.trousers,  0.18, -0.25, 0);
  b(0.15,0.4,0.15, P.shoes, -0.18, -0.54, 0);
  b(0.15,0.4,0.15, P.shoes,  0.18, -0.54, 0);
  g.position.set(x + 0.5, y + 1.2, z + 0.5);
  scene.add(g);
  const phase = makeRng(x * 7 + z)() * Math.PI * 2;
  npcAnimated.push({ g, lleg, rleg, phase });
  return g;
}

function spawnNPCs() {
  const shirts = [P.shirt1, P.shirt2, P.shirt3, P.shirt4, 0xffffff, 0x8833ff];
  // Ground floor atrium
  [[-5,1,-5],[-3,1,5],[5,1,-3],[3,1,6],[-2,1,-6],[0,1,0]].forEach(([x,y,z],i) =>
    makeNPC(x, y, z, shirts[i % shirts.length]));
  // Data centre
  [[-22,1,-15],[-20,1,-13],[-18,1,-16]].forEach(([x,y,z],i) =>
    makeNPC(x, y, z, shirts[i % shirts.length]));
  // Mezzanine zones
  [[-20,MEZ,-17],[-15,MEZ,-12],[10,MEZ,-14],[18,MEZ,-12],[-18,MEZ,15],[12,MEZ,14]].forEach(([x,y,z],i) =>
    makeNPC(x, y, z, shirts[i % shirts.length]));
}

// ─── Player character ─────────────────────────────────────────────────────────
const playerMesh = new THREE.Group();
function b3(w,h,d,col,ox,oy,oz,em=0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({ color:col, emissive: em ? new THREE.Color(em) : undefined, emissiveIntensity: em ? 0.6 : 0, roughness:0.7 }));
  m.position.set(ox,oy,oz);
  playerMesh.add(m);
  return m;
}
const plBody  = b3(0.7,0.85,0.5, P.jacketPurple, 0, 0.425, 0);
const plHead  = b3(0.65,0.65,0.65, P.skin, 0, 1.1, 0);
b3(0.65,0.25,0.67, P.hairDark, 0, 1.38, 0);          // hair
b3(0.12,0.12,0.05, 0x111122, -0.15, 1.1, 0.33);      // eye L
b3(0.12,0.12,0.05, 0x111122,  0.15, 1.1, 0.33);      // eye R
const plLegL = b3(0.28,0.52,0.28, P.trousers, -0.2, -0.26, 0);
const plLegR = b3(0.28,0.52,0.28, P.trousers,  0.2, -0.26, 0);
b3(0.24,0.14,0.3, P.shoes, -0.2, -0.56, 0.04);
b3(0.24,0.14,0.3, P.shoes,  0.2, -0.56, 0.04);
const plArmL = b3(0.22,0.55,0.22, P.jacketPurple, -0.5, 0.38, 0);
const plArmR = b3(0.22,0.55,0.22, P.jacketPurple,  0.5, 0.38, 0);
b3(0.35,0.25,0.04, P.neonBlue, 0.62, 0.46, 0.12, P.neonBlue); // tablet
b3(0.35,0.2,0.05, P.natwestRed, 0, 0.6, -0.27, P.natwestRed); // NatWest logo back
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

// Third-person camera offset: behind and above — zoomed out for better world view
const CAM_BACK  = 6.5;
const CAM_UP    = 3.2;
const CAM_LERP  = 0.10;
const camPos = new THREE.Vector3();

function updateCamera() {
  const sinY = Math.sin(player.yaw);
  const cosY = Math.cos(player.yaw);
  const sinP = Math.sin(player.pitch);
  const target = new THREE.Vector3(
    player.x - sinY * Math.cos(player.pitch) * CAM_BACK,
    player.y + PLAYER_HEIGHT + CAM_UP + sinP * CAM_BACK,
    player.z - cosY * Math.cos(player.pitch) * CAM_BACK,
  );
  camPos.lerp(target, CAM_LERP);
  camera.position.copy(camPos);
  camera.lookAt(player.x, player.y + PLAYER_HEIGHT * 0.8, player.z);
}

// ─── Input ────────────────────────────────────────────────────────────────────
const keys = {};
let pointerLocked = false;
let mouseDX = 0, mouseDY = 0;

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    if (gameState === 'playing') togglePause();
    else if (gameState === 'paused') togglePause();
  }
  if ((e.key === 'e' || e.key === 'E') && (gameState === 'playing' || gameState === 'dialog')) doInteract();
  if ((e.key === 'h' || e.key === 'H') && gameState === 'playing') showHint();
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
  player.yaw   -= mouseDX * SENS;
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

  // Move X
  const npx = player.x + player.vx * dt;
  if (!collidesXZ(npx, player.y, player.z)) player.x = npx; else player.vx = 0;

  // Move Z
  const npz = player.z + player.vz * dt;
  if (!collidesXZ(player.x, player.y, npz)) player.z = npz; else player.vz = 0;

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

  // Update player mesh — face movement direction when moving, else face camera yaw
  playerMesh.position.set(player.x, player.y, player.z);
  if (moving) {
    const targetFace = Math.atan2(nx, nz) + Math.PI;
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

function updateHUD() {
  $timer.textContent = fmtT(timeLeft);
  $timer.style.color = timeLeft < 60 ? '#E01E5A' : '#ECB22E';
  const hp = Math.max(0, Math.round(health));
  $fill.style.width = hp + '%';
  $fill.style.background = hp > 60 ? '#2EB67D' : hp > 30 ? '#ECB22E' : '#E01E5A';
  $hpct.textContent = hp + '%';
  $hpct.style.color = $fill.style.background;
  $incidents.innerHTML = `${incidentsDone} / ${TOTAL} <span style="font-size:11px;color:#E01E5A">RESOLVED</span>`;
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
  updateCamera();

  // NPC animation
  npcAnimated.forEach(({ g, lleg, rleg, phase }) => {
    g.position.y += Math.sin(t * 1.5 + phase) * 0.0005;
    const walk = Math.sin(t * 2.5 + phase) * 0.15;
    if (lleg) lleg.rotation.x =  walk;
    if (rleg) rleg.rotation.x = -walk;
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
