/**
 * SEV-1: Save the Bank — 3D Voxel World
 * Three.js isometric banking headquarters
 */
import * as THREE from 'three';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:        0x090817,
  floor:     0x1a1030,
  floor2:    0x160c28,
  carpet:    0x1e0e35,
  wall:      0x3F0E40,
  wallTop:   0x5a1a60,
  glass:     0x1a3a6a,
  glassLit:  0x2a5aaa,
  desk:      0x2a1e10,
  deskTop:   0x3a2e18,
  server:    0x0a1a2a,
  serverLit: 0x0f2a3f,
  screen:    0x001833,
  screenOn:  0x003366,
  neonBlue:  0x36C5F0,
  neonCyan:  0x00e5ff,
  neonGreen: 0x2EB67D,
  neonRed:   0xE01E5A,
  neonAmber: 0xECB22E,
  purple:    0x6a2a8a,
  aubergine: 0x3F0E40,
  white:     0xffffff,
  offWhite:  0xe0e0f0,
  concrete:  0x2a2a3a,
  railing:   0x1a1040,
};

// ── Scene & Renderer ──────────────────────────────────────────────────────────
const scene    = new THREE.Scene();
scene.background = new THREE.Color(C.bg);
scene.fog = new THREE.FogExp2(C.bg, 0.018);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.getElementById('renderer-container').appendChild(renderer.domElement);

function resizeRenderer() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resizeRenderer);

// ── Camera ────────────────────────────────────────────────────────────────────
// Isometric-ish perspective camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 28, 28);
camera.lookAt(0, 0, 0);
resizeRenderer();

const camTarget = new THREE.Vector3();
const camOffset = new THREE.Vector3(0, 28, 28);

