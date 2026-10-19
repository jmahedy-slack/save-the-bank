/**
 * SEV-1: Save the Bank — NatWest Engineering Arcade
 * 2D canvas top-down incident response game
 */
(function () {
  'use strict';

  // ─── Constants ─────────────────────────────────────────────────────────────
  const TILE = 32;
  const PAL = {
    bg:       '#090817',
    floor:    '#1a1030',
    floor2:   '#160c2a',
    wall:     '#3F0E40',
    wallLit:  '#5a1560',
    carpet:   '#1e0e35',
    counter:  '#2a1840',
    aubergine:'#3F0E40',
    blue:     '#36C5F0',
    green:    '#2EB67D',
    amber:    '#ECB22E',
    red:      '#E01E5A',
    white:    '#FFFFFF',
    grey:     '#555577',
    darkGrey: '#222233',
    neonBlue: '#00e5ff',
    neonGreen:'#00ff88',
    neonRed:  '#ff003c',
    neonAmber:'#ffcc00',
    serverRack:'#1c2a3a',
    screen:   '#001833',
    terminal: '#001122',
    desk:     '#2a1e0e',
    plant:    '#1a3a1a',
  };

  // Tile types
  const T = {
    FLOOR:   0,
    WALL:    1,
    DESK:    2,
    SERVER:  3,
    TERMINAL:4,
    ATM:     5,
    PLANT:   6,
    CARPET:  7,
    COUNTER: 8,
    ALERT:   9,
    DOOR:    10,
    MONITOR: 11,
    RACK:    12,
  };

  // ─── Game state ─────────────────────────────────────────────────────────────
  let state = 'title'; // title | playing | paused | end
  let score = 0;
  let health = 100;
  let timeLeft = 300; // seconds
  let lastTime = 0;
  let timerRunning = false;
  let evidenceCollected = [];
  let incidentState = 'detected'; // detected|investigating|diagnosed|remediating|validating|resolved
  let hintCooldown = 0;
  let interactTarget = null;
  let dialogQueue = [];
  let dialogOpen = false;

  // ─── Canvas setup ───────────────────────────────────────────────────────────
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // ─── Camera ─────────────────────────────────────────────────────────────────
  const cam = { x: 0, y: 0 };

  // ─── Player ─────────────────────────────────────────────────────────────────
  const player = {
    x: 5 * TILE, y: 5 * TILE,
    w: 20, h: 20,
    speed: 3,
    dir: 'down',
    animFrame: 0,
    animTimer: 0,
    moving: false,
  };

  // ─── Input ──────────────────────────────────────────────────────────────────
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && state === 'playing') togglePause();
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && state === 'paused') togglePause();
    if ((e.key === 'e' || e.key === 'E') && state === 'playing') doInteract();
    if ((e.key === 'h' || e.key === 'H') && state === 'playing') showHint();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ─── Map definition (Level 1 — Branch Operations) ───────────────────────────
  // 28 cols × 20 rows
  const MAP_W = 28;
  const MAP_H = 20;

  // prettier-ignore
  const MAP_RAW = [
    // 0         1         2
    // 0123456789012345678901234567
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWW', // 0
    'WF.FF.FF.FF.FF.FF.FF.FF.FF.W', // 1
    'WF.CCCCCCCCCCCCCCCCCCCCCC.FW', // 2
    'WF.CDDDDDDDDDDDDDDDDDDDDDC.W', // 3 -- counter row
    'WF.CFFFFFFFFFFFFFFFFFFFFF C.W', // 4
    'WF.CFFFFFFFFFF  FFFFFFFFFFF.W', // 5 spacing
    'W ..FFFFFFFFF  FFFFFFFFFFFFFF', // 6
    'W..FFFFFFFF  FFFFFFFFFFFFFFFF', // 7
    'WF FF FFFFF FFFFFF FFFFF FF W', // 8
    'WF FF FFFFF FFFFFF FFFFF FF W', // 9
    'WF FF FFFFF FFFFFF FFFFF FF W', // 10
    'WFFFFFFFFFFFFFFFFFFFFFFFFFFF W', // 11
    'W TTTTTTT  ATTTTT  TTTTTTT  W', // 12 -- terminals row
    'W TTTTTTT  ATTTTT  TTTTTTT  W', // 13
    'WFFFFFFFFFFFFFFFFFFFFFFFFFFF W', // 14
    'W PPPP    PP  PP  PP  PPPP  W', // 15 -- plants/decor
    'WFFFFFFFFFFFFFFFFFFFFFFFFFFF W', // 16
    'WMMMMMMMMMMMMMMMMMMMMMMMMMM  W', // 17 -- monitors row
    'WFFFFFFFFFFFFFFFFFFFFFFFFFF  W', // 18
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWW', // 19
  ];

  // Build proper tile grid
  const tiles = [];
  for (let row = 0; row < MAP_H; row++) {
    tiles[row] = [];
    for (let col = 0; col < MAP_W; col++) {
      const ch = (MAP_RAW[row] || '')[col] || ' ';
      let t = T.FLOOR;
      switch (ch) {
        case 'W': t = T.WALL;     break;
        case 'C': t = T.COUNTER;  break;
        case 'D': t = T.DESK;     break;
        case 'T': t = T.TERMINAL; break;
        case 'A': t = T.ATM;      break;
        case 'P': t = T.PLANT;    break;
        case 'M': t = T.MONITOR;  break;
        case 'S': t = T.SERVER;   break;
        default:  t = T.FLOOR;    break;
      }
      tiles[row][col] = t;
    }
  }

  // Solid tile types
  const SOLID = new Set([T.WALL, T.DESK, T.COUNTER, T.SERVER, T.PLANT, T.ATM, T.RACK]);

  function tileAt(col, row) {
    if (row < 0 || row >= MAP_H || col < 0 || col >= MAP_W) return T.WALL;
    return tiles[row][col];
  }

  function isSolid(col, row) {
    return SOLID.has(tileAt(col, row));
  }

  // ─── Interactive objects ─────────────────────────────────────────────────────
  const INTERACTABLES = [
    {
      id: 'alert_beacon',
      col: 12, row: 12,
      label: '[E] Inspect Alert',
      icon: '🚨',
      action: 'inspect_alert',
      available: () => incidentState === 'detected',
    },
    {
      id: 'terminal_a',
      col: 6, row: 12,
      label: '[E] Check Terminal',
      icon: '💻',
      action: 'check_terminal',
      available: () => incidentState === 'investigating' && !evidenceCollected.includes('terminal_logs'),
    },
    {
      id: 'terminal_b',
      col: 20, row: 12,
      label: '[E] Check Network Switch',
      icon: '🔌',
      action: 'check_network',
      available: () => incidentState === 'investigating' && !evidenceCollected.includes('network_trace'),
    },
    {
      id: 'monitor_wall',
      col: 4, row: 17,
      label: '[E] View Monitoring Dashboard',
      icon: '📊',
      action: 'check_dashboard',
      available: () => incidentState === 'investigating',
    },
    {
      id: 'atm',
      col: 12, row: 13,
      label: '[E] Test ATM Service',
      icon: '🏧',
      action: 'test_atm',
      available: () => incidentState === 'validating',
    },
    {
      id: 'npc_sre',
      col: 21, row: 5,
      label: '[E] Talk to SRE',
      icon: '👤',
      action: 'talk_sre',
      available: () => true,
    },
  ];

  // Diagnosis options (shown when evidence is complete)
  const DIAGNOSES = [
    { id: 'db_lock',   label: 'Database connection pool exhausted',      correct: true  },
    { id: 'net_fault', label: 'Network switch misconfiguration',          correct: false },
    { id: 'deploy',    label: 'Bad deployment from last release',         correct: false },
  ];

  // Remediation options
  const REMEDIATIONS = [
    { id: 'restart_pool', label: 'Restart connection pool service',  correct: true  },
    { id: 'rollback',     label: 'Roll back last deployment',         correct: false },
    { id: 'reboot_switch','label': 'Reboot network switch',           correct: false },
  ];

  // ─── Dialog sequences ────────────────────────────────────────────────────────
  const DIALOGS = {
    inspect_alert: [
      { who: 'ALERT BEACON — SEV-1', text: 'INCIDENT-0042 | BRANCH SERVICES | CRITICAL\nCustomer logins failing. ATM transactions timing out. Service health: 23%.\nFirst reported: 09:04 UTC.' },
      { who: 'ALERT BEACON', text: 'Begin investigation. Collect evidence from terminals and monitoring systems before diagnosing.', action: () => { incidentState = 'investigating'; addScore(100, 'Incident detected'); showEvidence(true); } },
    ],
    check_terminal: [
      { who: 'TERMINAL LOG — BRANCH-AUTH-01', text: 'ERROR 09:04:12  Connection pool timeout after 30000ms\nERROR 09:04:13  DB_POOL: max connections (50/50) reached\nWARN  09:04:14  Queue length: 847 pending requests\nERROR 09:04:15  auth-service: upstream unavailable' },
      { who: 'TERMINAL LOG', text: 'Evidence collected: DB connection pool saturation. Add this to your investigation.', action: () => { collectEvidence('terminal_logs', 'Terminal: DB connection pool saturated (50/50)'); } },
    ],
    check_network: [
      { who: 'NETWORK TRACE — SW-BRANCH-01', text: 'Uplink: OK  |  LAN segments: OK  |  Packet loss: 0.0%\nAll VLANs nominal. No hardware faults detected.\nLast config change: 14 days ago (no recent changes).' },
      { who: 'NETWORK TRACE', text: 'Evidence collected: Network infrastructure is healthy. Not the root cause.', action: () => { collectEvidence('network_trace', 'Network: All switches healthy — ruled out'); } },
    ],
    check_dashboard: [
      { who: 'MONITORING DASHBOARD', text: 'auth-service   ████░░░░  ERROR RATE 78%  ↑ spike at 09:03\ndb-primary     ████████  CPU 94%         ↑ spike at 09:02\ndb-replica     ████████  connections MAX  ↑ since 09:01\nbranch-api     ████░░░░  latency 12400ms  ↑' },
      { who: 'MONITORING DASHBOARD', text: 'Evidence collected: DB CPU and connections spiking. auth-service cascading. Looks like a DB-layer issue.', action: () => { collectEvidence('dashboard', 'Dashboard: DB saturated, auth-service cascade'); checkDiagnosisReady(); } },
    ],
    talk_sre: [
      { who: 'ALEX — SITE RELIABILITY ENGINEER', text: '"Hey — we\'ve had this before. When the daily batch report job kicks in at 09:00 it can starve the connection pool if the pool size isn\'t tuned right. Worth checking the DB logs."' },
      { who: 'ALEX', text: '"Gather your evidence and then make your diagnosis at the monitoring console. You need at least two pieces of evidence before you can diagnose."' },
    ],
    test_atm: [
      { who: 'ATM — VALIDATION', text: 'Running ATM transaction test...\n✓ Connection established\n✓ Auth response: 200ms\n✓ Transaction processed: OK\n✓ Receipt printed: OK', action: () => { addScore(200, 'Validation complete'); finalise(); } },
    ],
  };

  function checkDiagnosisReady() {
    if (evidenceCollected.length >= 2 && incidentState === 'investigating') {
      showToast('+250 — Root cause evidence sufficient! Visit the monitoring console to diagnose.', '#ECB22E');
      // Add a diagnosis interactable at monitor
      INTERACTABLES.push({
        id: 'diagnose',
        col: 14, row: 17,
        label: '[E] Diagnose — Select Root Cause',
        icon: '🔍',
        action: 'diagnose',
        available: () => incidentState === 'investigating',
      });
    }
  }

  const DIALOGS_DIAGNOSE = {
    diagnose: null, // handled specially
  };

  // ─── UI helpers ─────────────────────────────────────────────────────────────
  const $timer   = document.getElementById('timer-val');
  const $score   = document.getElementById('score-val');
  const $fill    = document.getElementById('health-fill');
  const $hpct    = document.getElementById('health-pct');
  const $incText = document.getElementById('incident-text');
  const $hint    = document.getElementById('hint-btn');
  const $dialog  = document.getElementById('dialog');
  const $dlgWho  = document.getElementById('dialog-who');
  const $dlgTxt  = document.getElementById('dialog-text');
  const $evPanel = document.getElementById('evidence-panel');
  const $evList  = document.getElementById('evidence-list');
  const $toast   = document.getElementById('toast');
  const $prompt  = document.getElementById('interact-prompt');

  function fmtTime(s) {
    const m = Math.floor(s / 60);
    const ss = String(Math.floor(s % 60)).padStart(2, '0');
    return `${m}:${ss}`;
  }

  function updateHUD() {
    $timer.textContent = fmtTime(timeLeft);
    $timer.style.color = timeLeft < 60 ? PAL.red : PAL.amber;
    $score.textContent = score.toLocaleString();

    const hPct = Math.max(0, health);
    $fill.style.width = hPct + '%';
    $fill.style.background = hPct > 60 ? PAL.green : hPct > 30 ? PAL.amber : PAL.red;
    $hpct.textContent = hPct + '%';
    $hpct.style.color = $fill.style.background;

    const stateLabels = {
      detected:     'DETECTED — Inspect the alert beacon',
      investigating:'INVESTIGATING — Gather evidence',
      diagnosed:    'DIAGNOSED — Apply remediation',
      remediating:  'REMEDIATING — Fix in progress',
      validating:   'VALIDATING — Test the service',
      resolved:     'RESOLVED — Mission complete!',
    };
    $incText.textContent = stateLabels[incidentState] || incidentState;
  }

  let toastTimer = null;
  function showToast(msg, bg = PAL.green) {
    $toast.textContent = msg;
    $toast.style.background = bg;
    $toast.style.color = bg === PAL.amber ? '#090817' : '#fff';
    $toast.style.display = 'block';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $toast.style.display = 'none'; }, 3000);
  }

  function showEvidence(show) {
    $evPanel.style.display = show ? 'block' : 'none';
  }

  function collectEvidence(id, label) {
    if (evidenceCollected.includes(id)) return;
    evidenceCollected.push(id);
    const div = document.createElement('div');
    div.className = 'ev-item';
    div.textContent = '✓ ' + label;
    $evList.appendChild(div);
    addScore(50, 'Evidence collected');
    showToast('+50 — Evidence: ' + label.split(':')[0], PAL.amber);
  }

  function addScore(pts, reason) {
    score += pts;
    if (pts > 0) showToast(`+${pts} — ${reason}`, pts >= 500 ? PAL.green : PAL.blue);
  }

  // ─── Dialog system ──────────────────────────────────────────────────────────
  let currentDialogIdx = 0;
  let currentDialogSeq = null;

  function openDialog(seq) {
    currentDialogSeq = seq;
    currentDialogIdx = 0;
    advanceDialog();
    state = 'dialog';
  }

  function advanceDialog() {
    if (!currentDialogSeq || currentDialogIdx >= currentDialogSeq.length) {
      $dialog.style.display = 'none';
      state = 'playing';
      currentDialogSeq = null;
      return;
    }
    const d = currentDialogSeq[currentDialogIdx];
    $dlgWho.textContent = d.who;
    $dlgTxt.textContent = d.text;
    $dialog.style.display = 'block';
    if (d.action) d.action();
    currentDialogIdx++;
  }

  // ─── Interaction ─────────────────────────────────────────────────────────────
  function doInteract() {
    if (state === 'dialog') { advanceDialog(); return; }
    if (state !== 'playing') return;

    if (interactTarget) {
      const obj = interactTarget;

      if (obj.action === 'diagnose') {
        openDiagnoseMenu();
        return;
      }

      const seq = DIALOGS[obj.action];
      if (seq) openDialog(seq);
    }
  }

  function openDiagnoseMenu() {
    // Simple overlay-style prompt using confirm dialogs for prototype simplicity
    // Build choice text
    const opts = DIAGNOSES.map((d, i) => `${i + 1}. ${d.label}`).join('\n');
    const choice = prompt(`DIAGNOSE — Select root cause:\n${opts}\n\nEnter 1, 2 or 3:`);
    const idx = parseInt(choice, 10) - 1;
    if (idx < 0 || idx >= DIAGNOSES.length) return;

    const selected = DIAGNOSES[idx];
    if (selected.correct) {
      incidentState = 'diagnosed';
      addScore(250, 'Correct root cause diagnosis!');
      showToast('+250 — Correct! DB connection pool exhausted.', PAL.green);
      openRemediationMenu();
    } else {
      health = Math.max(0, health - 15);
      score = Math.max(0, score - 100);
      showToast('-100 — Wrong diagnosis. Re-examine the evidence.', PAL.red);
    }
    updateHUD();
  }

  function openRemediationMenu() {
    setTimeout(() => {
      const opts = REMEDIATIONS.map((r, i) => `${i + 1}. ${r.label}`).join('\n');
      const choice = prompt(`REMEDIATE — Select fix:\n${opts}\n\nEnter 1, 2 or 3:`);
      const idx = parseInt(choice, 10) - 1;
      if (idx < 0 || idx >= REMEDIATIONS.length) return;

      const selected = REMEDIATIONS[idx];
      if (selected.correct) {
        incidentState = 'remediating';
        addScore(500, 'Correct remediation applied!');
        showToast('+500 — Fix applied! Validating recovery...', PAL.green);
        setTimeout(() => {
          incidentState = 'validating';
          health = Math.min(100, health + 30);
          showToast('Connection pool restarted. Test the ATM to validate.', PAL.blue);
          updateHUD();
        }, 2000);
      } else {
        health = Math.max(0, health - 20);
        score = Math.max(0, score - 100);
        incidentState = 'investigating';
        showToast('-100 — Wrong fix. Service still down. Reconsider.', PAL.red);
      }
      updateHUD();
    }, 100);
  }

  function finalise() {
    incidentState = 'resolved';
    timerRunning = false;
    health = Math.min(100, health + 20);

    // Time bonus
    if (timeLeft > 180) addScore(100, 'Fast resolution bonus');

    // Publish summary points
    addScore(150, 'Incident summary published');

    setTimeout(() => {
      state = 'end';
      showEndScreen();
    }, 1500);
  }

  function showEndScreen() {
    const overlay = document.getElementById('end-overlay');
    const grade   = document.getElementById('end-grade');
    const title   = document.getElementById('end-title');
    const summary = document.getElementById('end-summary');
    const scoreEl = document.getElementById('end-score');

    let g, t, s;
    if (score >= 1500 && timeLeft > 120) {
      g = 'S'; t = 'SEV-1 CHAMPION'; s = 'Fast, accurate, minimal impact. The bank thanks you.';
    } else if (score >= 1000) {
      g = 'A'; t = 'INCIDENT HERO'; s = 'Strong diagnosis and recovery. Well handled.';
    } else if (score >= 600) {
      g = 'B'; t = 'RELIABLE RESPONDER'; s = 'Service restored with some wasted time. Good effort.';
    } else {
      g = 'C'; t = 'RECOVERY REQUIRED'; s = 'Service restored, but key steps were missed.';
    }

    grade.textContent = g;
    title.textContent = t;
    summary.textContent = s;
    scoreEl.textContent = `Final score: ${score.toLocaleString()}`;
    grade.style.color = g === 'S' ? PAL.amber : g === 'A' ? PAL.green : g === 'B' ? PAL.blue : PAL.grey;
    overlay.style.display = 'flex';
  }

  // ─── Hint system ─────────────────────────────────────────────────────────────
  const HINTS = {
    detected:     'Find the red alert beacon near the ATMs and press E to inspect it.',
    investigating:'You need 2+ pieces of evidence. Check terminals and the monitoring dashboard.',
    diagnosed:    'Use the monitoring console to diagnose and select a remediation.',
    remediating:  'Fix is being applied. Wait for validation prompt.',
    validating:   'Test the ATM to confirm the service is recovering.',
    resolved:     'Mission complete! Well done.',
  };

  function showHint() {
    if (hintCooldown > 0) {
      showToast('Hint on cooldown. Wait ' + Math.ceil(hintCooldown) + 's.', PAL.amber);
      return;
    }
    const hint = HINTS[incidentState] || 'Explore the branch and look for interactable objects.';
    openDialog([{ who: 'AI ASSISTANT', text: hint }]);
    hintCooldown = 20;
  }

  // ─── Collision ───────────────────────────────────────────────────────────────
  function rectOverlapsTile(px, py, pw, ph) {
    const x0 = Math.floor(px / TILE);
    const y0 = Math.floor(py / TILE);
    const x1 = Math.floor((px + pw - 1) / TILE);
    const y1 = Math.floor((py + ph - 1) / TILE);
    for (let row = y0; row <= y1; row++) {
      for (let col = x0; col <= x1; col++) {
        if (isSolid(col, row)) return true;
      }
    }
    return false;
  }

  // ─── Rendering ───────────────────────────────────────────────────────────────
  // Tile draw lookup
  function drawTile(col, row, t, x, y) {
    switch (t) {
      case T.FLOOR:
        ctx.fillStyle = (col + row) % 2 === 0 ? PAL.floor : PAL.floor2;
        ctx.fillRect(x, y, TILE, TILE);
        break;
      case T.CARPET:
        ctx.fillStyle = PAL.carpet;
        ctx.fillRect(x, y, TILE, TILE);
        break;
      case T.WALL:
        ctx.fillStyle = PAL.wall;
        ctx.fillRect(x, y, TILE, TILE);
        // top edge highlight
        ctx.fillStyle = PAL.wallLit;
        ctx.fillRect(x, y, TILE, 3);
        break;
      case T.COUNTER:
        ctx.fillStyle = PAL.counter;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#4a2860';
        ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        break;
      case T.DESK:
        ctx.fillStyle = PAL.desk;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#3a2a0e';
        ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        break;
      case T.TERMINAL: {
        ctx.fillStyle = PAL.floor;
        ctx.fillRect(x, y, TILE, TILE);
        // Monitor body
        ctx.fillStyle = '#223344';
        ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 10);
        ctx.fillStyle = PAL.neonBlue;
        ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 14);
        // screen glow
        ctx.fillStyle = 'rgba(0,229,255,0.15)';
        ctx.fillRect(x, y, TILE, TILE);
        break;
      }
      case T.ATM: {
        ctx.fillStyle = PAL.floor;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#1a3a5a';
        ctx.fillRect(x + 3, y + 2, TILE - 6, TILE - 4);
        ctx.fillStyle = PAL.neonGreen;
        ctx.fillRect(x + 6, y + 5, TILE - 12, 12);
        ctx.fillStyle = '#36C5F0';
        ctx.fillRect(x + 8, y + 20, TILE - 16, 6);
        break;
      }
      case T.PLANT: {
        ctx.fillStyle = PAL.floor;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#0a200a';
        ctx.fillRect(x + 8, y + 18, 16, 12);
        ctx.fillStyle = PAL.plant;
        ctx.beginPath();
        ctx.arc(x + TILE/2, y + 14, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#2a5a2a';
        ctx.beginPath();
        ctx.arc(x + TILE/2 - 5, y + 10, 7, 0, Math.PI*2);
        ctx.fill();
        break;
      }
      case T.MONITOR: {
        ctx.fillStyle = PAL.floor;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#001122';
        ctx.fillRect(x + 2, y + 4, TILE - 4, TILE - 8);
        // Draw tiny chart
        ctx.fillStyle = PAL.neonGreen;
        for (let i = 0; i < 5; i++) {
          const h2 = 3 + Math.sin(i * 1.5 + Date.now() * 0.001) * 3;
          ctx.fillRect(x + 5 + i * 5, y + TILE - 10 - h2, 3, h2);
        }
        break;
      }
      case T.SERVER:
      case T.RACK: {
        ctx.fillStyle = PAL.serverRack;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#002244';
        ctx.fillRect(x + 4, y + 2, TILE - 8, 5);
        ctx.fillRect(x + 4, y + 9, TILE - 8, 5);
        ctx.fillRect(x + 4, y + 16, TILE - 8, 5);
        ctx.fillStyle = PAL.neonGreen;
        ctx.fillRect(x + TILE - 8, y + 3, 3, 3);
        ctx.fillRect(x + TILE - 8, y + 10, 3, 3);
        ctx.fillStyle = PAL.amber;
        ctx.fillRect(x + TILE - 8, y + 17, 3, 3);
        break;
      }
      case T.DOOR: {
        ctx.fillStyle = '#2a1840';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = PAL.blue;
        ctx.fillRect(x + 8, y + 4, TILE - 16, TILE - 8);
        break;
      }
      default:
        ctx.fillStyle = PAL.floor;
        ctx.fillRect(x, y, TILE, TILE);
    }
  }

  // Draw interactive object overlays (glowing icons)
  function drawInteractables() {
    const t = Date.now() * 0.003;
    for (const obj of INTERACTABLES) {
      if (!obj.available()) continue;
      const wx = obj.col * TILE - cam.x;
      const wy = obj.row * TILE - cam.y;

      // Pulsing glow
      const pulse = 0.5 + 0.5 * Math.sin(t + obj.col);
      ctx.save();
      ctx.globalAlpha = 0.2 + 0.2 * pulse;
      ctx.fillStyle = obj.action === 'inspect_alert' ? PAL.red : PAL.blue;
      ctx.fillRect(wx - 4, wy - 4, TILE + 8, TILE + 8);
      ctx.globalAlpha = 1;

      // Icon
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.fillText(obj.icon || '❓', wx + TILE/2, wy + TILE/2 + 6);
      ctx.restore();
    }
  }

  // Draw NPC (simple pixel character)
  function drawNPC(wx, wy, color, label) {
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(wx + 10, wy + 12, 12, 14);
    // Head
    ctx.fillStyle = '#c68642';
    ctx.fillRect(wx + 11, wy + 4, 10, 10);
    // Hair
    ctx.fillStyle = '#3d2314';
    ctx.fillRect(wx + 11, wy + 4, 10, 4);
    // Name
    ctx.fillStyle = PAL.blue;
    ctx.font = '9px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(label, wx + 16, wy + 30);
  }

  // Draw player
  function drawPlayer() {
    const wx = player.x - cam.x;
    const wy = player.y - cam.y;
    const f  = Math.floor(player.animFrame);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(wx + 10, wy + 21, 8, 3, 0, 0, Math.PI*2);
    ctx.fill();

    // Body — aubergine jacket
    ctx.fillStyle = '#5a1a6a';
    ctx.fillRect(wx + 7, wy + 11, 13, 12);

    // Head
    ctx.fillStyle = '#c68642';
    ctx.fillRect(wx + 8, wy + 3, 11, 10);

    // Hair
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(wx + 8, wy + 3, 11, 4);

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(wx + 10, wy + 8, 2, 2);
    ctx.fillRect(wx + 14, wy + 8, 2, 2);

    // Legs (animated)
    const legOffset = player.moving ? Math.sin(Date.now() * 0.01) * 2 : 0;
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(wx + 8,  wy + 21 + legOffset,  5, 8);
    ctx.fillRect(wx + 14, wy + 21 - legOffset, 5, 8);

    // Tablet
    ctx.fillStyle = '#36C5F0';
    ctx.fillRect(wx + 18, wy + 13, 5, 7);
    ctx.fillStyle = '#090817';
    ctx.fillRect(wx + 19, wy + 14, 3, 5);
  }

  // ─── Main render loop ─────────────────────────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state === 'title' || state === 'end') return;

    // Camera: center on player
    cam.x = player.x - canvas.width  / 2 + player.w / 2;
    cam.y = player.y - canvas.height / 2 + player.h / 2;
    // Clamp to map
    cam.x = Math.max(0, Math.min(cam.x, MAP_W * TILE - canvas.width));
    cam.y = Math.max(0, Math.min(cam.y, MAP_H * TILE - canvas.height));

    // Draw tiles
    const startCol = Math.max(0, Math.floor(cam.x / TILE));
    const endCol   = Math.min(MAP_W, Math.ceil((cam.x + canvas.width)  / TILE) + 1);
    const startRow = Math.max(0, Math.floor(cam.y / TILE));
    const endRow   = Math.min(MAP_H, Math.ceil((cam.y + canvas.height) / TILE) + 1);

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const wx = col * TILE - cam.x;
        const wy = row * TILE - cam.y;
        drawTile(col, row, tiles[row][col], wx, wy);
      }
    }

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(63,14,64,0.18)';
    ctx.lineWidth = 0.5;
    for (let col = startCol; col <= endCol; col++) {
      ctx.beginPath();
      ctx.moveTo(col * TILE - cam.x, 0);
      ctx.lineTo(col * TILE - cam.x, canvas.height);
      ctx.stroke();
    }
    for (let row = startRow; row <= endRow; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * TILE - cam.y);
      ctx.lineTo(canvas.width, row * TILE - cam.y);
      ctx.stroke();
    }

    drawInteractables();

    // NPC
    const npcWx = 21 * TILE - cam.x;
    const npcWy = 5  * TILE - cam.y;
    drawNPC(npcWx, npcWy, '#36C5F0', 'ALEX');

    drawPlayer();

    // Room label
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = 'bold 11px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText('LEVEL 1 — BRANCH OPERATIONS', 16, canvas.height - 16);
  }

  // ─── Update loop ─────────────────────────────────────────────────────────────
  function update(dt) {
    if (state !== 'playing') return;

    // Timer
    if (timerRunning) {
      timeLeft = Math.max(0, timeLeft - dt);
      hintCooldown = Math.max(0, hintCooldown - dt);
      if (timeLeft <= 0 && incidentState !== 'resolved') {
        state = 'end';
        showEndScreen();
        return;
      }
      // Health drain during incident
      if (incidentState !== 'resolved') {
        health = Math.max(0, health - dt * 0.5);
      }
    }

    // Player movement
    let dx = 0, dy = 0;
    if (keys['ArrowLeft']  || keys['a'] || keys['A']) { dx = -1; player.dir = 'left'; }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) { dx =  1; player.dir = 'right'; }
    if (keys['ArrowUp']    || keys['w'] || keys['W']) { dy = -1; player.dir = 'up'; }
    if (keys['ArrowDown']  || keys['s'] || keys['S']) { dy =  1; player.dir = 'down'; }

    // Normalise diagonal
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    const spd = player.speed;
    player.moving = (dx !== 0 || dy !== 0);

    // Move X
    const nx = player.x + dx * spd;
    if (!rectOverlapsTile(nx, player.y, player.w, player.h)) player.x = nx;

    // Move Y
    const ny = player.y + dy * spd;
    if (!rectOverlapsTile(player.x, ny, player.w, player.h)) player.y = ny;

    // Clamp to map
    player.x = Math.max(TILE, Math.min(player.x, (MAP_W - 2) * TILE));
    player.y = Math.max(TILE, Math.min(player.y, (MAP_H - 2) * TILE));

    // Find nearest interactable
    let nearest = null;
    let nearDist = Infinity;
    for (const obj of INTERACTABLES) {
      if (!obj.available()) continue;
      const ox = obj.col * TILE + TILE/2;
      const oy = obj.row * TILE + TILE/2;
      const px = player.x + player.w/2;
      const py = player.y + player.h/2;
      const dist = Math.hypot(ox - px, oy - py);
      if (dist < 56 && dist < nearDist) { nearDist = dist; nearest = obj; }
    }
    interactTarget = nearest;
    $prompt.textContent = nearest ? nearest.label : '';
    $prompt.style.display = nearest ? 'block' : 'none';

    updateHUD();
  }

  // ─── Game loop ───────────────────────────────────────────────────────────────
  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  // ─── Start / restart ─────────────────────────────────────────────────────────
  function startGame() {
    // Reset state
    score = 0;
    health = 100;
    timeLeft = 300;
    evidenceCollected = [];
    incidentState = 'detected';
    hintCooldown = 0;
    dialogOpen = false;
    player.x = 5 * TILE;
    player.y = 8 * TILE;
    $evList.innerHTML = '';
    showEvidence(false);
    $dialog.style.display = 'none';
    $toast.style.display = 'none';
    // Remove dynamic diagnosis interactable if added
    const diagIdx = INTERACTABLES.findIndex(o => o.id === 'diagnose');
    if (diagIdx >= 0) INTERACTABLES.splice(diagIdx, 1);

    document.getElementById('title-overlay').style.display = 'none';
    document.getElementById('end-overlay').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';

    timerRunning = true;
    state = 'playing';
    updateHUD();
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused';
      timerRunning = false;
      document.getElementById('pause-overlay').style.display = 'flex';
    } else if (state === 'paused') {
      state = 'playing';
      timerRunning = true;
      document.getElementById('pause-overlay').style.display = 'none';
    }
  }

  // ─── Button wiring ────────────────────────────────────────────────────────────
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('resume-btn').addEventListener('click', togglePause);
  document.getElementById('replay-btn').addEventListener('click', startGame);
  $hint.addEventListener('click', showHint);

  // ─── Boot ─────────────────────────────────────────────────────────────────────
  requestAnimationFrame(t => { lastTime = t; loop(t); });

})();