// ── Lights ────────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0x1a0f30, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xe8d0ff, 1.2);
sunLight.position.set(20, 40, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 120;
sunLight.shadow.camera.left = -50;
sunLight.shadow.camera.right = 50;
sunLight.shadow.camera.top = 50;
sunLight.shadow.camera.bottom = -50;
scene.add(sunLight);

// Accent lights
function addPointLight(x, y, z, color, intensity, distance) {
  const l = new THREE.PointLight(color, intensity, distance);
  l.position.set(x, y, z);
  scene.add(l);
  return l;
}
const atrium1 = addPointLight(0, 4, 0,  0x36C5F0, 3, 25);
const atrium2 = addPointLight(0, 8, 0,  0x8833ff, 2, 30);
addPointLight(-18, 3, -8,  0xff2244, 2, 18);   // data centre alert
addPointLight( 18, 3,  8,  0x36C5F0, 2, 16);   // cloud
addPointLight(-18, 3,  8,  0xECB22E, 1.5, 14); // payments
addPointLight( 18, 3, -8,  0x2EB67D, 1.5, 14); // ops centre

// Hemisphere sky
const hemi = new THREE.HemisphereLight(0x2a1040, 0x090817, 0.5);
scene.add(hemi);

// ── Geometry factory ─────────────────────────────────────────────────────────
const matCache = new Map();
function mat(color, opts = {}) {
  const key = `${color}_${opts.emissive || 0}_${opts.metalness || 0}_${opts.roughness ?? 0.8}_${opts.transparent || 0}_${opts.opacity ?? 1}`;
  if (!matCache.has(key)) {
    const m = new THREE.MeshStandardMaterial({
      color,
      emissive:    opts.emissive  ? new THREE.Color(opts.emissive) : undefined,
      emissiveIntensity: opts.emissiveIntensity ?? (opts.emissive ? 0.6 : 0),
      metalness:   opts.metalness   ?? 0,
      roughness:   opts.roughness   ?? 0.8,
      transparent: opts.transparent ?? false,
      opacity:     opts.opacity      ?? 1,
    });
    matCache.set(key, m);
  }
  return matCache.get(key);
}

function box(w, h, d, color, opts) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, mat(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addBox(parent, w, h, d, x, y, z, color, opts) {
  const m = box(w, h, d, color, opts);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// ── Building constructor ──────────────────────────────────────────────────────
const building = new THREE.Group();
scene.add(building);

// Floor helper
function floor(x, z, w, d, y, color) {
  addBox(building, w, 0.2, d, x, y, z, color);
}

// Wall helper
function wall(x, y, z, w, h, d, color, opts) {
  addBox(building, w, h, d, x, y + h/2, z, color, opts);
}

// ── A. Ground floor + atrium ─────────────────────────────────────────────────
floor(0, 0, 50, 40, -0.1, C.floor);
floor(0, 0, 48, 38,  0.0, C.carpet);

// Perimeter walls
wall(-24.5, 0, 0, 1, 8, 40, C.wall);
wall( 24.5, 0, 0, 1, 8, 40, C.wall);
wall(0, 0, -19.5, 50, 8, 1, C.wall);
wall(0, 0,  19.5, 50, 8, 1, C.wall);

// Glass walls (transparent panels)
for (let x = -20; x <= 20; x += 4) {
  addBox(building, 3.6, 6, 0.2, x, 3, -19.3, C.glassLit,
    { transparent: true, opacity: 0.35, metalness: 0.8, roughness: 0.1, emissive: C.neonBlue, emissiveIntensity: 0.08 });
  addBox(building, 3.6, 6, 0.2, x, 3,  19.3, C.glassLit,
    { transparent: true, opacity: 0.35, metalness: 0.8, roughness: 0.1, emissive: C.neonBlue, emissiveIntensity: 0.08 });
}

// ── Central atrium floor strip ───────────────────────────────────────────────
floor(0, 0, 12, 12, 0.05, 0x1a0a2a);
// Illuminated floor strips
for (let i = -5; i <= 5; i += 2) {
  addBox(building, 10, 0.08, 0.4, 0, 0.1, i, C.neonBlue,
    { emissive: C.neonBlue, emissiveIntensity: 0.9 });
  addBox(building, 0.4, 0.08, 10, i, 0.1, 0, C.purple,
    { emissive: C.purple, emissiveIntensity: 0.6 });
}

// NatWest cube installation (centrepiece)
const cubeInstall = new THREE.Group();
const cubeSize = 2.4;
const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const cubeMat = new THREE.MeshStandardMaterial({
  color: 0x2a0a40, emissive: new THREE.Color(0x36C5F0),
  emissiveIntensity: 0.5, transparent: true, opacity: 0.8,
  metalness: 0.6, roughness: 0.2,
});
const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
cubeInstall.add(cubeMesh);
// NatWest logo — red chevron bars
for (let i = 0; i < 3; i++) {
  const bar = box(0.3, 0.15, 2.42, 0xE01E5A, { emissive: 0xE01E5A, emissiveIntensity: 1 });
  bar.position.set(-0.4 + i * 0.4, -0.2 + i * 0.2, 0);
  cubeInstall.add(bar);
}
cubeInstall.position.set(0, 1.5, 0);
building.add(cubeInstall);

// ── Second floor (mezzanine) ─────────────────────────────────────────────────
// Mezzanine walkway around atrium
const mezH = 4.5;
floor(-16, 0, 14, 38, mezH, C.floor2);
floor( 16, 0, 14, 38, mezH, C.floor2);
floor(0, -14, 50, 10, mezH, C.floor2);
floor(0,  14, 50, 10, mezH, C.floor2);

// Railings along mezzanine
function railing(x, z, w, d) {
  addBox(building, w, 0.1, d, x, mezH + 0.8, z, C.neonBlue,
    { emissive: C.neonBlue, emissiveIntensity: 0.7 });
  addBox(building, w, 0.8, d, x, mezH + 0.4, z, C.railing,
    { transparent: true, opacity: 0.6, metalness: 0.5, roughness: 0.3 });
}
railing(-9.5, 0, 0.1, 36);
railing( 9.5, 0, 0.1, 36);
railing(0, -9.5, 48, 0.1);
railing(0,  9.5, 48, 0.1);

// Stairs (two sets)
for (let i = 0; i < 9; i++) {
  addBox(building, 3, 0.3, 1, -21, (i * 0.5) + 0.25, -14 + i, 0x2a2040);
  addBox(building, 3, 0.3, 1,  21, (i * 0.5) + 0.25,  14 - i, 0x2a2040);
}

// ── C. Operations Centre (top-right mezzanine, z=-14, x=+) ─────────────────
function makeZoneLabel(text, x, y, z, color = 0xffffff) {
  const canvas2 = document.createElement('canvas');
  canvas2.width = 256; canvas2.height = 64;
  const c = canvas2.getContext('2d');
  c.fillStyle = 'rgba(9,8,23,0.85)';
  c.fillRect(0, 0, 256, 64);
  c.strokeStyle = '#' + color.toString(16).padStart(6, '0');
  c.lineWidth = 2;
  c.strokeRect(1, 1, 254, 62);
  c.fillStyle = '#' + color.toString(16).padStart(6, '0');
  c.font = 'bold 18px Courier New';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(canvas2);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 1),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  plane.position.set(x, y, z);
  scene.add(plane);
  return plane;
}

makeZoneLabel('OPERATIONS CENTRE', 16, mezH + 1.5, -15, 0x36C5F0);
makeZoneLabel('TRADING FLOOR',    -16, mezH + 1.5, -15, 0xECB22E);
makeZoneLabel('SECURITY',         -16, mezH + 1.5,  15, 0xE01E5A);
makeZoneLabel('CUSTOMER SERVICES', 16, mezH + 1.5,  15, 0x2EB67D);
makeZoneLabel('DATA CENTRE',       -8, 1.5,          -16, 0x36C5F0);
makeZoneLabel('CLOUD & INFRASTRUCTURE', 8, 1.5,      16, 0x36C5F0);
makeZoneLabel('PAYMENTS',          16, 1.5,           0, 0xE01E5A);

// ── Zone: Data Centre (ground, x=-8..0, z=-18..-10) ─────────────────────────
function buildDataCentre() {
  const g = new THREE.Group();
  // Server racks
  for (let i = 0; i < 5; i++) {
    const rack = new THREE.Group();
    // Body
    addBox(rack, 1, 4, 2, 0, 2, 0, C.server, { metalness: 0.7, roughness: 0.3 });
    addBox(rack, 0.9, 3.8, 0.1, 0, 2, 1.05, 0x0a0a1a);
    // LED strips per U
    for (let u = 0; u < 8; u++) {
      const ledColor = u < 6 ? C.neonGreen : C.neonRed;
      const led = box(0.5, 0.07, 0.08, ledColor,
        { emissive: ledColor, emissiveIntensity: 1.2 });
      led.position.set(0.1, 0.4 + u * 0.45, 1.06);
      rack.add(led);
    }
    rack.position.set(-12 + i * 2.5, 0, -15);
    g.add(rack);
  }
  building.add(g);
  return g;
}
buildDataCentre();

// ── Zone: Cloud & Infra (ground, x=8..20, z=10..18) ─────────────────────────
function buildCloudInfra() {
  // Network switches + cloud symbols
  for (let i = 0; i < 3; i++) {
    addBox(building, 2, 0.6, 1.2, 12 + i * 3, 0.3, 14, C.serverLit, { metalness: 0.5 });
    addBox(building, 1.8, 0.08, 1, 12 + i * 3, 0.64, 14, C.neonCyan,
      { emissive: C.neonCyan, emissiveIntensity: 0.8 });
  }
  // Cloud symbol (box art)
  const cloud = new THREE.Group();
  addBox(cloud, 1.2, 0.8, 0.3, 0, 0, 0, C.neonBlue, { emissive: C.neonBlue, emissiveIntensity: 0.4 });
  addBox(cloud, 0.7, 0.7, 0.3, -0.3, 0.3, 0, C.neonBlue, { emissive: C.neonBlue, emissiveIntensity: 0.4 });
  addBox(cloud, 0.7, 0.7, 0.3,  0.3, 0.3, 0, C.neonBlue, { emissive: C.neonBlue, emissiveIntensity: 0.4 });
  cloud.position.set(16, 2, 14);
  building.add(cloud);
}
buildCloudInfra();

// ── Zone: Payments (ground, x=14..22, z=-5..5) ──────────────────────────────
function buildPayments() {
  for (let i = 0; i < 4; i++) {
    const unit = new THREE.Group();
    addBox(unit, 1.5, 1.2, 1, 0, 0.6, 0, 0x0a1a2a, { metalness: 0.6 });
    addBox(unit, 1.3, 0.08, 0.8, 0, 1.24, 0, C.neonAmber, { emissive: C.neonAmber, emissiveIntensity: 0.9 });
    // Transaction indicator
    const ind = box(0.3, 0.3, 0.1, i < 2 ? C.neonRed : C.neonGreen,
      { emissive: i < 2 ? C.neonRed : C.neonGreen, emissiveIntensity: 1 });
    ind.position.set(0.4, 0.6, 0.51);
    unit.add(ind);
    unit.position.set(18, 0, -3 + i * 2);
    building.add(unit);
  }
}
buildPayments();

// ── Zone: Operations Centre (mezzanine, x=8..22, z=-18..-10) ────────────────
function buildOpsCenter() {
  // Desks
  for (let i = 0; i < 6; i++) {
    const desk = new THREE.Group();
    addBox(desk, 2, 0.1, 1, 0, 0.75, 0, C.deskTop);
    addBox(desk, 2, 0.7, 1, 0, 0.35, 0, C.desk);
    addBox(desk, 0.8, 0.5, 0.05, 0, 1.1, 0.4, C.screenOn,
      { emissive: C.neonBlue, emissiveIntensity: 0.5 });
    desk.position.set(10 + (i % 3) * 2.5, mezH, -16 + Math.floor(i / 3) * 2.2);
    building.add(desk);
  }
  // Incident console (big monitor wall)
  addBox(building, 8, 3, 0.3, 16, mezH + 2, -18.7, C.screen,
    { emissive: C.neonBlue, emissiveIntensity: 0.25 });
  addBox(building, 7.6, 2.6, 0.1, 16, mezH + 2, -18.55, 0x002244,
    { emissive: 0x003366, emissiveIntensity: 0.4 });
}
buildOpsCenter();

// ── Zone: Trading Floor (mezzanine, x=-22..-8, z=-18..-10) ──────────────────
function buildTradingFloor() {
  for (let i = 0; i < 8; i++) {
    const desk = new THREE.Group();
    addBox(desk, 1.8, 0.1, 1, 0, 0.75, 0, C.deskTop);
    addBox(desk, 1.8, 0.7, 1, 0, 0.35, 0, C.desk);
    // Dual screens
    for (let s = -1; s <= 1; s += 2) {
      addBox(desk, 0.55, 0.5, 0.05, s * 0.4, 1.1, 0.45, C.screenOn,
        { emissive: C.neonAmber, emissiveIntensity: 0.4 });
    }
    desk.position.set(-18 + (i % 4) * 2.2, mezH, -16 + Math.floor(i / 4) * 2.2);
    building.add(desk);
  }
  // Alert beacon
  const beacon = new THREE.Group();
  addBox(beacon, 0.3, 1.2, 0.3, 0, 0.6, 0, 0x221122);
  const beaconLight = box(0.5, 0.5, 0.5, C.neonRed, { emissive: C.neonRed, emissiveIntensity: 1.5 });
  beaconLight.position.set(0, 1.45, 0);
  beacon.add(beaconLight);
  beacon.position.set(-16, mezH, -16);
  building.add(beacon);
  return beacon;
}
buildTradingFloor();

// ── Zone: Security (mezzanine, x=-22..-8, z=10..18) ─────────────────────────
function buildSecurity() {
  // Security consoles
  for (let i = 0; i < 3; i++) {
    const con = new THREE.Group();
    addBox(con, 2, 1, 1.2, 0, 0.5, 0, 0x0a0a1a, { metalness: 0.7 });
    addBox(con, 1.8, 0.08, 1, 0, 1.04, 0, C.neonRed, { emissive: C.neonRed, emissiveIntensity: 0.7 });
    addBox(con, 1.4, 0.9, 0.05, 0, 1.5, 0.56, 0x0a0a1a,
      { emissive: 0x330000, emissiveIntensity: 0.5 });
    con.position.set(-20 + i * 3, mezH, 16);
    building.add(con);
  }
  // Locked door indicator
  addBox(building, 2, 3, 0.3, -10, mezH + 1.5, 19.5, 0x1a0000);
  addBox(building, 0.8, 0.8, 0.1, -10, mezH + 1.5, 19.6, C.neonRed,
    { emissive: C.neonRed, emissiveIntensity: 1.2 });
}
buildSecurity();

// ── Zone: Customer Services (mezzanine, x=8..22, z=10..18) ──────────────────
function buildCustomerServices() {
  for (let i = 0; i < 5; i++) {
    const desk = new THREE.Group();
    addBox(desk, 2.5, 0.8, 1, 0, 0.4, 0, C.desk);
    addBox(desk, 2.3, 0.08, 0.8, 0, 0.84, 0, C.deskTop);
    addBox(desk, 1, 0.7, 0.05, 0.5, 1.2, 0.41, C.screenOn,
      { emissive: C.neonGreen, emissiveIntensity: 0.4 });
    desk.position.set(10 + (i % 3) * 2.8, mezH, 14 + Math.floor(i / 3) * 2);
    building.add(desk);
  }
}
buildCustomerServices();

// ── Background: City skyline (dusk) ─────────────────────────────────────────
function buildSkyline() {
  const skyColors = [0x1a0a3a, 0x0d0820, 0x150d30];
  const heights   = [30, 22, 18, 25, 14, 20, 28, 16];
  for (let i = 0; i < heights.length; i++) {
    const h = heights[i];
    const bld = box(5, h, 5, skyColors[i % 3], { roughness: 1 });
    bld.position.set(-35 + i * 10, h / 2 - 4, -40);
    scene.add(bld);
    // Windows
    for (let wy = 0; wy < h; wy += 3) {
      for (let wx = -1; wx <= 1; wx++) {
        if (Math.random() > 0.4) {
          const win = box(0.6, 0.6, 0.1, 0xECB22E,
            { emissive: 0xECB22E, emissiveIntensity: Math.random() * 0.6 + 0.2 });
          win.position.set(-35 + i * 10 + wx * 1.5, wy - 2, -37.5);
          scene.add(win);
        }
      }
    }
  }
  // Sky gradient (large back plane)
  const skyGeo = new THREE.PlaneGeometry(200, 60);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x0a0520 });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.position.set(0, 20, -55);
  scene.add(sky);
  // Horizon glow
  const glowGeo = new THREE.PlaneGeometry(200, 12);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff4400, transparent: true, opacity: 0.12,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, -2, -54);
  scene.add(glow);
}
buildSkyline();

// ── Animated elements ────────────────────────────────────────────────────────
const animatedBeacons = [];
function addBeacon(x, y, z) {
  const b = box(0.4, 0.4, 0.4, C.neonRed, { emissive: C.neonRed, emissiveIntensity: 1.5 });
  b.position.set(x, y, z);
  building.add(b);
  animatedBeacons.push(b);
  return b;
}
// Incident alert beacons in various zones
addBeacon(-8, 1, -15);  // data centre
addBeacon(18, 2, 0);    // payments
addBeacon(-16, mezH + 1, -15); // trading floor

// ── NPCs (voxel characters) ──────────────────────────────────────────────────
function makeNPC(color, x, y, z) {
  const npc = new THREE.Group();
  addBox(npc, 0.5, 0.6, 0.4, 0, 0.3, 0, color); // body
  addBox(npc, 0.45, 0.45, 0.45, 0, 0.95, 0, 0xc68642); // head
  addBox(npc, 0.2, 0.4, 0.2, -0.38, 0.3, 0, color); // arm L
  addBox(npc, 0.2, 0.4, 0.2,  0.38, 0.3, 0, color); // arm R
  addBox(npc, 0.2, 0.5, 0.2, -0.15, -0.25, 0, 0x1a1a3a); // leg L
  addBox(npc, 0.2, 0.5, 0.2,  0.15, -0.25, 0, 0x1a1a3a); // leg R
  npc.position.set(x, y + 0.6, z);
  building.add(npc);
  return npc;
}
// Populate zones with staff
const npcs = [
  makeNPC(0x36C5F0, -12, 0, -13),
  makeNPC(0x2EB67D,  14, mezH, -14),
  makeNPC(0xECB22E, -14, mezH, -14),
  makeNPC(0x8833ff,  -8, 0, -12),
  makeNPC(0x36C5F0,  16, mezH,  14),
  makeNPC(0xE01E5A, -16, mezH,  14),
];

// ── Player character ──────────────────────────────────────────────────────────
const playerGroup = new THREE.Group();
const playerBody  = addBox(playerGroup, 0.7, 0.85, 0.5, 0, 0.425, 0, 0x5a1a6a, { roughness: 0.6 });
const playerHead  = addBox(playerGroup, 0.65, 0.65, 0.65, 0, 1.1, 0, 0xc68642);
addBox(playerGroup, 0.65, 0.25, 0.67, 0, 1.35, 0, 0x2a1a0a); // hair
// Eyes
addBox(playerGroup, 0.12, 0.12, 0.05, -0.15, 1.1, 0.34, 0x111122);
addBox(playerGroup, 0.12, 0.12, 0.05,  0.15, 1.1, 0.34, 0x111122);
const playerLegL = addBox(playerGroup, 0.28, 0.5, 0.28, -0.2, -0.25, 0, 0x1a1a3a);
const playerLegR = addBox(playerGroup, 0.28, 0.5, 0.28,  0.2, -0.25, 0, 0x1a1a3a);
const playerArmL = addBox(playerGroup, 0.22, 0.55, 0.22, -0.5, 0.4, 0, 0x5a1a6a);
const playerArmR = addBox(playerGroup, 0.22, 0.55, 0.22,  0.5, 0.4, 0, 0x5a1a6a);
// Tablet
addBox(playerGroup, 0.35, 0.25, 0.04, 0.62, 0.5, 0.1, 0x36C5F0,
  { emissive: 0x36C5F0, emissiveIntensity: 0.4 });
// NatWest logo on back
addBox(playerGroup, 0.35, 0.25, 0.05, 0, 0.6, -0.28, C.neonRed,
  { emissive: C.neonRed, emissiveIntensity: 0.6 });

playerGroup.position.set(2, 0.5, 2);
scene.add(playerGroup);

// ── Game state ────────────────────────────────────────────────────────────────
let gameState    = 'title';
let score        = 0;
let health       = 100;
let timeLeft     = 300;
let lastTimestamp = 0;
let timerRunning = false;
let incidentsDone = 0;
const TOTAL_INCIDENTS = 5;
let evidenceList = [];
let currentDialogSeq = null;
let currentDialogIdx = 0;
let nearestObj = null;
let hintCooldown = 0;

// ── Objectives / interactables ────────────────────────────────────────────────
const objectives = [
  {
    id: 'beacon_atrium',
    label: 'E — Inspect SEV-1 Alert',
    pos: new THREE.Vector3(0, 0.5, 0),
    radius: 3.5,
    done: false,
    available: () => incidentsDone === 0,
    dialog: [
      { who: 'SEV-1 ALERT — INCIDENT-0042', text: 'CRITICAL | ALL SERVICES DEGRADED\nCustomer logins failing. Payments timing out.\nBank health: 68% and falling fast.\n\nObjectives assigned:\n1. Data Centre — investigate server fault\n2. Cloud & Infra — restore network link\n3. Payments — recover transaction processing\n4. Ops Centre — confirm service health' },
      { who: 'AI ASSISTANT', text: 'Investigation started. Check the Data Centre first — the monitoring dashboard shows DB-related errors. Collect evidence at each zone.' },
    ],
    onComplete: () => { incidentsDone++; health = Math.min(100, health + 5); addScore(100, 'Alert inspected'); },
  },
  {
    id: 'data_centre',
    label: 'E — Investigate Server Fault',
    pos: new THREE.Vector3(-10, 0.5, -15),
    radius: 4,
    done: false,
    available: () => incidentsDone >= 1,
    dialog: [
      { who: 'DATA CENTRE — RACK-DB-03', text: 'FAULT DETECTED\nDisk array: DEGRADED (RAID-5 rebuild active)\nI/O wait: 94%  |  Queue depth: 847\nConnection pool: 50/50 SATURATED\nLast healthy snapshot: 08:58 UTC' },
      { who: 'DATA CENTRE', text: 'Evidence collected: DB I/O saturation causing connection pool exhaustion. The auth and payments services are cascading from this single fault.' },
    ],
    onComplete: () => {
      incidentsDone++;
      addScore(250 + 50, 'Data Centre investigated + evidence');
      collectEvidence('db_fault', 'Data Centre: RAID rebuild saturating I/O');
      // Flash racks green
      animatedBeacons[0].material.emissive.set(C.neonGreen);
    },
  },
  {
    id: 'cloud_infra',
    label: 'E — Restore Network Link',
    pos: new THREE.Vector3(16, 0.5, 14),
    radius: 4,
    done: false,
    available: () => incidentsDone >= 2,
    dialog: [
      { who: 'CLOUD & INFRASTRUCTURE — NET-SW-07', text: 'Network path to DB replica: DEGRADED\nFailover did not trigger — replica unreachable.\nApplying fix: re-enabling replica routing...\n\n✓ Replica connection restored\n✓ Failover path verified\n✓ Connection pool pressure reducing: 44/50' },
    ],
    onComplete: () => {
      incidentsDone++;
      health = Math.min(100, health + 15);
      addScore(500, 'Network link restored!');
      collectEvidence('network_fix', 'Cloud: DB replica routing restored');
    },
  },
  {
    id: 'payments',
    label: 'E — Recover Transaction Processing',
    pos: new THREE.Vector3(18, 0.5, -2),
    radius: 4,
    done: false,
    available: () => incidentsDone >= 3,
    dialog: [
      { who: 'PAYMENTS PLATFORM — PAY-API-01', text: 'Transaction queue: draining (847 → 112 pending)\nLatency: 12400ms → 890ms\nError rate: 78% → 4.2%\n\nApplying remediation: circuit-breaker reset + pool expansion...\n\n✓ Circuit breaker reset\n✓ Pool expanded: 50 → 120 connections\n✓ Transaction rate normalising' },
    ],
    onComplete: () => {
      incidentsDone++;
      health = Math.min(100, health + 20);
      addScore(500, 'Payments recovered!');
      animatedBeacons[1].material.emissive.set(C.neonGreen);
    },
  },
  {
    id: 'ops_centre',
    label: 'E — Verify Service Restoration',
    pos: new THREE.Vector3(16, mezH + 0.5, -16),
    radius: 4,
    done: false,
    available: () => incidentsDone >= 4,
    dialog: [
      { who: 'OPERATIONS CENTRE — MONITORING', text: 'Running full health check...\n\n✓ auth-service       HEALTHY  p99: 180ms\n✓ db-primary         HEALTHY  I/O: 22%\n✓ db-replica         HEALTHY  connections: 28/120\n✓ payments-api       HEALTHY  error rate: 0.1%\n✓ mobile-app         HEALTHY  apdex: 0.96\n✓ branch-services    HEALTHY  all terminals OK\n\nBank Health: RESTORED' },
      { who: 'OPERATIONS CENTRE', text: 'SEV-1 RESOLVED. Incident summary published.\nRoot cause: RAID-5 disk rebuild on db-primary caused I/O saturation, exhausting connection pool. Cascaded to auth and payments services.\nPrevention: Increase connection pool limit; enable proactive RAID monitoring alerts.' },
    ],
    onComplete: () => {
      incidentsDone++;
      health = Math.min(100, health + 20);
      addScore(150 + 200, 'Service verified + summary published');
      animatedBeacons[2].material.emissive.set(C.neonGreen);
      setTimeout(() => endGame(), 2000);
    },
  },
];

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && gameState === 'playing') togglePause();
  else if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && gameState === 'paused') togglePause();
  if ((e.key === 'e' || e.key === 'E') && (gameState === 'playing' || gameState === 'dialog')) doInteract();
  if ((e.key === 'h' || e.key === 'H') && gameState === 'playing') showHint();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// ── Player movement state ─────────────────────────────────────────────────────
const playerVel   = new THREE.Vector3();
const PLAYER_SPEED = 5;

// Simplified collision: keep player inside building bounds
function clampPlayer(pos) {
  pos.x = Math.max(-22, Math.min(22, pos.x));
  pos.z = Math.max(-18, Math.min(18, pos.z));
  // Auto-elevate to mezzanine when over staircase areas
  if ((pos.x < -20 && pos.z < -12) || (pos.x < -20 && pos.z > 12) ||
      (pos.x >  20 && pos.z < -12) || (pos.x >  20 && pos.z > 12)) {
    pos.y = Math.max(0.5, Math.min(5, pos.y));
  } else if (Math.abs(pos.x) > 10 && Math.abs(pos.z) > 10) {
    pos.y = mezH + 0.5;
  } else {
    pos.y = 0.5;
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────
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

function fmtTime(s) {
  const m  = Math.floor(s / 60);
  const ss = String(Math.floor(s % 60)).padStart(2, '0');
  return `${m}:${ss}`;
}

function updateHUD() {
  $timer.textContent = fmtTime(timeLeft);
  $timer.style.color = timeLeft < 60 ? '#E01E5A' : '#ECB22E';

  const hp = Math.max(0, Math.round(health));
  $fill.style.width  = hp + '%';
  $fill.style.background = hp > 60 ? '#2EB67D' : hp > 30 ? '#ECB22E' : '#E01E5A';
  $hpct.textContent  = hp + '%';
  $hpct.style.color  = $fill.style.background;

  $incidents.innerHTML = `${incidentsDone} / ${TOTAL_INCIDENTS} <span style="font-size:11px;color:#E01E5A">RESOLVED</span>`;
}

let toastTmr = null;
function showToast(msg, bg = '#2EB67D') {
  $toast.textContent  = msg;
  $toast.style.background = bg;
  $toast.style.color  = bg === '#ECB22E' ? '#090817' : '#fff';
  $toast.style.display = 'block';
  if (toastTmr) clearTimeout(toastTmr);
  toastTmr = setTimeout(() => { $toast.style.display = 'none'; }, 3000);
}

function addScore(pts, reason) {
  score += pts;
  showToast(`+${pts} — ${reason}`, pts >= 500 ? '#2EB67D' : '#36C5F0');
}

function collectEvidence(id, label) {
  if (evidenceList.includes(id)) return;
  evidenceList.push(id);
  const div = document.createElement('div');
  div.className = 'ev-item';
  div.textContent = '✓ ' + label;
  $evList.appendChild(div);
  $evPanel.style.display = 'block';
}

// ── Dialog system ─────────────────────────────────────────────────────────────
function openDialog(seq, onEnd) {
  currentDialogSeq = seq;
  currentDialogIdx = 0;
  currentDialogOnEnd = onEnd || null;
  advanceDialog();
  gameState = 'dialog';
}
let currentDialogOnEnd = null;

function advanceDialog() {
  if (!currentDialogSeq || currentDialogIdx >= currentDialogSeq.length) {
    $dialog.style.display = 'none';
    gameState = 'playing';
    if (currentDialogOnEnd) { currentDialogOnEnd(); currentDialogOnEnd = null; }
    currentDialogSeq = null;
    return;
  }
  const d = currentDialogSeq[currentDialogIdx++];
  $dlgWho.textContent = d.who;
  $dlgTxt.textContent = d.text;
  $dialog.style.display = 'block';
}

function doInteract() {
  if (gameState === 'dialog') { advanceDialog(); return; }
  if (gameState !== 'playing') return;
  if (!nearestObj) return;

  const obj = objectives.find(o => o.id === nearestObj);
  if (!obj || obj.done || !obj.available()) return;

  obj.done = true;
  openDialog(obj.dialog, obj.onComplete);
}

// ── Hint ─────────────────────────────────────────────────────────────────────
const HINTS = [
  'Find the glowing red alert beacon in the central atrium and press E.',
  'Head to the Data Centre (bottom-left) — look for the glowing server racks.',
  'Cloud & Infrastructure is in the lower-right zone. Restore the network link.',
  'Payments zone is on the right side. Recover the transaction processing unit.',
  'Take the stairs to the mezzanine and find the Operations Centre to verify recovery.',
];
function showHint() {
  if (hintCooldown > 0) { showToast(`Hint cooldown: ${Math.ceil(hintCooldown)}s`, '#ECB22E'); return; }
  const hint = HINTS[Math.min(incidentsDone, HINTS.length - 1)];
  openDialog([{ who: 'AI ASSISTANT', text: hint }]);
  hintCooldown = 20;
}

// ── Pause / end ───────────────────────────────────────────────────────────────
function togglePause() {
  if (gameState === 'playing') {
    gameState = 'paused';
    timerRunning = false;
    document.getElementById('pause-overlay').style.display = 'flex';
  } else if (gameState === 'paused') {
    gameState = 'playing';
    timerRunning = true;
    document.getElementById('pause-overlay').style.display = 'none';
  }
}

function endGame() {
  timerRunning = false;
  gameState    = 'end';
  let g, t, s;
  if (score >= 1700 && timeLeft > 120) {
    g = 'S'; t = 'SEV-1 CHAMPION';    s = 'Perfect run. The bank is back online and customers never noticed.';
  } else if (score >= 1100) {
    g = 'A'; t = 'INCIDENT HERO';     s = 'All services restored with strong diagnosis. Well handled.';
  } else if (score >= 700) {
    g = 'B'; t = 'RELIABLE RESPONDER';s = 'Service recovered with some delay. Good effort.';
  } else {
    g = 'C'; t = 'RECOVERY REQUIRED'; s = 'Services restored, but key steps were missed or slow.';
  }
  const gradeColors = { S: '#ECB22E', A: '#2EB67D', B: '#36C5F0', C: '#888' };
  document.getElementById('end-grade').textContent = g;
  document.getElementById('end-grade').style.color = gradeColors[g];
  document.getElementById('end-title').textContent = t;
  document.getElementById('end-summary').textContent = s;
  document.getElementById('end-score').textContent = `Final score: ${score.toLocaleString()}`;
  document.getElementById('end-overlay').style.display = 'flex';
}

// ── Start / restart ───────────────────────────────────────────────────────────
function startGame() {
  score = 0; health = 100; timeLeft = 300;
  incidentsDone = 0; evidenceList = [];
  hintCooldown = 0;
  objectives.forEach(o => {
    o.done = false;
    if (o.id === 'data_centre' || o.id === 'payments') {
      animatedBeacons[objectives.indexOf(o)]?.material.emissive.set(C.neonRed);
    }
  });
  animatedBeacons.forEach(b => b.material.emissive.set(C.neonRed));
  $evList.innerHTML = '';
  $evPanel.style.display = 'none';
  $dialog.style.display = 'none';
  $toast.style.display = 'none';
  playerGroup.position.set(2, 0.5, 2);
  document.getElementById('title-overlay').style.display = 'none';
  document.getElementById('end-overlay').style.display = 'none';
  document.getElementById('pause-overlay').style.display = 'none';
  document.getElementById('minimap').style.display = 'block';
  timerRunning = true;
  gameState = 'playing';
  updateHUD();
}

// ── Minimap ───────────────────────────────────────────────────────────────────
const minimapCtx = document.getElementById('minimap-canvas').getContext('2d');
function drawMinimap() {
  const mw = 140, mh = 90;
  const scaleX = mw / 50, scaleZ = mh / 40;
  const offX = 25, offZ = 20;
  minimapCtx.fillStyle = '#090817';
  minimapCtx.fillRect(0, 0, mw, mh);
  // Building outline
  minimapCtx.strokeStyle = '#3F0E40';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(1, 1, mw - 2, mh - 2);
  // Zone markers
  const zones = [
    { x: -8, z: -15, label: 'DC', color: '#36C5F0' },
    { x: 16, z: 14, label: 'CI', color: '#36C5F0' },
    { x: 18, z: -2, label: 'PAY', color: '#E01E5A' },
    { x: 16, z: -16, label: 'OPS', color: '#2EB67D' },
    { x: -16, z: -16, label: 'TRD', color: '#ECB22E' },
    { x: -16, z: 16, label: 'SEC', color: '#E01E5A' },
    { x: 16, z: 16, label: 'CS', color: '#2EB67D' },
  ];
  zones.forEach(z => {
    const mx = (z.x + offX) * scaleX;
    const mz = (z.z + offZ) * scaleZ;
    minimapCtx.fillStyle = z.color + '44';
    minimapCtx.fillRect(mx - 6, mz - 4, 12, 8);
    minimapCtx.fillStyle = z.color;
    minimapCtx.font = '6px Courier New';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText(z.label, mx, mz + 2);
  });
  // Player dot
  const px = (playerGroup.position.x + offX) * scaleX;
  const pz = (playerGroup.position.z + offZ) * scaleZ;
  minimapCtx.fillStyle = '#ffffff';
  minimapCtx.beginPath();
  minimapCtx.arc(px, pz, 3, 0, Math.PI * 2);
  minimapCtx.fill();
  // Objectives
  objectives.forEach(obj => {
    if (obj.done || !obj.available()) return;
    const ox = (obj.pos.x + offX) * scaleX;
    const oz = (obj.pos.z + offZ) * scaleZ;
    minimapCtx.fillStyle = '#E01E5A';
    minimapCtx.beginPath();
    minimapCtx.arc(ox, oz, 3, 0, Math.PI * 2);
    minimapCtx.fill();
  });
}

// ── Portrait canvas (pixel art of player) ────────────────────────────────────
function drawPortrait() {
  const pc = document.getElementById('portrait-canvas');
  const c  = pc.getContext('2d');
  c.fillStyle = '#1a0a2a';
  c.fillRect(0, 0, 36, 36);
  // simple pixel art
  c.fillStyle = '#c68642';
  c.fillRect(12, 6, 12, 11); // head
  c.fillStyle = '#2a1a0a';
  c.fillRect(12, 6, 12, 5);  // hair
  c.fillStyle = '#5a1a6a';
  c.fillRect(10, 17, 16, 11); // body
  c.fillStyle = '#36C5F0';
  c.fillRect(23, 18, 5, 7);   // tablet
  c.fillStyle = '#1a1a3a';
  c.fillRect(12, 28, 5, 7);   // leg L
  c.fillRect(19, 28, 5, 7);   // leg R
}
drawPortrait();

// ── Main loop ─────────────────────────────────────────────────────────────────
let walkPhase = 0;

function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
  lastTimestamp = now;

  if (gameState === 'playing') {
    // Timer
    if (timerRunning) {
      timeLeft   = Math.max(0, timeLeft - dt);
      hintCooldown = Math.max(0, hintCooldown - dt);
      health     = Math.max(0, health - dt * 0.3);
      if (timeLeft <= 0 && incidentsDone < TOTAL_INCIDENTS) endGame();
    }

    // Player movement
    let dx = 0, dz = 0;
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx = -1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) dx =  1;
    if (keys['ArrowUp']    || keys['w'] || keys['W']) dz = -1;
    if (keys['ArrowDown']  || keys['s'] || keys['S']) dz =  1;

    const moving = dx !== 0 || dz !== 0;
    if (moving) {
      const len = Math.hypot(dx, dz);
      playerGroup.position.x += (dx / len) * PLAYER_SPEED * dt;
      playerGroup.position.z += (dz / len) * PLAYER_SPEED * dt;
      if (dx !== 0 || dz !== 0) {
        playerGroup.rotation.y = Math.atan2(dx, dz);
      }
    }
    clampPlayer(playerGroup.position);

    // Walk animation
    if (moving) {
      walkPhase += dt * 8;
      playerLegL.position.y = -0.25 + Math.sin(walkPhase) * 0.12;
      playerLegR.position.y = -0.25 - Math.sin(walkPhase) * 0.12;
      playerArmL.rotation.x =  Math.sin(walkPhase) * 0.3;
      playerArmR.rotation.x = -Math.sin(walkPhase) * 0.3;
    } else {
      playerLegL.position.y = -0.25;
      playerLegR.position.y = -0.25;
      playerArmL.rotation.x = 0;
      playerArmR.rotation.x = 0;
    }

    // Camera follow
    camTarget.lerp(playerGroup.position, 0.07);
    camera.position.x = camTarget.x + camOffset.x;
    camera.position.y = camTarget.y + camOffset.y;
    camera.position.z = camTarget.z + camOffset.z;
    camera.lookAt(camTarget.x, camTarget.y + 2, camTarget.z);

    // Find nearest objective
    let nearest = null, nearDist = Infinity;
    objectives.forEach(obj => {
      if (obj.done || !obj.available()) return;
      const d = playerGroup.position.distanceTo(obj.pos);
      if (d < obj.radius && d < nearDist) { nearDist = d; nearest = obj.id; }
    });
    nearestObj = nearest;
    const obj = nearest ? objectives.find(o => o.id === nearest) : null;
    $prompt.textContent = obj ? obj.label : '';
    $prompt.style.display = nearest ? 'block' : 'none';

    updateHUD();
    drawMinimap();
  }

  // Animate beacons
  const t = now * 0.002;
  animatedBeacons.forEach((b, i) => {
    b.material.emissiveIntensity = 0.8 + Math.sin(t * 3 + i) * 0.7;
    b.scale.setScalar(0.9 + Math.sin(t * 3 + i) * 0.15);
  });

  // Rotate cube installation
  cubeInstall.rotation.y = t * 0.4;
  cubeMat.emissiveIntensity = 0.4 + Math.sin(t) * 0.15;

  // NPC gentle bob
  npcs.forEach((npc, i) => {
    npc.position.y = 0.6 + Math.sin(t * 1.2 + i * 1.5) * 0.04;
  });

  renderer.render(scene, camera);
}

// ── Wire buttons ──────────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('resume-btn').addEventListener('click', togglePause);
document.getElementById('replay-btn').addEventListener('click', startGame);
document.getElementById('hint-btn').addEventListener('click', showHint);

// ── Boot ──────────────────────────────────────────────────────────────────────
resizeRenderer();
requestAnimationFrame(t => { lastTimestamp = t; tick(t); });
