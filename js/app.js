/* Bottom Truth: Florida spearfishing closures map, statewide
   Data: FWC artificial reefs, Palm Beach County ERM reef sites, FWC boat ramp inventory,
   NOAA ENC wrecks, obstructions, rocks, fish havens, bottom samples and depth contours, FDEP state
   park waters, FWRI hardbottom, statewide legal zones, curated dive spots, NOAA ENC coastline.
   Not legal advice. See README.

   Loading model
   -------------
   sites, ramps, zones-palmbeach, regs, closures and law load before the map draws. Every other
   data file is a "source" (SRC below). A source loads the first time a legend row that needs it is
   switched on; rows that are on by default load at boot. What's here and search load the sources
   they need on demand. In the standalone build a source is read from window.__DATA; a source left
   out of that build shows "not included in this offline build" in its legend row.

   coverage.js, layers.js, search.js and species.js load after this file and reach CATS, layers,
   shown, map, ensure, buildLegend, applyVisibility, render and the data arrays by bare name:
   classic scripts share one global lexical scope. Keep these as top-level bindings. */

const R_NM = 3440.065;
const d2r = x => x * Math.PI / 180;

function geo(a, b) {
  const la1 = d2r(a[0]), lo1 = d2r(a[1]), la2 = d2r(b[0]), lo2 = d2r(b[1]), dlo = lo2 - lo1;
  const d = 2 * R_NM * Math.asin(Math.sqrt(
    Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dlo / 2) ** 2));
  const y = Math.sin(dlo) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dlo);
  return [d, (Math.atan2(y, x) * 180 / Math.PI + 360) % 360];
}
const esc = t => String(t == null ? '' : t).replace(/[<>&"]/g,
  c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const brgS = b => String(Math.round(b)).padStart(3, '0');
const M_FT = 3.28084;
const M_NM = 1852;

const COL = {
  natural: '#30a46c', hirelief: '#22b8cf', artificial: '#f5a524',
  wreck: '#c084fc', obstruction: '#8b5cf6', ramp: '#ffffff',
  refuge: '#e5484d', closure: '#ff4d4f', buffer: '#e5484d',
  park: '#fb7185', hardbottom: '#2dd4bf', contour: '#7dd3fc', boundary: '#f5a524',
  pier: '#f472b6', jetty: '#ff5fa2', jettyExempt: '#f5a524', fknms: '#ff7a45', beach: '#fb7185',
  bridgeConfirmed: '#f472b6', bridgePresumed: '#facc15', bridgeExcluded: '#64748b',
  spot: '#f0abfc', fishhaven: '#fb923c', rock: '#d6d3d1', encarea: '#fdba74',
  buoy: '#60a5fa', station: '#34d399', seabed: '#e7cf8f', hbsw: '#5eead4',
  encr: '#a78bfa', mpa: '#94a3b8', fedfish: '#fb7185', mil: '#fbbf24', manatee: '#38bdf8',
  stateareas: '#fda4af', nwr: '#a3e635'
};
const ZC = {
  refuge:  { c: COL.refuge, o: .16, w: 2,   d: null },
  refnear: { c: COL.refuge, o: .04, w: 1,   d: '4,5' },
  hard:    { c: COL.buffer, o: .30, w: 1.5, d: null },
  county:  { c: '#8b5cf6',  o: .22, w: 1.5, d: null },
  flag:    { c: '#3b82f6',  o: .07, w: 1.5, d: '6,5' },
  speed:   { c: '#06b6d4',  o: .08, w: 1.5, d: '6,5' },
  line:    { c: COL.boundary, o: 0, w: 2,   d: '8,6' }
};
/* zone kind colours, shared by zones-local and zones-statewide. Zone rows in the legend show both
   colours because a row holds closed (red) and restricted (amber) zones. */
const ZKC = { closed: '#ff4d4f', warn: '#facc15', open: '#8fe3b4', line: '#ff7a45' };
const KIND_SW = 'linear-gradient(135deg,#ff4d4f 0 50%,#facc15 50% 100%)';

let SITES = [], RAMPS = [], ZONES = [], REGS = {}, CLOSURES = [], ENC = null, HB = null, PARKS = null, CONT = null;
let PIERS = null, BRIDGES = null, FKNMS = null, JURIS = null, LOCALZ = [], CWA = [];
let STATEZ = [], ENCA = null, SEABED = null, HBSW = null, BUOYS = null, STATIONS = null;
let ENCR = null, MPA = null, SPOTS = null, JETTIES = null, BEACHES = null;
let LAWVER = '';
let mode = 'scuba', origin = null, map, sideEl;
const marks = {}, rmarks = {}, zl = {};
const spotMarks = {};
const SEARCH_ITEMS = [];           // registered by the build functions, read by search.js
const layers = {};                 // category id -> L.LayerGroup (coastal + tidal)
const ilayers = {};                // category id -> L.LayerGroup (inland / fresh water)
const shown = {};                  // category id -> bool
let showInland = false;            // inland waters hidden by default
const isInland = f => f && f.iw === 'inland';
const lay = (cat, f) => (isInland(f) ? ilayers : layers)[cat];

const key = s => s.n + '|' + s.lat + '|' + s.lon;
const blocked = s => (mode === 'scuba' && !!s.ref) || !!s.closed;
const edging = s => mode === 'scuba' && s.edge && !s.ref && !s.closed;
const cat = s => s.t === 'n' ? 'natural' : (s.rel >= 10 ? 'hirelief' : 'artificial');
const col = s => blocked(s) ? COL.closure : (edging(s) ? '#f5a524' : COL[cat(s)]);
const depS = s => s.d == null ? '' : (typeof s.d === 'string' ? s.d : s.d + ' ft');

/* ---------- legal citations ---------- */
const C = (...ids) => (window.FLLaw ? window.FLLaw.cite(ids) : '');
const Cc = ids => (window.FLLaw && ids && ids.length ? window.FLLaw.cite(ids, false) : '');
const COUNTY_LAW = {
  'Monroe':     ['fs-379-2425', 'monroe-26-5', 'monroe-26-art4', 'cfr-922-164-d', 'cfr-922-164-b1'],
  'Collier':    ['fac-68b-20-003-1', 'fs-379-2425', 'collier-210-67', 'naples-90-469', 'naples-42-3'],
  'Volusia':    ['fac-68b-3-008', 'volusia-20-121'],
  'Palm Beach': ['pbc-13-32', 'pbc-13-55', 'pbc-18-1', 'pbtown-74-162', 'fac-68b-3-038'],
  'Pinellas':   ['spb-54-4', 'spb-94-1', 'ti-58-34', 'clearwater-21-06', 'pinellas-14-97', 'pinellas-90-7', 'stpete-21-44'],
  'Sarasota':   ['sarasota-130-33'],
  'Broward':    ['hollywood-99-03', 'broward-13-5'],
  'Lee':        ['capecoral-78-483', 'sanibel-85-440'],
  'Brevard':    ['brevard-122-3', 'satellitebeach-66-1'],
  'Bay':        ['mexicobeach-95-03'],
  'Citrus':     ['fws-crystal-river', 'cfr-50-17-108-c14'],
  'Manatee':    ['bradentonbeach-46-46'],
  'Dixie':      ['fs-379-101-17', 'fac-68a-23-002-7'],
  'Taylor':     ['fs-379-101-17', 'fac-68a-23-002-7']
};
const countyCite = c => (COUNTY_LAW[c] ? C.apply(null, COUNTY_LAW[c]) : '');

/* ---------- categories that the legend filters ----------
   src: the data sources a row needs (none = loaded at boot). z: stacking order on the canvas,
   low to high, so small legal polygons and point features stay clickable above large polygons. */
const CATS = [
  { id: 'spots',       grp: 'sites',  label: 'Dive spots (curated)',    col: COL.spot,     on: true,  src: ['spots'] },
  { id: 'natural',     grp: 'sites',  label: 'Natural reef & ledge',   col: COL.natural,  on: true,  z: 6 },
  { id: 'hirelief',    grp: 'sites',  label: 'Artificial, high relief', col: COL.hirelief, on: true, z: 6 },
  { id: 'artificial',  grp: 'sites',  label: 'Artificial, low relief',  col: COL.artificial, on: true, z: 6 },
  { id: 'wreck',       grp: 'sites',  label: 'Charted wrecks',          col: COL.wreck,    on: true,  src: ['enc'], z: 5 },
  { id: 'obstruction', grp: 'sites',  label: 'Obstructions',            col: COL.obstruction, on: false, src: ['enc'], z: 5 },
  { id: 'fishhaven',   grp: 'sites',  label: 'Fish havens (charted points)', col: COL.fishhaven, on: false, src: ['enc'], z: 5 },
  { id: 'encarea',     grp: 'sites',  label: 'Fish haven & wreck areas (charted)', col: COL.encarea, on: false, src: ['enc-areas'], z: 1 },
  { id: 'rock',        grp: 'sites',  label: 'Charted rocks',           col: COL.rock,     on: false, src: ['enc'], z: 5 },
  { id: 'ramp',        grp: 'sites',  label: 'Boat ramps',              col: COL.ramp,     on: true,  z: 6 },
  { id: 'buoy',        grp: 'sites',  label: 'Keys sanctuary buoys (FKNMS)', col: COL.buoy, on: false, src: ['buoys'], z: 5 },
  { id: 'station',     grp: 'sites',  label: 'Tide, current & NDBC stations', col: COL.station, on: false, src: ['stations'], z: 5 },
  { id: 'closure',     grp: 'legal',  label: 'Statutory closed areas',  col: COL.closure,  on: true,  z: 4 },
  { id: 'pier',        grp: 'legal',  label: 'Fishing piers (FWC list), drawn at 125 yd', col: COL.pier, on: true, src: ['piers'], z: 4 },
  { id: 'jetty',       grp: 'legal',  label: 'Jetties, traced: 100 ft drawn at 150 ft', col: COL.jetty, on: true, src: ['jetties'], z: 4 },
  { id: 'beach',       grp: 'legal',  label: 'Sandy beaches: 100 yd drawn at 150 yd', col: COL.beach, on: true, src: ['beaches'], z: 4 },
  { id: 'refuge',      grp: 'legal',  label: 'Palm Beach refuge areas', col: COL.refuge,   on: true,  z: 4 },
  { id: 'buffer',      grp: 'legal',  label: 'Beach / pier / jetty buffers', col: COL.buffer, on: true, z: 4 },
  { id: 'park',        grp: 'legal',  label: 'State park waters',       col: COL.park,     on: true,  src: ['parkwaters'], z: 4 },
  { id: 'local',       grp: 'legal',  label: 'Local ordinances',        col: KIND_SW, on: true, src: ['zones-local', 'zones-statewide'], z: 3 },
  { id: 'stateareas',  grp: 'legal',  label: 'State rule areas',        col: KIND_SW, on: true, src: ['zones-statewide'], z: 3 },
  { id: 'manatee',     grp: 'legal',  label: 'Manatee No Entry zones',  col: KIND_SW,  on: true,  src: ['zones-statewide'], z: 3 },
  { id: 'cwa',         grp: 'legal',  label: 'Critical Wildlife Areas', col: '#e5484d', on: false, src: ['cwa'], z: 3 },
  { id: 'flags',       grp: 'legal',  label: '⚠ Open questions',   col: '#facc15', on: true, src: ['zones-local', 'zones-statewide'] },
  { id: 'boundary',    grp: 'legal',  label: 'Boundary lines',          col: COL.boundary, on: true,  src: ['jurisdiction'], z: 2 },
  { id: 'fknms',       grp: 'fedlegal', label: 'Keys sanctuary no-fishing zones', col: COL.fknms, on: true, src: ['fknms'], z: 4 },
  { id: 'fed',         grp: 'fedlegal', label: 'Federal parks & zones',   col: KIND_SW, on: true, src: ['zones-local', 'zones-statewide'], z: 3 },
  { id: 'fedfish',     grp: 'fedlegal', label: 'Federal fishery closures & SMZs', col: KIND_SW, on: true, src: ['zones-statewide'], z: 3 },
  { id: 'mil',         grp: 'fedlegal', label: 'Coast Guard & military zones', col: KIND_SW, on: true, src: ['zones-statewide'], z: 3 },
  { id: 'nwr',         grp: 'fedlegal', label: 'Wildlife refuges',        col: KIND_SW, on: true, src: ['zones-statewide'], z: 3 },
  { id: 'bridgeConf',  grp: 'bridge', label: 'Confirmed fishing bridge, buffered', col: COL.bridgeConfirmed, on: true, src: ['bridges'], z: 4 },
  { id: 'bridgePres',  grp: 'bridge', label: 'Unposted bridge, presume buffered', col: COL.bridgePresumed, on: true, src: ['bridges'], z: 4 },
  { id: 'bridgeExcl',  grp: 'bridge', label: 'Limited access, bridge buffer not drawn', col: COL.bridgeExcluded, on: false, src: ['bridges'], z: 4 },
  { id: 'hardbottom',  grp: 'habitat',label: 'Natural hardbottom',      col: COL.hardbottom, on: false, src: ['hardbottom'], z: 1 },
  { id: 'hbsw',        grp: 'habitat',label: 'Hardbottom, Gulf & north Atlantic (FWC)', col: COL.hbsw, on: false, src: ['hardbottom-sw'], z: 1 },
  { id: 'seabed',      grp: 'habitat',label: 'Charted bottom type (samples)', col: COL.seabed, on: false, src: ['seabed'], z: 5 },
  { id: 'contour',     grp: 'habitat',label: 'Depth contours, 12 to 120 ft', col: COL.contour, on: false, src: ['contours'], z: 2 },
  { id: 'encr',        grp: 'ref',    label: 'Charted restricted areas (ENC)', col: COL.encr, on: false, src: ['enc-restricted'], z: 1 },
  { id: 'mpa',         grp: 'ref',    label: 'Marine protected areas (NOAA inventory)', col: COL.mpa, on: false, src: ['mpa'], z: 1 }
];
const GRPLABEL = { sites: 'Structure & access', legal: 'Legal: state & local',
  fedlegal: 'Legal: federal, military & wildlife',
  bridge: 'Bridges: r. 68B-20.003(2)(c)', habitat: 'Habitat, depth & bottom',
  ref: 'Reference, not the law' };
const GROUPS_ORDER = ['sites', 'legal', 'fedlegal', 'bridge', 'habitat', 'ref'];

/* ---------- data sources ---------- */
function loadJSON(name) {
  if (window.__DATA) {
    if (window.__DATA[name] !== undefined && window.__DATA[name] !== null) return Promise.resolve(window.__DATA[name]);
    const e = new Error(name + ' is not included in this offline build');
    e.missing = true;
    return Promise.reject(e);
  }
  return fetch('data/' + name + '.json').then(r => {
    if (!r.ok) throw new Error('data/' + name + '.json: ' + r.status);
    return r.json();
  });
}
/* mapReady: the Leaflet map and the layer groups exist (layers.js and coverage.js wait on it).
   coreReady: law.json is loaded and sites, ramps, closures and Palm Beach zones are drawn. Sources
   build after coreReady because several popups are built as strings that carry citation chips. */
let _mapReadyRes, _coreReadyRes;
const mapReady = new Promise(r => { _mapReadyRes = r; });
const coreReady = new Promise(r => { _coreReadyRes = r; });
const SRC = {};
function source(name, build) { SRC[name] = { st: 'idle', p: null, build: build }; }
/* ensure(name): load a source once, build its layers, resolve with the data (null on failure). */
function ensure(name) {
  const s = SRC[name];
  if (!s) return Promise.resolve(null);
  if (s.p) return s.p;
  s.st = 'loading'; legendSoon();
  s.p = coreReady.then(() => loadJSON(name)).then(d => {
    try { s.build(d); s.st = 'ok'; }
    catch (e) { s.st = 'error'; s.err = e; console.error('[map] could not build ' + name, e); }
    afterData();
    return s.st === 'ok' ? d : null;
  }, e => {
    s.st = e && e.missing ? 'missing' : 'error'; s.err = e;
    if (s.st === 'error') console.warn('[map] ' + name + ': ' + (e && e.message));
    legendSoon();
    return null;
  });
  return s.p;
}
const ensureAll = names => Promise.all(names.map(ensure));
const srcOk = n => SRC[n] && SRC[n].st === 'ok';

source('enc',             d => { ENC = d; buildEnc(); });
source('enc-areas',       d => { ENCA = d; buildEncAreas(); });
source('parkwaters',      d => { PARKS = d; buildParks(); });
source('contours',        d => { CONT = d; buildContours(); });
source('fknms',           d => { FKNMS = d; buildFknms(); });
source('jurisdiction',    d => { JURIS = d; buildJuris(); });
source('piers',           d => { PIERS = d; buildPiers(); });
source('zones-local',     d => { LOCALZ = d.zones || d; buildLocalZones(); });
source('zones-statewide', d => { STATEZ = d.zones || d; buildStatewideZones(); });
source('cwa',             d => { CWA = d; buildCwa(); });
source('bridges',         d => { BRIDGES = d; buildBridges(); });
source('jetties',         d => { JETTIES = d.zones || d; buildJetties(); });
source('beaches',         d => { BEACHES = d.zones || d; buildBeaches(); });
source('hardbottom',      d => { HB = d; buildHb(); });
source('hardbottom-sw',   d => { HBSW = d; buildHbSw(); });
source('seabed',          d => { SEABED = d; buildSeabed(); });
source('buoys',           d => { BUOYS = d; buildBuoys(); });
source('stations',        d => { STATIONS = d; buildStations(); });
source('enc-restricted',  d => { ENCR = d; buildEncR(); });
source('mpa',             d => { MPA = d; buildMpa(); });
source('spots',           d => { SPOTS = d.spots || d; buildSpots(); });

let _lgT = null, _rsT = null;
function legendSoon() { clearTimeout(_lgT); _lgT = setTimeout(() => { if (map) buildLegend(); }, 40); }
function afterData() { if (!map) return; applyVisibility(); restackSoon(); legendSoon(); }

/* ---------- boot ---------- */
async function boot() {
  /* wait for the whole document, so every later script (coverage, layers, search, species) has
     registered its rows and listeners, also when the standalone build inlines the data */
  if (document.readyState === 'loading') {
    await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
  }
  initNotice();
  /* The map and the layer groups exist before the data loads: base tiles start at once, and
     coverage.js (which polls for map and layers for about ten seconds) finds them in time. */
  initMap();
  CATS.forEach(c => { layers[c.id] = L.layerGroup(); ilayers[c.id] = L.layerGroup(); shown[c.id] = c.on; });
  _mapReadyRes();
  document.dispatchEvent(new CustomEvent('flmap:ready'));
  try {
    [SITES, RAMPS, ZONES, REGS, CLOSURES] = await Promise.all(
      ['sites', 'ramps', 'zones-palmbeach', 'regs', 'closures'].map(loadJSON));
  } catch (e) {
    document.getElementById('load').textContent = 'Could not load map data: ' + e.message;
    return;
  }
  if (window.FLLaw) {
    window.FLLaw.mount();
    try { const lw = await loadJSON('law'); window.FLLaw.load(lw.entries || lw); LAWVER = lw.version || ''; } catch (e) {}
  }
  setNoticeDate();
  buildRampSelect();
  drawZones(); drawClosures(); drawSites(); drawRamps();
  _coreReadyRes();
  const P = applyParams();
  buildLegend();
  applyVisibility();
  setOrigin(P.ramp || RAMPS.find(r => /Phil Foster/i.test(r.n)) || RAMPS[0]);
  if (!isNaN(P.lat) && !isNaN(P.lon)) map.setView([P.lat, P.lon], isNaN(P.zoom) ? 13 : P.zoom);
  else if (!isNaN(P.zoom)) map.setZoom(P.zoom);
  const lb = document.getElementById('lawbtn');
  if (lb) lb.onclick = () => window.FLLaw && window.FLLaw.open();
  const wb = document.getElementById('whbtn');
  if (wb) wb.onclick = () => (whArmed ? disarmWh() : armWh());
  const l = document.getElementById('load'); if (l) l.remove();

  /* bridges and piers feed the inland note in the legend; jurisdiction feeds What's here */
  const want = new Set(['jurisdiction', 'piers', 'bridges']);
  CATS.forEach(c => { if (shown[c.id]) (c.src || []).forEach(n => want.add(n)); });
  want.forEach(n => ensure(n));
  if (P.spot) openSpot(P.spot);
  else if (P.zone) openZone(P.zone);
  if (P.law && window.FLLaw) window.FLLaw.open(P.law);
}

/* ---------- persistent notice (cannot be dismissed; collapses to one line) ---------- */
function initNotice() {
  const n = document.getElementById('notice'), t = document.getElementById('nt-tog');
  if (!n || !t) return;
  let col = null;
  try { col = localStorage.getItem('fl-notice'); } catch (e) {}
  /* collapsed by default where the notice sits at the bottom of the map (see app.css, 1100 px) */
  const collapsed = col === null ? window.innerWidth <= 1100 : col === 'c';
  const set = c => {
    n.classList.toggle('collapsed', c);
    t.setAttribute('aria-expanded', String(!c));
    t.textContent = c ? 'Details' : 'Less';
  };
  set(collapsed);
  t.onclick = () => {
    const c = !n.classList.contains('collapsed');
    set(c);
    try { localStorage.setItem('fl-notice', c ? 'c' : 'o'); } catch (e) {}
  };
}
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '');
  return m ? (+m[3]) + ' ' + MON[+m[2] - 1] + ' ' + m[1] : String(v || '');
}
function setNoticeDate() {
  const txt = LAWVER ? 'Rules current as of ' + fmtDate(LAWVER) : 'Rules current as of: date not available';
  document.querySelectorAll('.nt-date').forEach(el => { el.textContent = txt; });
}

function initMap() {
  map = L.map('map', { preferCanvas: true }).setView([27.2, -81.5], 7);
  /* base layers and raster overlays are owned by js/layers.js */
  sideEl = document.getElementById('side');
  /* clicks and wheel turns on the panels that float over the map stay out of the map */
  ['legend', 'notice'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { L.DomEvent.disableClickPropagation(el); L.DomEvent.disableScrollPropagation(el); }
  });
  document.getElementById('modes').onclick = e => {
    const m = e.target.dataset.mode; if (!m) return;
    mode = m;
    [...e.currentTarget.children].forEach(x => x.classList.toggle('on', x.dataset.mode === m));
    SITES.forEach(s => { const c = col(s); const mk = marks[key(s)]; if (mk) mk.setStyle({ color: c, fillColor: c }); });
    render();
  };
  const icb = document.getElementById('inland-cb'), itg = document.getElementById('inland-tog');
  if (icb) icb.onchange = () => {
    showInland = icb.checked;
    itg.classList.toggle('on', showInland);
    applyVisibility(); buildLegend(); render();
  };
  document.getElementById('gpx').onclick = downloadGpx;
  document.getElementById('csv').onclick = downloadCsv;
  /* What's here: armed click and right-click / long-press. Listened for in the capture phase on
     the map container, because the canvas renderer stops a click that lands on a drawn feature
     before the map sees it. Controls inside #map (legend, layers panel) and open popups are left alone. */
  const mc = map.getContainer();
  const inMapPane = t => t === mc || !!(t && t.closest && t.closest('.leaflet-map-pane') && !t.closest('.leaflet-popup'));
  let down = null;
  mc.addEventListener('pointerdown', ev => { down = [ev.clientX, ev.clientY]; }, true);
  mc.addEventListener('click', ev => {
    if (!whArmed || !inMapPane(ev.target)) return;
    if (down && Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 6) return;
    ev.stopPropagation(); ev.preventDefault();
    const ll = map.mouseEventToLatLng(ev);
    disarmWh();
    whatsHere(ll.lat, ll.lng);
  }, true);
  mc.addEventListener('contextmenu', ev => {
    if (!inMapPane(ev.target)) return;
    ev.stopPropagation(); ev.preventDefault();
    if (lp) { clearTimeout(lp.t); if (lp.fired) return; lp.fired = true; }
    const ll = map.mouseEventToLatLng(ev);
    disarmWh();
    whatsHere(ll.lat, ll.lng);
  }, true);
  /* Long-press: Android fires contextmenu (handled above, which cancels this timer); iOS Safari
     does not, so a 650 ms hold without movement runs the query here. */
  let lp = null, lpUntil = 0;
  mc.addEventListener('touchstart', ev => {
    if (lp) clearTimeout(lp.t);
    lp = null;
    if (ev.touches.length !== 1 || !inMapPane(ev.target)) return;
    const t = ev.touches[0];
    const cur = { x: t.clientX, y: t.clientY, fired: false };
    cur.t = setTimeout(() => {
      if (cur.fired) return;
      cur.fired = true; lpUntil = Date.now() + 900;
      const ll = map.mouseEventToLatLng({ clientX: cur.x, clientY: cur.y });
      disarmWh();
      whatsHere(ll.lat, ll.lng);
    }, 650);
    lp = cur;
  }, { passive: true, capture: true });
  mc.addEventListener('touchmove', ev => {
    if (!lp || lp.fired) return;
    const t = ev.touches[0];
    if (!t || Math.hypot(t.clientX - lp.x, t.clientY - lp.y) > 10) { clearTimeout(lp.t); lp = null; }
  }, { passive: true, capture: true });
  ['touchend', 'touchcancel'].forEach(n => mc.addEventListener(n, () => {
    if (lp && !lp.fired) { clearTimeout(lp.t); lp = null; }
  }, { passive: true, capture: true }));
  /* swallow the click a browser may send when a long-press is released */
  mc.addEventListener('click', ev => {
    if (Date.now() < lpUntil) { ev.stopPropagation(); ev.preventDefault(); lpUntil = 0; }
  }, true);
  map.on('popupopen', onPopupOpen);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && whArmed) disarmWh(); });
  document.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('[data-spot]');
    if (a) { ev.preventDefault(); openSpot(a.dataset.spot); }
  });
}

function buildRampSelect() {
  const sel = document.getElementById('ramp');
  const byC = {};
  RAMPS.forEach((r, i) => { (byC[r.c] = byC[r.c] || []).push([i, r]); });
  sel.innerHTML = Object.keys(byC).sort().map(c =>
    '<optgroup label="' + esc(c) + '">' + byC[c].map(([i, r]) =>
      '<option value="' + i + '">' + esc(r.n) + (/Temporar|Closed/i.test(r.st) ? ' (closed)' : '') +
      '</option>').join('') + '</optgroup>').join('');
  sel.onchange = () => setOrigin(RAMPS[+sel.value]);
}

function setOrigin(r) {
  if (!r) return;
  origin = r;
  const sel = document.getElementById('ramp');
  const i = RAMPS.indexOf(r); if (i >= 0) sel.value = i;
  SITES.forEach(s => { const [d, b] = geo([r.lat, r.lon], [s.lat, s.lon]); s.nm = d; s.brg = b; });
  render();
  const near = SITES.filter(s => s.nm < 8).map(s => marks[key(s)]).filter(Boolean);
  near.push(rmarks[r.n + r.lat]);
  map.fitBounds(L.featureGroup(near.filter(Boolean)).getBounds(), { padding: [50, 50], maxZoom: 13 });
}

/* ---------- geometry helpers ---------- */
function ringsBox(rings) {
  let s = 90, w = 180, n = -90, e = -180;
  rings.forEach(r => r.forEach(p => {
    if (p[0] < s) s = p[0]; if (p[0] > n) n = p[0];
    if (p[1] < w) w = p[1]; if (p[1] > e) e = p[1];
  }));
  return [s, w, n, e];
}
const boxKm2 = b => Math.max(0, (b[2] - b[0]) * 111.1 * (b[3] - b[1]) * 111.3 * Math.cos(d2r((b[0] + b[2]) / 2)));
const boxLL = b => [[b[0], b[1]], [b[2], b[3]]];
function centroid(pts) {
  let la = 0, lo = 0;
  pts.forEach(p => { la += p[0]; lo += p[1]; });
  return [la / pts.length, lo / pts.length];
}
function pip(lat, lon, ring) {
  let ins = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i][0], xi = ring[i][1], yj = ring[j][0], xj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
function distM(a0, a1, b0, b1) {
  const la1 = d2r(a0), la2 = d2r(b0), dla = la2 - la1, dlo = d2r(b1 - a1);
  return 2 * 6371008.8 * Math.asin(Math.sqrt(Math.sin(dla / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dlo / 2) ** 2));
}
/* distance in metres from (lat, lon) to a polyline, local equirectangular projection */
function lineDistM(lat, lon, path) {
  const kx = 111320 * Math.cos(d2r(lat)), ky = 110574;
  let best = Infinity;
  for (let i = 0; i < path.length; i++) {
    const ax = (path[i][1] - lon) * kx, ay = (path[i][0] - lat) * ky;
    if (i === 0 || path.length === 1) { best = Math.min(best, Math.hypot(ax, ay)); if (path.length === 1) break; continue; }
    const bx = (path[i - 1][1] - lon) * kx, by = (path[i - 1][0] - lat) * ky;
    const dx = ax - bx, dy = ay - by, L2 = dx * dx + dy * dy;
    let t = L2 ? -(bx * dx + by * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    best = Math.min(best, Math.hypot(bx + t * dx, by + t * dy));
  }
  return best;
}
const inBox = (lat, lon, b, pad) => lat >= b[0] - pad && lat <= b[2] + pad && lon >= b[1] - pad && lon <= b[3] + pad;
function fmtDM(lat, lon) {
  const f = (v, p, n) => {
    const a = Math.abs(v), d = Math.floor(a), m = (a - d) * 60;
    return d + '° ' + m.toFixed(3).padStart(6, '0') + '′ ' + (v < 0 ? n : p);
  };
  return f(lat, 'N', 'S') + ', ' + f(lon, 'E', 'W');
}
const fmtDist = m => m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / M_NM).toFixed(m < 18520 ? 1 : 0) + ' nm';

/* one line of plain text from a popup HTML string (the text is trusted project data) */
const ABBR = /(?:^|[\s(])(?:r|rr|fla|stat|stats|admin|ann|no|nos|u\.s|c\.f\.r|pt|pts|st|ft|mt|rd|approx|ch|chs|art|sec|e\.g|i\.e|vs|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec|al|inc|co|dept|gov|mr|dr|sr|jr)$/i;
function oneLine(html, max) {
  max = max || 220;
  const t = String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  /* a sentence ends at . ! or ? followed by a capital letter (or the end), not after an abbreviation */
  const re = /[.!?](?=\s+[A-Z\u201c"(]|$)/g;
  let m;
  while ((m = re.exec(t))) {
    if (m.index < 30) continue;
    if (m.index > max) break;
    if (ABBR.test(t.slice(0, m.index))) continue;
    return t.slice(0, m.index + 1);
  }
  if (t.length <= max) return t;
  const cut = t.lastIndexOf(' ', max);
  return t.slice(0, cut > 60 ? cut : max) + '…';
}

/* ---------- point-query index (What's here) ----------
   Filled while drawing. Each entry: b = [s, w, n, e], rings or c = [lat, lon, radius m],
   m = { k (dedupe key), n (name), cls: closed | refuge | restrict | other, line, law, src }.
   Point features with no drawn boundary go into QNOGEOM and are reported when nearby. */
const QIDX = [], QNOGEOM = [];
function qPoly(rings, m) {
  if (!rings || !rings.length) return;
  QIDX.push({ b: ringsBox(rings), rings: rings, m: m });
}
function qCircle(lat, lon, r, m) {
  const dLat = r / 110574, dLon = r / (111320 * Math.cos(d2r(lat)));
  QIDX.push({ b: [lat - dLat, lon - dLon, lat + dLat, lon + dLon], c: [lat, lon, r], m: m });
}
function qNoGeom(paths, m) {
  paths = paths.filter(p => p && p.length);
  if (!paths.length) return;
  QNOGEOM.push({ b: ringsBox(paths), paths: paths, m: m });
}

/* ---------- search registry ---------- */
/* g: search group, n: name, a: extra searchable text, sub: second line, cat: legend row to switch
   on, layer: the Leaflet layer whose popup opens, ll: where to go, b: bounds to fit */
function regSearch(it) { SEARCH_ITEMS.push(it); }

/* ---------- canvas stacking: large polygons at the bottom, points on top ---------- */
function restackSoon() { clearTimeout(_rsT); _rsT = setTimeout(restack, 60); }
/* The canvas renderer hit-tests in draw order, last drawn wins, so a large polygon switched on late
   would swallow clicks on everything under it. Order: higher z in front; polygons flagged _big go
   behind everything else, largest last; the coverage wash (coverage.js) goes to the very back. */
function restack() {
  if (!map) return;
  const groups = [];
  CATS.forEach(c => {
    if (c.z == null || !shown[c.id]) return;
    [layers[c.id], ilayers[c.id]].forEach(g => { if (g && map.hasLayer(g)) groups.push([c.z, g]); });
  });
  groups.sort((a, b) => b[0] - a[0]);
  const big = [];
  /* Point groups (z 5 and up) never move: everything else is pushed behind them. bringToBack puts
     each layer behind the previous one, so walk each group backwards to keep its own order
     (a bridge dot stays above its buffer circle). */
  groups.filter(([z]) => z < 5).forEach(([, g]) => {
    const ls = g.getLayers();
    for (let i = ls.length - 1; i >= 0; i--) {
      const l = ls[i];
      if (!l._map || !l.bringToBack || l instanceof L.Marker) continue;
      if (l._big) big.push(l); else l.bringToBack();
    }
  });
  big.sort((a, b) => a._big - b._big).forEach(l => l.bringToBack());
  ['covFull', 'covPart', 'covNone'].forEach(id => {
    const g = layers[id];
    if (g && map.hasLayer(g)) g.eachLayer(l => { if (l._map && l.bringToBack) l.bringToBack(); });
  });
}
function addPoly(ring, style, pop, grp, big) {
  const p = L.polygon(ring, style);
  if (pop) p.bindPopup(pop, { maxWidth: 320 });
  if (big) p._big = big;
  return p.addTo(grp);
}

/* ---------- layers ---------- */
const ZONE_LAW = {
  refuge:   ['pbc-13-55', 'fac-68b-3-038', 'fs-379-2412'],
  buffer:   ['fac-68b-20-003-2'],
  boundary: ['fac-68b-20-003-1', 'fs-379-2425']
};
function catForZone(z) {
  if (z.cls === 'refuge' || z.cls === 'refnear') return 'refuge';
  if (z.cls === 'line') return 'boundary';
  if (z.cls === 'county' || z.cls === 'flag' || z.cls === 'speed') return 'boundary';
  return 'buffer';
}
function drawZones() {
  ZONES.forEach(z => {
    const s = ZC[z.cls];
    const o = { color: s.c, weight: s.w, opacity: .9, dashArray: s.d,
                fillColor: s.o ? s.c : undefined, fillOpacity: s.o };
    const l = z.kind === 'line' ? L.polyline(z.geom, o) : L.polygon(z.geom, o);
    /* the Lake Worth Inlet polygons are the county inlet ban (§ 13-33), not a boundary rule */
    const zlaw = z.cls === 'county' ? ['pbc-13-32'] : (ZONE_LAW[catForZone(z)] || []);
    l.bindPopup('<h3>' + esc(z.name) + '</h3>' + z.rule + C.apply(null, zlaw));
    zl[z.id] = l;
    if (z.id !== 'flag200' && z.id !== 'idle') {
      layers[catForZone(z)].addLayer(l);
      if (z.kind !== 'line') {
        qPoly([z.geom], { k: 'pb:' + z.id, n: z.name, src: 'Palm Beach zones',
          cls: z.cls === 'refuge' ? 'refuge' : (z.cls === 'refnear' ? 'other' : 'closed'),
          line: oneLine(z.rule), law: zlaw });
      }
      const b = ringsBox([z.geom]);
      regSearch({ g: 'zone', zid: z.id, n: z.name, sub: 'Palm Beach County zone', cat: catForZone(z), layer: l,
        ll: centroid(z.geom), b: boxLL(b) });
    }
  });
}
function drawClosures() {
  CLOSURES.forEach(c => {
    let first = null;
    c.rings.forEach(r => {
      const p = L.polygon(r, { color: COL.closure, weight: 2.5, opacity: .95, fillColor: COL.closure, fillOpacity: .22 })
        .bindPopup('<h3>' + esc(c.name) + '</h3>' + c.rule +
          C('fs-379-2425', 'fac-68b-20-003-1', 'monroe-26-5'))
        .addTo(layers.closure);
      first = first || p;
    });
    qPoly(c.rings, { k: 'cl:' + c.id, n: c.name, cls: 'closed', src: 'statutory closures',
      line: 'Spearfishing prohibited by Fla. Stat. § 379.2425(2)(a), freediving included.', law: ['fs-379-2425'] });
    const b = ringsBox(c.rings);
    regSearch({ g: 'zone', n: c.name, sub: 'Statutory closed area', cat: 'closure', layer: first, ll: centroid(c.rings[0]), b: boxLL(b) });
  });
}
function drawSites() {
  SITES.forEach(s => {
    const m = L.circleMarker([s.lat, s.lon], { radius: s.t === 'n' ? 6 : 4.5, weight: 2,
      color: col(s), fillColor: col(s), fillOpacity: .8 });
    marks[key(s)] = m;
    m.bindPopup(() => sitePopup(s));
    lay(cat(s), s).addLayer(m);
    regSearch({ g: 'site', n: s.n, a: s.nt, sub: (s.t === 'n' ? 'Natural reef' : 'Artificial reef') +
      (s.c ? ' · ' + s.c : '') + (depS(s) ? ' · ' + depS(s) : ''), cat: cat(s), layer: m,
      ll: [s.lat, s.lon], z: 15, inland: isInland(s) });
  });
}
function sitePopup(s) {
  let h = '<h3>' + esc(s.n) + '</h3>' + esc(s.nt);
  if (s.rel) h += '<br><b>Relief ' + s.rel + ' ft</b> off the sand.';
  if (s.closed === 'keys') h += '<div style="margin-top:7px;color:#ff9ea3"><b>Spearfishing PROHIBITED.</b> ' +
    'Upper Keys closure, Fla. Stat. § 379.2425(2)(a). Applies to freediving too.</div>';
  if (s.closed === 'penn') h += '<div style="margin-top:7px;color:#ff9ea3"><b>Spearfishing PROHIBITED.</b> ' +
    'John Pennekamp Coral Reef State Park, § 379.2425(2)(a).</div>';
  if (s.closed === 'fknms') h += '<div style="margin-top:7px;color:#ff9ea3"><b>Fishing PROHIBITED.</b> ' +
    esc(s.czone) + ' (' + esc(s.ctype) + '), Florida Keys National Marine Sanctuary.</div>';
  if (s.ref) h += '<div style="margin-top:7px;color:#ff9ea3"><b>Refuge Area No. ' + s.ref +
    '.</b> No spearfishing on underwater breathing apparatus, PBC Code §§ 13-55, 13-56. This ordinance does not restrict freediving.</div>';
  if (edging(s)) h += '<div style="margin-top:7px;color:#ffcf8a"><b>On a refuge line</b>, inside GPS error. ' +
    'Treat as closed on scuba.</div>';
  h += '<span class="m">' + (s.nm != null ? s.nm.toFixed(2) + ' nm @ ' + brgS(s.brg) + '&deg;T' : '') +
       (depS(s) ? ' &middot; ' + depS(s) : '') + '<br>' + s.lat.toFixed(5) + ', ' + s.lon.toFixed(5) +
       '<br>' + esc(s.c) + ' &middot; ' + esc(s.src) + '</span>';
  const base = ['fac-68b-20-003-1', 'fac-68b-20-005', 'fac-68b-14-009', 'fs-379-354'];
  if (s.closed === 'keys' || s.closed === 'penn') base.unshift('fs-379-2425');
  if (s.closed === 'fknms') base.unshift('cfr-922-164-d');
  if (s.ref) base.unshift('pbc-13-55');
  h += C.apply(null, base.concat(COUNTY_LAW[s.c] || []));
  return h;
}
function drawRamps() {
  RAMPS.forEach(r => {
    const closed = /Temporar|Closed/i.test(r.st);
    const m = L.circleMarker([r.lat, r.lon], { radius: 5, weight: 2,
      color: closed ? '#e5484d' : '#fff', fillColor: closed ? '#e5484d' : '#fff', fillOpacity: .9 });
    m.bindPopup('<h3>' + esc(r.n) + '</h3>' +
      (closed ? '<b style="color:#ff9ea3">' + esc(r.st) + '</b><br>' : '') +
      r.ln + ' lanes &middot; ' + r.tr + ' trailer spaces<br>' + esc(r.h) +
      '<br>Fee required: ' + esc(r.fee) + (r.rate ? ' (' + esc(r.rate) + ')' : '') +
      '<br>' + esc(r.c) + ' &middot; ' + esc(r.ad) + (r.ph ? '<br>' + esc(r.ph) : '') +
      '<br><button class="hbtn" style="margin-top:8px" data-ramp="' + RAMPS.indexOf(r) + '">Measure from here</button>');
    rmarks[r.n + r.lat] = m;
    lay('ramp', r).addLayer(m);
    regSearch({ g: 'ramp', n: r.n, sub: 'Boat ramp · ' + (r.c || ''), cat: 'ramp', layer: m,
      ll: [r.lat, r.lon], z: 15, inland: isInland(r) });
  });
  map.on('popupopen', e => {
    const b = e.popup.getElement() && e.popup.getElement().querySelector('[data-ramp]');
    if (b) b.onclick = () => { setOrigin(RAMPS[+b.dataset.ramp]); map.closePopup(); };
  });
}

/* ENC S-57 WATLEV codes */
const WATLEV = { 1: 'Partly submerged at high water', 2: 'Always dry', 3: 'Always under water',
  4: 'Covers and uncovers', 5: 'Awash', 6: 'Subject to inundation or flooding', 7: 'Floating' };
const ENC_STYLE = {
  wreck:       { c: COL.wreck,       r: 4,   fo: .85, n: 'Unnamed wreck' },
  obstruction: { c: COL.obstruction, r: 3.5, fo: .5,  n: 'Obstruction' },
  fishhaven:   { c: COL.fishhaven,   r: 4,   fo: .75, n: 'Fish haven' },
  rock:        { c: COL.rock,        r: 3,   fo: .6,  n: 'Rock' }
};
function buildEnc() {
  ENC.forEach(p => {
    const st = ENC_STYLE[p.k] || ENC_STYLE.obstruction, grp = layers[p.k] || layers.obstruction;
    const wl = typeof p.wl === 'number' ? WATLEV[p.wl] : p.wl;
    const m = L.circleMarker([p.lat, p.lon], { radius: st.r, weight: 1.5,
      color: st.c, fillColor: st.c, fillOpacity: st.fo })
      .bindPopup('<h3>' + esc(p.n || st.n) + '</h3>' +
        (p.cat ? esc(p.cat) + '<br>' : '') +
        (p.d != null ? 'Charted depth ' + (p.d * M_FT).toFixed(0) + ' ft<br>' : '') +
        (wl ? esc(wl) + '<br>' : '') +
        (p.inf ? '<i>' + esc(p.inf) + '</i><br>' : '') +
        '<span class="m">NOAA ENC &middot; ' + p.lat.toFixed(5) + ', ' + p.lon.toFixed(5) +
        '<br>Charted feature, not a dive site. Not for navigation.</span>')
      .addTo(grp);
    if (p.n) regSearch({ g: 'enc', n: p.n, sub: 'Charted ' + (p.k === 'fishhaven' ? 'fish haven' : p.k) +
      (p.cat ? ' · ' + p.cat : ''), cat: p.k in ENC_STYLE ? p.k : 'obstruction', layer: m, ll: [p.lat, p.lon], z: 15 });
  });
}
function buildEncAreas() {
  ENCA.forEach(a => {
    const fh = a.k === 'fishhaven';
    const c = fh ? COL.encarea : COL.wreck;
    const pop = '<h3>' + esc(a.n || (fh ? 'Fish haven area' : 'Wreck area')) + '</h3>' +
      (fh ? 'Charted fish haven area' : 'Charted wreck area' + (a.cat ? ' (' + esc(a.cat) + ')' : '')) +
      (a.d != null ? '. Least charted depth about ' + (a.d * M_FT).toFixed(0) + ' ft.' : '.') +
      (a.inf ? '<br><i>' + esc(a.inf) + '</i>' : '') +
      '<span class="m">NOAA ENC. A charted area, not a legal boundary and not a dive site. Not for navigation.</span>';
    let first = null;
    const b = ringsBox(a.r), big = boxKm2(b);
    a.r.forEach(r => {
      const p = addPoly(r, { color: c, weight: 1.2, opacity: .85, dashArray: '4,3', fillColor: c, fillOpacity: .12 },
        pop, layers.encarea, big > 20 ? big : 0);
      first = first || p;
    });
    if (a.n) regSearch({ g: 'enc', n: a.n, sub: fh ? 'Charted fish haven area' : 'Charted wreck area',
      cat: 'encarea', layer: first, ll: centroid(a.r[0]), b: boxLL(b) });
  });
}
function buildParks() {
  PARKS.forEach((p, i) => {
    let first = null;
    p.r.forEach(r => {
      const l = L.polygon(r, { color: COL.park, weight: 1.2, opacity: .8, fillColor: COL.park, fillOpacity: .14 })
        .bindPopup('<h3>' + esc(p.n) + '</h3>' +
          'State park waters. <b>R. 68B-20.003(2)(e)</b> prohibits spearing in any water under the DEP ' +
          'Division of Recreation and Parks, and prohibits carrying spear gear there unless it is ' +
          '<b>not loaded and properly stored</b> aboard a vessel passing nonstop.' +
          C('fac-62d-2-014', 'fac-68b-20-003-2') +
          '<span class="m">' + esc(p.c) + ' &middot; FDEP park boundary</span>')
        .addTo(layers.park);
      first = first || l;
    });
    qPoly(p.r, { k: 'park:' + i, n: p.n, cls: 'closed', src: 'state park waters',
      line: 'State park waters: spearing prohibited, r. 68B-20.003(2)(e).', law: ['fac-62d-2-014', 'fac-68b-20-003-2'] });
    const b = ringsBox(p.r);
    regSearch({ g: 'zone', n: p.n, sub: 'State park waters · ' + (p.c || ''), cat: 'park', layer: first,
      ll: centroid(p.r[0]), b: boxLL(b) });
  });
}
function buildFknms() {
  FKNMS.forEach((z, i) => {
    const no = z.fish !== 'Yes';
    if (!no) return;                                  // only the closures are worth drawing
    const pop = '<h3>' + esc(z.n) + '</h3>' +
          '<b>' + esc(z.t) + '</b><br>' + esc(z.reg) +
          '<div style="margin-top:7px;color:#ff9ea3"><b>Fishing prohibited, spearfishing and ' +
          'freediving included.</b></div>' +
          '<span class="m">' + (z.sw === 'Yes'
            ? 'IN FLORIDA STATE WATERS. The 2025 Restoration Blueprint took effect in FEDERAL waters '
              + 'only on 5 Mar 2025; the Governor certified it unacceptable under NMSA § 304(b), so '
              + 'the 1997 zoning still controls here. eCFR still renders the pre-2025 text.'
            : 'FEDERAL waters. The 2025 Restoration Blueprint zoning is in force here, and the '
              + 'catch-and-release trolling exception at Conch, Alligator, Sombrero and Sand Key is gone.') +
          '<br>' + z.ac.toLocaleString() + ' acres &middot; NOAA FKNMS zone boundaries</span>' +
          C('cfr-922-164-d', 'cfr-922-163', 'cfr-922-164-b1', 'fs-379-2425');
    let first = null;
    z.r.forEach(r => {
      const l = L.polygon(r, { color: COL.fknms, weight: 2, opacity: .95,
                     fillColor: COL.fknms, fillOpacity: .22 })
        .bindPopup(pop)
        .addTo(layers.fknms);
      first = first || l;
    });
    qPoly(z.r, { k: 'fk:' + i, n: z.n, cls: 'closed', src: 'Keys sanctuary zones',
      line: esc(z.t) + ': fishing prohibited, spearfishing and freediving included (' +
        (z.sw === 'Yes' ? 'state waters, 1997 zoning' : 'federal waters, 2025 Blueprint zoning') + ').',
      law: ['cfr-922-164-d', 'cfr-922-163'] });
    const b = ringsBox(z.r);
    regSearch({ g: 'zone', n: z.n, sub: 'Keys sanctuary · ' + z.t, cat: 'fknms', layer: first,
      ll: centroid(z.r[0]), b: boxLL(b) });
  });
}
function buildJuris() {
  /* jurisdiction.json repeats every Atlantic path inside the Gulf array. Drawn as is, the Gulf copy
     sits on top and an Atlantic segment opens the Gulf (9 nm) popup. Drop the repeats. */
  const atlKeys = new Set((JURIS.atl || []).map(p => JSON.stringify(p)));
  JURIS.gom = (JURIS.gom || []).filter(p => !atlKeys.has(JSON.stringify(p)));
  const draw = (paths, label, note) => paths.forEach(p =>
    L.polyline(p, { color: COL.boundary, weight: 1.6, opacity: .85, dashArray: '9,6' })
      .bindPopup('<h3>' + label + '</h3>' + note).addTo(layers.boundary));
  draw(JURIS.atl, 'State waters boundary, Atlantic',
    'Submerged Lands Act boundary, <b>3 nautical miles</b> on the Atlantic. Inside is Florida state ' +
    'jurisdiction; outside is federal, and South Atlantic Council snapper-grouper rules apply. ' +
    '<span class="m">BOEM official SLA boundary.</span>');
  draw(JURIS.gom, 'State waters boundary, Gulf',
    'Submerged Lands Act boundary, <b>9 nautical miles</b> on the Gulf coast, three times the Atlantic ' +
    'limit. Inside is Florida state jurisdiction; outside is federal, and Gulf Council rules apply. ' +
    '<span class="m">BOEM official SLA boundary.</span>');
}
const YD_M = 0.9144;
const BUF_M = 125 * YD_M;          // 100 yd rule, drawn at 125 yd
function buildPiers() {
  PIERS.forEach((p, i) => {
    const pop = '<h3>' + esc(p.n) + '</h3>' +
        '<b>' + esc(p.t || 'Fishing structure') + '</b>' + (p.w ? ' &middot; ' + esc(p.w) : '') +
        '<div style="margin-top:7px">R. 68B-20.003(2)(b) and (2)(c): <b>100 yd</b> from commercial or ' +
        'public fishing piers, and from the portion of any bridge where public fishing is legally ' +
        'permitted. Drawn at 125 yd.</div>' +
        '<span class="m">' + esc(p.c) + ' &middot; ' + esc(p.e || '') +
        '<br>FWC Fishing Piers, Jetties and Bridges inventory</span>' + waterNote(p) +
        C('fac-68b-20-003-2');
    const m = L.circle([p.lat, p.lon], { radius: BUF_M, color: COL.pier, weight: 1.2, opacity: .8,
                               fillColor: COL.pier, fillOpacity: .16 })
      .bindPopup(pop)
      .addTo(lay('pier', p));
    const t = String(p.t || 'fishing structure').toLowerCase();
    const rule = /jetty/.test(t) ? 'the jetty rule is 100 ft, r. 68B-20.003(2)(d), and the circle is drawn wider'
      : /bridge/.test(t) ? 'the rule is 100 yd, r. 68B-20.003(2)(c)' : 'the rule is 100 yd, r. 68B-20.003(2)(b)';
    qCircle(p.lat, p.lon, BUF_M, { k: 'pier:' + i, n: p.n, cls: 'closed', src: 'fishing piers',
      line: 'Inside the 125 yd circle drawn around a ' + esc(t) + '; ' + rule + '.' +
        (isInland(p) ? ' Inland (fresh) water.' : ''),
      law: ['fac-68b-20-003-2'] });
    regSearch({ g: 'pier', n: p.n, sub: (p.t || 'Fishing structure') + ' · ' + (p.c || ''), cat: 'pier',
      layer: m, ll: [p.lat, p.lon], z: 16, inland: isInland(p) });
  });
}
function buildBridges() {
  const MAP = { confirmed: 'bridgeConf', presumed: 'bridgePres', excluded: 'bridgeExcl' };
  const style = { confirmed: COL.bridgeConfirmed, presumed: COL.bridgePresumed, excluded: COL.bridgeExcluded };
  const text = {
    confirmed: '<div class="pv pv-no"><b>Buffer applies: 100 yd.</b> This bridge is in FWC\'s fishing ' +
      'structure inventory, so public fishing is provided for and R. 68B-20.003(2)(c) attaches. ' +
      'Do not spearfish within 100 yd of it.</div>',
    presumed: '<div class="pv pv-warn"><b>Presume the buffer applies; posting unverified.</b><br><br>' +
      'Fla. Stat. § 316.1305 makes fishing from a bridge lawful <i>unless</i> FDOT investigates, finds it ' +
      'dangerous, and <b>posts signs</b>. All three steps are required. Unposted therefore means fishing ' +
      '<i>is</i> legally permitted, which means the 100 yd spearfishing buffer attaches.<br><br>' +
      '<b>There is no statewide register of posted bridges.</b> FDOT publishes none and no dataset carries ' +
      'it. The only way to know is to look at the bridge.</div>',
    excluded: '<div class="pv pv-warn"><b>Bridge buffer not drawn.</b><br><br>This is a limited-access facility. ' +
      'Fla. Stat. § 316.130(18) bars pedestrians from limited-access roads and bridges, so public fishing ' +
      'is <i>not</i> legally permitted, so R. 68B-20.003(2)(c) does not attach.<br><br>' +
      '<b>This is not a statement that the water is open.</b> Every other rule on this map applies independently, and a nearby ' +
      'causeway or frontage span may be a different structure with its own buffer. Check the posted signs on site.</div>'
  };
  const DS = { chart: 'the bridge as charted by NOAA (ENC)', roads: 'the Census TIGER road where it crosses mapped water',
    both: 'the NOAA chart (ENC) and the Census TIGER road where it crosses mapped water',
    wide: 'the NOAA chart (ENC), taking the charted bridge nearest the NBI point within 250 m, which may be a neighbouring structure' };
  const RV = {
    span: b => 'Deck drawn from ' + DS[b.ds] + ': the buffer runs the length of the bridge, not only around the NBI point.',
    short: b => 'Deck found (' + DS[b.ds] + '): it stays within the circle drawn at the NBI point.',
    none: () => 'No deck was found for this record in the NOAA chart or in the Census roads over mapped water, so ' +
      'only the circle at the NBI point is drawn. If the bridge runs well past the circle, treat its whole length ' +
      'as buffered.',
    ferry: () => 'The record is a ferry crossing, not a bridge deck. Only the circle at the NBI point is drawn.'
  };
  BRIDGES.forEach((b, i) => {
    const c = style[b.st], grp = lay(MAP[b.st], b);
    const name = b.n + (b.o ? ' (over ' + b.o + ')' : '');
    const rv = b.rv && RV[b.rv] ? '<div style="margin-top:6px">' + RV[b.rv](b) + '</div>' : '';
    const pop = '<h3>' + esc(b.n) + '</h3>over ' + esc(b.o) + text[b.st] + rv +
      (b.cf ? '<div style="margin-top:6px">Matches FWC record: <b>' + esc(b.cf) + '</b></div>' : '') +
      '<span class="m">NBI functional class ' + esc(b.fc) + ' &middot; ' +
      b.lat.toFixed(5) + ', ' + b.lon.toFixed(5) +
      (b.dk ? '<br>Deck geometry: ' + { chart: 'NOAA ENC', roads: 'US Census TIGER/Line roads over TIGERweb and USGS NHD water areas',
        both: 'NOAA ENC; US Census TIGER/Line roads over TIGERweb and USGS NHD water areas',
        wide: 'NOAA ENC, nearest charted bridge within 250 m' }[b.ds] + ', 8 Oct 2026' : '') +
      '</span>' + waterNote(b) + C('fac-68b-20-003-2', 'fs-316-1305', 'neg-bridgeregister');
    if (b.st !== 'excluded') {
      const line = b.st === 'confirmed'
        ? 'Within 100 yd of a bridge where public fishing is provided for (drawn at 125 yd), r. 68B-20.003(2)(c).'
        : 'Unposted bridge: presume the 100 yd buffer applies (drawn at 125 yd); posting unverified.';
      const meta = { k: 'br:' + i, n: name, cls: 'closed', src: 'bridges',
        line: line + (b.sp ? ' Buffer drawn along the traced deck.' : ''), law: ['fac-68b-20-003-2', 'fs-316-1305'] };
      const st = { color: c, weight: 1, opacity: .7, fillColor: c, fillOpacity: b.st === 'confirmed' ? .17 : .10 };
      if (b.sp) {
        const rings = b.sp.map(decI);
        rings.forEach(r => addPoly(r, st, pop, grp));
        (b.dk || []).forEach(d => L.polyline(decI(d), { color: c, weight: 2, opacity: .9, interactive: false }).addTo(grp));
        qPoly(rings, meta);
      } else {
        L.circle([b.lat, b.lon], Object.assign({ radius: BUF_M }, st)).addTo(grp);
        qCircle(b.lat, b.lon, BUF_M, meta);
      }
    }
    L.circleMarker([b.lat, b.lon], { radius: 3.5, weight: 1.5,
      color: c, fillColor: b.st === 'excluded' ? '#0b0e13' : c,
      fillOpacity: b.st === 'excluded' ? .9 : .8 })
      .bindPopup(pop)
      .addTo(grp);
  });
}
/* flat integer list [lat, lon, dlat, dlon, ...] in 1e-5 degree -> [[lat, lon], ...] */
function decI(a) {
  const out = [];
  let la = 0, lo = 0;
  for (let k = 0; k < a.length; k += 2) {
    la = k ? la + a[k] : a[k]; lo = k ? lo + a[k + 1] : a[k + 1];
    out.push([la / 1e5, lo / 1e5]);
  }
  return out;
}
/* r. 68B-20.003(2)(a): 100 yd from any public bathing beach, drawn 150 yd seaward of the charted shore
   along every chain of FDEP range monuments (data/beaches.json, tools/build-beaches.py). kind closed:
   R-series monuments, the sandy-beach baseline. kind warn: V-series (supplementary) monuments. */
function buildBeaches() {
  const grp = layers.beach;
  BEACHES.forEach(z => {
    const warn = z.kind === 'warn';
    const c = warn ? ZKC.warn : COL.beach;
    const head = warn
      ? '<div class="pv pv-warn"><b>Shore that may be a bathing beach: treat as buffered.</b> R. 68B-20.003(2)(a) ' +
        'closes water within <b>100 yards</b> of any public bathing beach. This stretch is marked by the state\'s ' +
        'supplementary (V-series) survey monuments rather than its sandy-beach baseline, so the buffer is drawn as ' +
        'a caution.</div>'
      : '<div class="pv pv-no"><b>Beach buffer: 100 yards.</b> R. 68B-20.003(2)(a) closes water within ' +
        '<b>100 yards</b> of any public bathing beach. Florida beaches are public below the mean high-water line, ' +
        'so every sandy beach on the open coast is treated as a public bathing beach (the reading that closes ' +
        'more water). Drawn at 150 yd seaward of the charted shore.</div>';
    const pop = '<h3>' + esc(z.n) + '</h3>' + head +
      '<div style="margin-top:6px">Shore line: the NOAA chart coastline nearest each FDEP range monument on the ' +
      'open-water side, ' + esc(z.mon[0]) + ' to ' + esc(z.mon[1]) + ' (' + z.mon[2] + ' monuments, about ' +
      Number(Math.round(z.len_m / 100) / 10).toLocaleString() + ' km). Beaches between the monument chains, ' +
      'beaches on bays and lagoons, and short beaches with a single monument are not drawn: assume the ' +
      'buffer applies at any beach.</div>' +
      '<span class="m">' + esc(z.cty) + ' County &middot; FDEP Coastal Range Monuments; NOAA ENC coastline</span>' +
      C.apply(null, z.law || []);
    const rings = (z.ri || []).map(decI);
    let first = null;
    rings.forEach(r => {
      const p = addPoly(r, { color: c, weight: 1, opacity: .8, fillColor: c, fillOpacity: warn ? .08 : .14,
        dashArray: warn ? '5,4' : null }, pop, grp);
      first = first || p;
    });
    if (z.li) L.polyline(decI(z.li), { color: c, weight: 1.5, opacity: .9, interactive: false }).addTo(grp);
    const meta = { k: 'beach:' + z.id, n: z.n, cls: warn ? 'restrict' : 'closed', src: 'beaches',
      line: warn ? 'Within 150 yd of a shore that may be a bathing beach; r. 68B-20.003(2)(a) is 100 yd.'
        : 'Within 150 yd of a sandy beach; r. 68B-20.003(2)(a) closes 100 yd from any public bathing beach.',
      law: z.law || [] };
    if (rings.length) {
      qPoly(rings, meta);
      regSearch({ g: 'pier', n: z.n, sub: 'Beach buffer · ' + z.cty, cat: 'beach', layer: first,
        ll: centroid(rings[0]), b: boxLL(ringsBox(rings)), z: 13 });
    }
  });
}
/* r. 68B-20.003(2)(d): 100 ft from the unsubmerged portion of any jetty, traced structure by
   structure (data/jetties.json, tools/build-jetties.py). kind closed: an inlet or fishing jetty.
   kind warn: a groin, breakwater or revetment that may count as a jetty. exempt: the stretch of a
   jetty longer than 1,500 yd where the rule lifts the buffer (drawn 400 yd of the 500 yd). */
function buildJetties() {
  const grp = layers.jetty;
  JETTIES.forEach(z => {
    const warn = z.kind === 'warn';
    const c = warn ? ZKC.warn : COL.jetty;
    const head = warn
      ? '<div class="pv pv-warn"><b>May count as a jetty: treat as buffered.</b> R. 68B-20.003(2)(d) closes ' +
        'water within <b>100 feet</b> of the unsubmerged portion of any jetty. The rule does not define a ' +
        'jetty, and this structure is not a plain inlet jetty, so the buffer is drawn as a caution.</div>'
      : '<div class="pv pv-no"><b>Jetty buffer: 100 feet.</b> R. 68B-20.003(2)(d) closes water within ' +
        '<b>100 feet</b> of the unsubmerged portion of any jetty. Feet, not yards: the other three ' +
        'buffers in the rule are yards. Drawn at 150 ft around the structure, and 10 m wider where its outline ' +
        'comes from the NOAA nautical chart rather than a trace on the imagery.</div>';
    const ex = z.exempt
      ? '<div style="margin-top:6px"><b>Long jetty.</b> This jetty runs about ' + Number(z.exempt.seaward_yd).toLocaleString() +
        ' yd seaward of the shoreline, more than 1,500 yd, so the rule allows spearfishing along its last ' +
        '500 yd. The amber stretch is the last 400 yd, which keeps 100 yd of margin. Other rules still apply ' +
        'there (federal and state seasons, channel and security zones).</div>'
      : (z.near_long ? '<div style="margin-top:6px">This jetty measures about ' + Number(z.seaward_yd).toLocaleString() +
        ' yd seaward, close to the 1,500 yd threshold for the long-jetty exception. The exception is not drawn ' +
        'because the measurement is within 300 yd of the line.</div>' : '');
    const pop = '<h3>' + esc(z.n) + '</h3>' + head + ex +
      (z.seen ? '<div style="margin-top:6px"><b>On the imagery:</b> ' + esc(z.seen) + '</div>' : '') +
      (z.note ? '<div style="margin-top:6px">' + esc(z.note) + '</div>' : '') +
      (z.fwc ? '<div style="margin-top:6px">FWC fishing structure inventory: <b>' + esc(z.fwc) + '</b>. If the ' +
        'jetty is used as a public fishing pier, the 100 yd pier buffer in (2)(b) may apply as well; the ' +
        'FWC point keeps its 125 yd circle.</div>' : '') +
      '<span class="m">' + esc(z.cty) + ' County &middot; ' + esc(z.src) +
      (z.standin ? '<br>Stand-in circle positions: map data &copy; OpenStreetMap contributors' : '') + '</span>' +
      C.apply(null, z.law || []);
    const rings = z.r || [], lines = z.line || [];
    let first = null;
    rings.forEach(r => {
      const p = addPoly(r, { color: c, weight: 1.4, opacity: .9, fillColor: c, fillOpacity: warn ? .12 : .2,
        dashArray: warn ? '5,4' : null }, pop, grp);
      first = first || p;
    });
    lines.forEach(l => L.polyline(l, { color: c, weight: 2.5, opacity: 1, interactive: false }).addTo(grp));
    if (z.exempt) {
      const ep = '<h3>' + esc(z.n) + ': last 400 yd</h3><div class="pv pv-warn"><b>Jetty buffer lifted ' +
        'here by the long-jetty exception.</b> R. 68B-20.003(2)(d) allows spearfishing along the last 500 yd ' +
        'of a jetty that extends more than 1,500 yd from the shoreline. Drawn 400 yd from the tip.</div>' +
        '<div style="margin-top:6px">This is not a statement that the water is open. Seasons, bag limits, ' +
        'channel rules and security zones still apply, and the shoreline the rule measures from is not ' +
        'defined in the rule.</div>' + C.apply(null, z.law || []);
      z.exempt.r.forEach(r => addPoly(r, { color: COL.jettyExempt, weight: 1.4, opacity: .9,
        fillColor: COL.jettyExempt, fillOpacity: .1, dashArray: '6,4' }, ep, grp));
      L.polyline(z.exempt.line, { color: COL.jettyExempt, weight: 3, opacity: 1, dashArray: '6,4',
        interactive: false }).addTo(grp);
    }
    (z.pts || []).forEach(p => {
      const m = L.circleMarker(p, { radius: 6, weight: 2.5, color: c, fillColor: '#0b0e13', fillOpacity: .95 })
        .bindPopup(pop).addTo(grp);
      first = first || m;
    });
    const meta = { k: 'jetty:' + z.id, n: z.n, cls: warn ? 'restrict' : 'closed', src: 'jetties',
      line: warn ? 'Within 150 ft of a structure that may count as a jetty; r. 68B-20.003(2)(d) is 100 ft.'
        : 'Within 150 ft or more of a jetty as drawn; r. 68B-20.003(2)(d) closes 100 ft from its unsubmerged portion.',
      law: z.law || [] };
    if (rings.length) qPoly(rings, meta);
    else if ((z.pts || []).length) qNoGeom(z.pts.map(p => [p]), meta);
    const all = rings.concat(lines, (z.pts || []).length ? [z.pts] : []);
    if (all.length) regSearch({ g: 'pier', n: z.n, sub: (warn ? 'Possible jetty' : 'Jetty') + ' · ' + z.cty,
      cat: 'jetty', layer: first, ll: centroid(all[0]), b: boxLL(ringsBox(all)), z: 16 });
  });
}
function waterNote(f) {
  if (!f || !f.iw) return '';
  const L = { coastal: ['#8fe3b4', 'Coastal / salt water'],
              tidal:   ['#ffcf8a', 'Tidal transitional'],
              inland:  ['#9dc0ff', 'Inland / fresh water'] }[f.iw];
  return '<span class="m" style="color:' + L[0] + '"><b>' + L[1] + '</b>: ' + esc(f.iwr) +
    (f.iw === 'inland'
      ? '<br>Spearfishing is prohibited in all Florida fresh water, so this structure is irrelevant to ' +
        'a saltwater plan. Florida draws the line by a <i>taste test</i>: salt water is water that has ' +
        'become <i>unpalatable because of the saline content</i>, <b>§ 379.101(33)</b>. There is no ' +
        'salinity threshold in fisheries law, no per-river list, and no official map. This ' +
        'classification is inferred from FWC ramp labels, not authoritative, and has no legal force.'
      : '') + '</span>' + C('fs-379-101-33', 'fac-68b-20-003-7', 'neg-freshsalt');
}
function warnBlock(f) {
  if (!f || !f.flag) return '';
  return '<details class="wb"><summary>&#9888; Open question: read before you rely on this</summary>' +
    '<div>' + esc(f.flag) + '</div></details>';
}
function srcBlock(f) { return f && f.src ? '<span class="m">' + esc(f.src) + '</span>' : ''; }
const wName = f => (f.flag ? '⚠ ' : '') + f.n;
function activeBlock(f) {
  return f && f.active ? '<div class="zact"><b>When it applies:</b> ' + esc(f.active) + '</div>' : '';
}

/* zones-local and zones-statewide share one renderer. File key keeps ids unique across the two. */
const BIG_KM2 = 60;
function drawZone(z, file) {
  const c = ZKC[z.kind] || ZKC.closed;
  const catId = layers[z.cat] ? z.cat : 'local';
  const grp = layers[catId];
  const pop = () => '<h3>' + esc(wName(z)) + '</h3>' + z.s + activeBlock(z) + warnBlock(z) + srcBlock(z) +
    C.apply(null, z.law || []);
  const rings = z.r || [], lines = z.line || [], pts = z.pts || [];
  const box = ringsBox(rings.concat(lines, pts.length ? [pts] : []));
  let first = null;
  rings.forEach(r => {
    const big = boxKm2(ringsBox([r]));
    const p = addPoly(r, { color: c, weight: 1.6, opacity: .9, fillColor: c,
      fillOpacity: z.kind === 'open' ? .05 : .13,
      dashArray: z.flag ? '5,4' : null }, pop, grp, big > BIG_KM2 ? big : 0);
    first = first || p;
  });
  lines.forEach(l => {
    const p = L.polyline(l, { color: c, weight: 2.4, opacity: .9,
      dashArray: z.flag ? '5,4' : null }).bindPopup(pop).addTo(grp);
    first = first || p;
  });
  pts.forEach(p => {
    L.circleMarker(p, { radius: 3.5, weight: 1.5, color: c, fillColor: c, fillOpacity: .9 })
      .bindPopup(pop).addTo(grp);
  });
  const a = rings[0] || lines[0] || (pts.length ? pts : null);
  let anchor = null, ll = null;
  if (a && a.length) {
    ll = centroid(a);
    if (z.flag) {
      L.marker(ll, {
        icon: L.divIcon({ className: 'flagpin', html: '&#9888;', iconSize: [22, 22] })
      }).bindPopup(pop).addTo(layers.flags);
    }
    /* a clickable anchor so a zone with no fill is still findable */
    anchor = L.circleMarker(ll,
      { radius: 6, weight: 2.5, color: c, fillColor: '#0b0e13', fillOpacity: .95 })
      .bindPopup(pop).addTo(grp);
  }
  const cls = z.kind === 'closed' ? 'closed' : (z.kind === 'warn' ? 'restrict' : 'other');
  const meta = { k: file + ':' + z.id, n: wName(z), cls: cls, src: file,
    line: oneLine(z.s) + (z.active && z.active !== 'always' ? ' Applies: ' + esc(z.active) + '.' : ''),
    law: z.law || [] };
  if (rings.length) qPoly(rings, meta);
  else qNoGeom(lines.concat(pts.length ? pts.map(p => [p]) : []), meta);
  if (ll) regSearch({ g: 'zone', zid: z.id, n: wName(z), sub: (GRP_OF[catId] || 'Legal zone') +
    (z.active && z.active !== 'always' ? ' · ' + z.active : ''), cat: catId,
    layer: anchor || first, ll: ll, b: rings.length || lines.length ? boxLL(box) : null, z: 14 });
}
const GRP_OF = { local: 'Local ordinance', fed: 'Federal park or zone', fedfish: 'Federal fishery area',
  mil: 'Coast Guard or military zone', manatee: 'Manatee zone', stateareas: 'State rule area',
  nwr: 'Wildlife refuge' };
function buildLocalZones() { LOCALZ.forEach(z => drawZone(z, 'zones-local')); }
function buildStatewideZones() { STATEZ.forEach(z => drawZone(z, 'zones-statewide')); }

function buildCwa() {
  CWA.forEach((z, i) => {
    const pop = '<h3>' + esc(z.n) + '</h3>' +
      '<div class="pv pv-no"><b>Take of fish is prohibited</b> inside any area posted as a Critical ' +
      'Wildlife Area, r. 68A-19.005(1)(b). Some are additionally posted closed to all public ' +
      'access.</div>' +
      (z.d ? '<div style="margin-top:7px">' + esc(z.d) + '</div>' : '') +
      (z.cd ? '<div style="margin-top:6px"><b>Closed:</b> ' + esc(z.cd) + '</div>' : '') +
      (z.sp ? '<div style="margin-top:6px">Focal species: ' + esc(z.sp) + '</div>' : '') +
      '<span class="m">' + esc(z.c || '') + (z.ac ? ' &middot; ' + Math.round(z.ac) + ' acres' : '') +
      ' &middot; CWA ' + esc(z.no || '') + '<br>FWC Critical Wildlife Areas, polygon layer' +
      '<br><b>The rule binds only where the area is POSTED on site.</b></span>' +
      C('fac-68a-19-005');
    let first = null;
    z.r.forEach(r => {
      const l = L.polygon(r, { color: COL.refuge, weight: 1.4, opacity: .85,
        fillColor: COL.refuge, fillOpacity: .16 }).bindPopup(pop).addTo(layers.cwa);
      first = first || l;
    });
    qPoly(z.r, { k: 'cwa:' + i, n: z.n, cls: 'restrict', src: 'Critical Wildlife Areas',
      line: 'Critical Wildlife Area: take of fish prohibited where the area is posted, r. 68A-19.005(1)(b).' +
        (z.cd ? ' Closed: ' + esc(z.cd) + '.' : ''), law: ['fac-68a-19-005'] });
    const b = ringsBox(z.r);
    regSearch({ g: 'zone', n: z.n, sub: 'Critical Wildlife Area · ' + (z.c || ''), cat: 'cwa', layer: first,
      ll: centroid(z.r[0]), b: boxLL(b) });
  });
}
/* depth contours: VALDCO metres by the feet label, and a style per depth */
const CT_M = { 12: 3.6, 18: 5.4, 30: 9.1, 60: 18.2, 100: 30.4, 120: 36.5 };
const CT_STYLE = { 12: ['#e0f2fe', 1], 18: ['#bae6fd', 1], 30: ['#7dd3fc', 1.3],
  60: ['#38bdf8', 1.2], 100: ['#0ea5e9', 1.2], 120: ['#0369a1', 1.4] };
let CONT_B = [];
function buildContours() {
  CONT_B = [];
  CONT.forEach(c => {
    const ft = c.ft != null ? c.ft : Math.round((c.v || 9.1) * M_FT);
    const st = CT_STYLE[ft] || ['#7dd3fc', 1.2];
    const m = CT_M[ft] != null ? CT_M[ft] : (c.v || ft / M_FT);
    const pop = ft === 30
      ? '<h3>30 ft contour</h3>Charted 9.1 m below mean lower low water. This is the depth line the ' +
        'Palm Beach § 13-55 refuge carve-out turns on: water shallower than 30 ft at MLW is excluded from the ' +
        'refuge.<span class="m">NOAA ENC depth contour, statewide. Not for navigation.</span>' + C('pbc-13-55')
      : '<h3>' + ft + ' ft contour</h3>Charted ' + m.toFixed(1) + ' m below mean lower low water.' +
        '<span class="m">NOAA ENC depth contour, statewide. Florida ENC cells carry no 10 or 20 ft ' +
        'contours. Not for navigation.</span>';
    c.p.forEach(path => {
      L.polyline(path, { color: st[0], weight: st[1], opacity: .75, dashArray: ft === 30 ? '3,4' : null })
        .bindPopup(pop).addTo(layers.contour);
      CONT_B.push({ ft: ft, b: ringsBox([path]), p: path });
    });
  });
}
function buildHb() {
  const shade = { 'Aggregate Reef': '#2dd4bf', 'Ridge': '#34d399', 'Pavement': '#4ade80',
                  'Individual or Aggregated Patch Reef': '#a3e635',
                  'Scattered Coral/Rock in Unconsolidated Sediment': '#bef264' };
  HB.forEach(p => {
    const c = shade[p.c] || '#86efac';
    L.polygon(p.r, { color: c, weight: .8, opacity: .55, fillColor: c, fillOpacity: .18 })
      .bindPopup('<h3>' + esc(p.c) + '</h3>Natural hardbottom, FWRI Unified Reef Map.' +
        (p.b ? '<br>Cover: ' + esc(p.b) : '') +
        '<span class="m">Habitat polygon, not a dive site. Southeast Atlantic coverage only.</span>')
      .addTo(layers.hardbottom);
  });
}
const HBSW_COL = { 'Pavement (West Florida Shelf)': '#5eead4', 'Hardbottom': '#2dd4bf',
  'Probable Hardbottom': '#99f6e4', 'Hardbottom with Seagrass': '#86efac', 'Worm reef': '#fbbf24',
  'Coral Reef': '#fb7185' };
function buildHbSw() {
  HBSW.forEach(p => {
    const c = HBSW_COL[p.c] || '#5eead4';
    const pop = '<h3>' + esc(p.c) + '</h3>Hardbottom habitat, FWC compilation.' +
      (p.b ? '<br>Cover: ' + esc(p.b) : '') +
      '<span class="m">Source: ' + esc(p.s) + (p.y ? ' (' + esc(p.y) + ')' : '') +
      '<br>Habitat polygon, not a dive site. Coverage has gaps and some sources are coarse.</span>';
    p.r.forEach(r => {
      L.polygon(r, { color: c, weight: .7, opacity: .55, fillColor: c, fillOpacity: .16,
        dashArray: p.c === 'Probable Hardbottom' ? '3,3' : null }).bindPopup(pop).addTo(layers.hbsw);
    });
  });
}
/* charted bottom type: coloured by the first token of the charted string */
const SB_COL = { rock: '#fb923c', coral: '#fb7185', shells: '#fde047', sand: '#f3e3bf', mud: '#a16207',
  gravel: '#9ca3af', pebbles: '#9ca3af', stone: '#9ca3af', cobbles: '#9ca3af', boulder: '#9ca3af',
  silt: '#4b5563', clay: '#4b5563', unknown: '#64748b' };
const sbTok = s => String(s || 'unknown').split(',')[0].trim().toLowerCase();
const sbCol = s => SB_COL[sbTok(s)] || SB_COL.unknown;
const sbText = s => String(s || 'unknown').split(',').map(x => x.trim()).filter(Boolean).join(', ');
function sbPopup(cls, lat, lon) {
  return '<h3>Charted bottom: ' + esc(sbText(cls)) + '</h3>' +
    'A charted sample of the seabed surface from a NOAA chart, not a survey. It records what was ' +
    'found at this point when the chart was compiled, which may be decades ago; the bottom nearby can differ.' +
    '<span class="m">NOAA ENC nature of surface (SBDARE)' +
    (lat != null ? ' &middot; ' + lat.toFixed(5) + ', ' + lon.toFixed(5) : '') + '<br>Not for navigation.</span>';
}
function buildSeabed() {
  const cl = SEABED.classes || [];
  (SEABED.areas || []).forEach(a => {
    const cls = cl[a.c], c = sbCol(cls);
    a.r.forEach(r => L.polygon(r, { color: c, weight: .8, opacity: .6, fillColor: c, fillOpacity: .18 })
      .bindPopup(sbPopup(cls)).addTo(layers.seabed));
  });
  (SEABED.pts || []).forEach(p => {
    const cls = cl[p[2]], c = sbCol(cls);
    L.circleMarker([p[0], p[1]], { radius: 3, weight: .8, color: '#0b0e13', fillColor: c, fillOpacity: .9 })
      .bindPopup(() => sbPopup(cls, p[0], p[1])).addTo(layers.seabed);
  });
}
const BUOY_COL = { 'Mooring': '#60a5fa', 'Mooring Wreck': '#c084fc', 'Mooring-LV': '#93c5fd',
  'Spar': '#facc15', 'SPA Boundary': '#ff7a45', 'Research Only SPA Boundary': '#ff4d4f',
  'Buoy Closure': '#ff4d4f', 'I Beam': '#94a3b8' };
function buildBuoys() {
  const bySite = {};
  BUOYS.forEach(b => {
    const c = BUOY_COL[b.t] || '#60a5fa';
    const edge = /Boundary|Closure/i.test(b.t);
    const m = L.circleMarker([b.lat, b.lon], { radius: edge ? 4 : 3.5, weight: 1.5, color: c, fillColor: c,
      fillOpacity: edge ? .35 : .85 })
      .bindPopup('<h3>' + esc(b.n) + '</h3><b>' + esc(b.t) + '</b>' + (b.no ? ' &middot; buoy ' + esc(b.no) : '') +
        (b.d != null ? '<br>Depth at buoy about ' + esc(b.d) + ' ft' : '') +
        (b.res ? '<br>' + esc(b.res) : '') +
        (edge ? '<div class="pv pv-warn">This buoy marks the edge of a sanctuary zone or closure. The rule ' +
          'for the zone is on the Keys sanctuary layer; use <b>What&#8217;s here?</b> for this point.</div>' : '') +
        '<span class="m">' + esc(b.reg || '') + ' &middot; NOAA FKNMS buoy inventory (2025)<br>' +
        b.lat.toFixed(5) + ', ' + b.lon.toFixed(5) + '</span>')
      .addTo(layers.buoy);
    const k = b.n || 'Unnamed';
    (bySite[k] = bySite[k] || []).push([b, m]);
  });
  /* one search entry per buoy site; the buoy numbers stay searchable through the extra text */
  Object.keys(bySite).forEach(k => {
    const list = bySite[k], b0 = list[0][0];
    const types = [...new Set(list.map(x => x[0].t))].join(', ');
    const pts = list.map(x => [x[0].lat, x[0].lon]);
    regSearch({ g: 'buoy', n: k, a: list.map(x => x[0].no).join(' '),
      sub: 'FKNMS ' + (list.length > 1 ? list.length + ' buoys' : 'buoy ' + (b0.no || '')) + ' \u00b7 ' + types,
      cat: 'buoy', layer: list[0][1], ll: [b0.lat, b0.lon], b: list.length > 1 ? boxLL(ringsBox([pts])) : null, z: 16 });
  });
}
const ST_COL = { tide: '#34d399', current: '#22d3ee', buoy: '#facc15' };
function stationLink(s) {
  if (s.k === 'tide') return ['https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=' + encodeURIComponent(s.id), 'Tide predictions (NOAA CO-OPS)'];
  if (s.k === 'current') return ['https://tidesandcurrents.noaa.gov/noaacurrents/predictions?id=' + encodeURIComponent(s.id + '_' + (s.bin || 1)), 'Current predictions (NOAA CO-OPS)'];
  return ['https://www.ndbc.noaa.gov/station_page.php?station=' + encodeURIComponent(s.id), 'Station page (NOAA NDBC)'];
}
function buildStations() {
  STATIONS.forEach(s => {
    const c = ST_COL[s.k] || '#34d399', ln = stationLink(s);
    const kind = s.k === 'tide' ? 'Tide station' : (s.k === 'current' ? 'Current station' : 'NDBC weather or wave station');
    L.circleMarker([s.lat, s.lon], { radius: 3.5, weight: 1.5, color: c, fillColor: '#0b0e13', fillOpacity: .9 })
      .bindPopup('<h3>' + esc(s.n) + '</h3><b>' + kind + '</b> ' + esc(s.id) +
        (s.k === 'tide' && s.ref === false ? '<br>Subordinate station: predictions are offsets from a reference station.' : '') +
        (s.k === 'tide' && s.ref === true ? '<br>Reference station.' : '') +
        (s.o ? '<br>' + esc(s.o) : '') +
        '<br><a href="' + esc(ln[0]) + '" target="_blank" rel="noopener">' + esc(ln[1]) + ' &rarr;</a>' +
        '<span class="m">' + s.lat.toFixed(4) + ', ' + s.lon.toFixed(4) + '</span>')
      .addTo(layers.station);
  });
}
function refNote(extra) {
  return '<div class="pv pv-warn"><b>Reference only, not the law.</b> ' + extra + '</div>';
}
function buildEncR() {
  ENCR.forEach(a => {
    const pop = '<h3>' + esc(a.n || (a.k === 'military' ? 'Charted military area' : 'Charted restricted area')) + '</h3>' +
      (a.cat ? esc(a.cat) + '<br>' : '') + (a.inf ? '<i>' + esc(a.inf) + '</i>' : '') +
      refNote('This is the area as drawn on a NOAA chart cell. The rule is the regulation the chart ' +
        'refers to; the legal layers on this map are drawn from regulation text, not from the chart.') +
      '<span class="m">NOAA ENC ' + esc(a.cell || '') + '. Not for navigation.</span>';
    const c = a.k === 'military' ? '#f59e0b' : COL.encr;
    a.r.forEach(r => {
      const big = boxKm2(ringsBox([r]));
      addPoly(r, { color: c, weight: 1, opacity: .7, dashArray: '6,4', fillColor: c, fillOpacity: .05 },
        pop, layers.encr, big > BIG_KM2 ? big : 0);
    });
  });
}
function mpaLinks(u) {
  if (!u) return '';
  const out = [];
  String(u).split('|').forEach(part => {
    const m = /(https?:\/\/[^\s;]+)/.exec(part);
    if (m) out.push('<a href="' + esc(m[1]) + '" target="_blank" rel="noopener">' + esc(m[1].replace(/^https?:\/\//, '').slice(0, 48)) + '</a>');
  });
  return out.length ? '<br>' + out.join('<br>') : '';
}
function buildMpa() {
  MPA.forEach(a => {
    const pop = '<h3>' + esc(a.n) + '</h3>' +
      esc(a.gov) + ' &middot; ' + esc(a.lvl) + (a.ag ? '<br>' + esc(a.ag) : '') +
      (a.fish ? '<br>Inventory fishing field: ' + esc(a.fish) : '') +
      (a.iucn ? '<br>IUCN ' + esc(a.iucn) : '') + (a.yr ? ' &middot; est. ' + esc(a.yr) : '') +
      mpaLinks(a.url) +
      refNote('NOAA states that MPA Inventory records are not legal documents. The rules that apply are in ' +
        'the regulations for the site; where this map has them, they are on the legal layers.') +
      '<span class="m">NOAA Marine Protected Areas Inventory' + (a.km2 ? ' &middot; ' + Math.round(a.km2).toLocaleString() + ' km&sup2;' : '') + '</span>';
    a.r.forEach(r => {
      const big = boxKm2(ringsBox([r]));
      addPoly(r, { color: COL.mpa, weight: 1, opacity: .75, dashArray: '2,4', fillColor: COL.mpa, fillOpacity: .05 },
        pop, layers.mpa, big > BIG_KM2 ? big : 0);
    });
  });
}

/* ---------- curated dive spots ---------- */
const SPOT_KIND = { 'artificial-reef': 'Artificial reef', reef: 'Reef', wreck: 'Wreck', 'shore-dive': 'Shore dive',
  preserve: 'Preserve', jetty: 'Jetty', ledge: 'Ledge' };
const SPOT_ACCESS = { boat: 'Boat access', shore: 'Shore access', both: 'Boat or shore access' };
const spotIcon = () => L.divIcon({ className: 'spotpin', html: '<i></i>', iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -6] });
const LEGAL_CACHE = {};
const legalKey = (lat, lon) => mode + '|' + lat.toFixed(5) + ',' + lon.toFixed(5);
function legalSlot(lat, lon) {
  const k = legalKey(lat, lon);
  return '<div class="sp-legal"><div class="wh-h0">Legal layers at this point</div>' +
    (LEGAL_CACHE[k] || '<div class="wh-slot" data-lat="' + lat + '" data-lon="' + lon + '">Checking every drawn legal layer at this point…</div>') +
    '</div>';
}
function mediaBlock(links) {
  if (!links || !links.length) return '';
  const g = { photo: [], video: [], page: [] };
  links.forEach(l => (l.kind === 'photo' ? g.photo : l.kind === 'video' ? g.video : g.page).push(l));
  const a = l => '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.title || l.url) + '</a>' +
    (l.source ? ' <span class="sp-src">' + esc(l.source) + '</span>' : '');
  let h = '<div class="sp-media">';
  if (g.photo.length) {
    h += '<div class="sp-mh">Photos</div>' + g.photo.map(l =>
      '<div class="sp-ph">' + (l.thumb ? '<a href="' + esc(l.url) + '" target="_blank" rel="noopener"><img src="' +
        esc(l.thumb) + '" alt="' + esc(l.title || '') + '" loading="lazy"></a>' : '') + a(l) +
      (l.credit || l.licence ? '<div class="sp-cr">' + esc([l.credit, l.licence].filter(Boolean).join(' · ')) + '</div>' : '') +
      '</div>').join('');
  }
  if (g.video.length) h += '<div class="sp-mh">Videos</div><ul>' + g.video.map(l => '<li>' + a(l) + '</li>').join('') + '</ul>';
  if (g.page.length) h += '<div class="sp-mh">Pages</div><ul>' + g.page.map(l => '<li>' + a(l) +
    (l.kind === 'gallery' ? ' <span class="sp-src">gallery</span>' : '') + '</li>').join('') + '</ul>';
  return h + '</div>';
}
function spotPopup(s) {
  const dep = s.depth_ft ? esc(s.depth_ft) + ' ft' : '';
  const meta = [SPOT_KIND[s.kind] || s.kind, dep, SPOT_ACCESS[s.access] || s.access].filter(Boolean).join(' &middot; ');
  return '<div class="sp-pop"><h3>' + esc(s.n) + '</h3>' +
    (s.aka ? '<div class="sp-aka">Also known as ' + esc(s.aka) + '</div>' : '') +
    '<div class="sp-meta">' + meta + '</div>' +
    (s.desc ? '<div class="sp-desc">' + esc(s.desc) + '</div>' : '') +
    mediaBlock(s.links) +
    legalSlot(s.lat, s.lon) +
    '<div class="sp-disc">Listed for its structure only. A listing here does not mean spearfishing is ' +
    'legal at this spot; read the legal layers and the posted signs.</div>' +
    '<span class="m">' + esc([s.county, s.region].filter(Boolean).join(', ')) + '<br>' +
    s.lat.toFixed(5) + ', ' + s.lon.toFixed(5) + '<br>Position: ' +
    (s.coord_url ? '<a href="' + esc(s.coord_url) + '" target="_blank" rel="noopener">' + esc(s.coord_src || 'source') + '</a>' : esc(s.coord_src || '')) +
    (s.note ? '<br>Position note: ' + esc(s.note) : '') + '</span></div>';
}
function buildSpots() {
  SPOTS.forEach(s => {
    const m = L.marker([s.lat, s.lon], { icon: spotIcon(), title: s.n, riseOnHover: true })
      .bindPopup(() => spotPopup(s), { maxWidth: 340, minWidth: 240 });
    spotMarks[s.id] = m;
    layers.spots.addLayer(m);
    regSearch({ g: 'spot', id: s.id, n: s.n, a: s.aka || '', sub: [SPOT_KIND[s.kind] || s.kind, s.county,
      s.depth_ft ? s.depth_ft + ' ft' : ''].filter(Boolean).join(' · '), cat: 'spots', layer: m,
      ll: [s.lat, s.lon], z: 15 });
  });
}
/* ?zone=<id> (from the open questions page): load the zone files, then go to that zone */
function openZone(id) {
  return Promise.all(['zones-local', 'zones-statewide'].map(n => ensure(n).catch(() => null))).then(() => {
    const it = SEARCH_ITEMS.find(x => x.g === 'zone' && x.zid === id);
    if (!it) return false;
    focusFeature(it);
    return true;
  });
}
function openSpot(id) {
  return ensure('spots').then(() => {
    const it = SEARCH_ITEMS.find(x => x.g === 'spot' && x.id === id);
    if (!it) return false;
    focusFeature(it);
    return true;
  });
}

/* ---------- focus a feature: switch its row on, go there, open its popup ---------- */
function openLayerPopup(layer, ll) {
  if (!layer) return;
  if (layer._map) { layer.openPopup(ll); return; }
  const p = layer.getPopup && layer.getPopup();
  if (!p) return;
  const c = p._content;
  L.popup({ maxWidth: 340 }).setLatLng(ll || (layer.getLatLng ? layer.getLatLng() : null))
    .setContent(typeof c === 'function' ? () => c(layer) : c).openOn(map);
}
function focusFeature(it) {
  if (it.cat && shown[it.cat] === false) {
    shown[it.cat] = true;
    const c = CATS.find(x => x.id === it.cat);
    if (c && c.src) c.src.forEach(ensure);
    applyVisibility(); buildLegend(); render();
  }
  if (it.b) map.fitBounds(it.b, { maxZoom: it.z || 14, padding: [40, 40], animate: false });
  else map.setView(it.ll, Math.max(map.getZoom(), it.z || 14), { animate: false });
  openLayerPopup(it.layer, it.ll);
}

/* ---------- What's here ---------- */
let whArmed = false;
function armWh() {
  whArmed = true;
  const b = document.getElementById('whbtn'); if (b) b.classList.add('on');
  if (map) map.getContainer().classList.add('wh-armed');
}
function disarmWh() {
  whArmed = false;
  const b = document.getElementById('whbtn'); if (b) b.classList.remove('on');
  if (map) map.getContainer().classList.remove('wh-armed');
}
const Q_LEGAL = ['fknms', 'parkwaters', 'cwa', 'zones-local', 'zones-statewide', 'piers', 'bridges', 'jetties', 'beaches'];
/* contours (3 MB) are used only when already loaded, so a first query on a phone stays light */
const Q_EXTRA = ['spots', 'seabed', 'jurisdiction'];
const Q_NAMES = { fknms: 'Keys sanctuary zones', parkwaters: 'state park waters', cwa: 'Critical Wildlife Areas',
  'zones-local': 'local and federal zones', 'zones-statewide': 'statewide zones', piers: 'pier buffers',
  bridges: 'bridge buffers', jetties: 'jetty buffers', beaches: 'beach buffers' };
const NEAR_M = 300, NOGEOM_M = 5000;
function queryPoint(lat, lon, opts) {
  opts = opts || {};
  const need = Q_LEGAL.concat(opts.extras ? Q_EXTRA : []);
  return coreReady.then(() => ensureAll(need)).then(() => pointFacts(+lat, +lon, opts));
}
function pointFacts(lat, lon, opts) {
  const r = { lat: lat, lon: lon, closed: [], restrict: [], other: [], near: [], nogeom: [], missing: [] };
  const seen = {};
  const padNear = NEAR_M / 100000;
  QIDX.forEach(q => {
    if (!inBox(lat, lon, q.b, padNear)) return;
    const m = q.m;
    let inside = false, dist = Infinity;
    if (q.c) {
      const d = distM(lat, lon, q.c[0], q.c[1]);
      inside = d <= q.c[2]; dist = d - q.c[2];
    } else if (inBox(lat, lon, q.b, 0)) {
      inside = q.rings.some(rg => pip(lat, lon, rg));
    }
    const cls = m.cls === 'refuge' ? (mode === 'scuba' ? 'closed' : 'other') : m.cls;
    if (inside) {
      if (seen[m.k]) return; seen[m.k] = 1;
      const line = m.cls === 'refuge' ? 'No spearfishing on underwater breathing apparatus inside the refuge, ' +
        'PBC Code §§ 13-55, 13-56. This rule does not restrict freediving.' : m.line;
      r[cls].push({ n: m.n, line: line, law: m.law, src: m.src });
    } else if (cls === 'closed') {
      if (!q.c) dist = Math.min.apply(null, q.rings.map(rg => lineDistM(lat, lon, rg)));
      if (dist <= NEAR_M) r.near.push({ k: m.k, n: m.n, d: dist });
    }
  });
  const nearSeen = {};
  r.near = r.near.filter(x => !seen[x.k] && !nearSeen[x.k] && (nearSeen[x.k] = 1)).sort((a, b) => a.d - b.d).slice(0, 8);
  const padNo = NOGEOM_M / 100000;
  QNOGEOM.forEach(q => {
    if (!inBox(lat, lon, q.b, padNo * 1.2)) return;
    const d = Math.min.apply(null, q.paths.map(p => lineDistM(lat, lon, p)));
    if (d <= NOGEOM_M) r.nogeom.push({ n: q.m.n, line: q.m.line, law: q.m.law, d: d });
  });
  r.nogeom.sort((a, b) => a.d - b.d);
  r.missing = Q_LEGAL.filter(n => !srcOk(n)).map(n => Q_NAMES[n] || n);
  if (opts.extras) Object.assign(r, extraFacts(lat, lon));
  return r;
}
function extraFacts(lat, lon) {
  const x = {};
  /* bottom type: inside a charted area first, else the nearest sample within 1 km */
  if (SEABED) {
    const cl = SEABED.classes || [];
    const known = c => sbTok(cl[c]) !== 'unknown';
    const a = (SEABED.areas || []).find(ar => known(ar.c) && ar.r.some(rg => pip(lat, lon, rg)));
    if (a) x.bottom = { cls: cl[a.c], d: 0 };
    else {
      let best = null, bd = 1000;
      SEABED.pts.forEach(p => {
        if (!known(p[2]) || Math.abs(p[0] - lat) > .01 || Math.abs(p[1] - lon) > .011) return;
        const d = distM(lat, lon, p[0], p[1]);
        if (d < bd) { bd = d; best = p; }
      });
      if (best) x.bottom = { cls: cl[best[2]], d: bd };
    }
  }
  if (SPOTS && SPOTS.length) {
    let best = null, bd = Infinity;
    SPOTS.forEach(s => { const d = distM(lat, lon, s.lat, s.lon); if (d < bd) { bd = d; best = s; } });
    if (best && bd < 60 * M_NM) x.spot = { id: best.id, n: best.n, d: bd };
  }
  if (CONT_B.length) {
    const byFt = {};
    CONT_B.forEach(c => {
      if (!inBox(lat, lon, c.b, .02)) return;
      const d = lineDistM(lat, lon, c.p);
      if (d <= 2000 && (byFt[c.ft] == null || d < byFt[c.ft])) byFt[c.ft] = d;
    });
    const k = Object.keys(byFt).map(Number).sort((a, b) => a - b);
    if (k.length) x.contours = k.map(ft => ({ ft: ft, d: byFt[ft] }));
  }
  if (JURIS) {
    let best = Infinity, which = '';
    [['atl', 'Atlantic, 3 nm'], ['gom', 'Gulf, 9 nm']].forEach(([kk, lab]) => (JURIS[kk] || []).forEach(p => {
      const d = lineDistM(lat, lon, p);
      if (d < best) { best = d; which = lab; }
    }));
    if (best < 40 * M_NM) x.sw = { d: best, which: which };
  }
  if (window.FLCoverage && window.FLCoverage.data) {
    const cov = window.FLCoverage.data;
    const hit = t => cov.regions.find(g => g.tier === t && pip(lat, lon, g.outer) &&
      !(g.holes || []).some(h => pip(lat, lon, h)));
    const g = hit('full') || hit('partial') || hit('none');
    if (g) { const t = (cov.tiers || {})[g.tier] || {}; x.cov = { tier: g.tier, label: t.label || g.tier, head: t.head || '' }; }
  }
  return x;
}
const NO_RESULT = 'No researched closure covers this point. That does not mean the water is open: beach buffers ' +
  'are not drawn outside Palm Beach County and Hollywood, pier and bridge buffers only for inventoried structures, ' +
  'and other local rules may apply.';
function whItem(it) {
  return '<div class="wh-i"><b>' + esc(it.n) + '</b>' + (it.line ? '<span>' + it.line + '</span>' : '') +
    Cc(it.law) + '</div>';
}
function legalHtml(r) {
  let h = '';
  if (r.closed.length) h += '<div class="wh-sec wh-no"><div class="wh-h">Closed at this point</div>' +
    r.closed.map(whItem).join('') + '</div>';
  if (r.restrict.length) h += '<div class="wh-sec wh-warn"><div class="wh-h">Restricted at this point</div>' +
    r.restrict.map(whItem).join('') + '</div>';
  if (!r.closed.length) h += '<div class="pv pv-warn">' + NO_RESULT + '</div>';
  else h += '<div class="wh-note">Rules with no drawn boundary (beach buffers on bays, lagoons and beaches ' +
    'outside the state\'s monument chains, piers and bridges missing from the inventories, and local ordinances) ' +
    'may also apply here.</div>';
  if (r.other.length) h += '<div class="wh-sec"><div class="wh-h">Other rules drawn here</div>' +
    r.other.map(whItem).join('') + '</div>';
  if (r.near.length) h += '<div class="wh-sec"><div class="wh-h">Drawn closures within ' + NEAR_M + ' m</div>' +
    '<ul class="wh-ul">' + r.near.map(x => '<li>' + esc(x.n) + ' <span class="wh-d">' + fmtDist(x.d) + '</span></li>').join('') +
    '</ul></div>';
  if (r.nogeom.length) h += '<div class="wh-sec"><div class="wh-h">Rules nearby with no drawn boundary</div>' +
    r.nogeom.slice(0, 5).map(x => '<div class="wh-i"><b>' + esc(x.n) + '</b> <span class="wh-d">' + fmtDist(x.d) +
      '</span><span>' + x.line + '</span>' + Cc(x.law) + '</div>').join('') + '</div>';
  if (r.missing.length) h += '<div class="wh-note">Not checked, data not available: ' + esc(r.missing.join(', ')) + '.</div>';
  return h;
}
function whHtml(r) {
  let f = '';
  if (r.bottom) f += '<div><b>Bottom</b> Charted ' + esc(sbText(r.bottom.cls)) +
    (r.bottom.d ? ', ' + fmtDist(r.bottom.d) + ' away' : ', charted area') + ' (a chart sample, not a survey)</div>';
  else if (SEABED) f += '<div><b>Bottom</b> No charted bottom sample with a stated type within 1 km</div>';
  if (r.contours) f += '<div><b>Contours</b> ' + r.contours.map(c => c.ft + ' ft at ' + fmtDist(c.d)).join(', ') + '</div>';
  else if (!srcOk('contours')) f += '<div><b>Contours</b> Switch on the depth contours row to include them here</div>';
  else f += '<div><b>Contours</b> No charted contour within 2 km</div>';
  if (r.sw) f += '<div><b>State waters line</b> ' + fmtDist(r.sw.d) + ' away (' + r.sw.which + ' line; which side is not computed)</div>';
  if (r.spot) f += '<div><b>Nearest spot</b> <a href="#" data-spot="' + esc(r.spot.id) + '">' + esc(r.spot.n) + '</a>, ' + fmtDist(r.spot.d) + '</div>';
  if (r.cov) f += '<div><b>Research coverage</b> ' + esc(r.cov.label) + (r.cov.head ? ': ' + esc(r.cov.head) : '') + '</div>';
  return '<div class="wh"><h3>What&#8217;s here</h3>' +
    '<div class="m wh-ll">' + fmtDM(r.lat, r.lon) + '<br>' + r.lat.toFixed(5) + ', ' + r.lon.toFixed(5) + '</div>' +
    legalHtml(r) + (f ? '<div class="wh-facts">' + f + '</div>' : '') +
    '<div class="wh-foot">Not legal advice. Boundaries are approximate. Not for navigation.</div></div>';
}
function whatsHere(lat, lon) {
  lat = +lat; lon = +lon;
  if (isNaN(lat) || isNaN(lon)) return Promise.resolve(null);
  return mapReady.then(() => {
    const p = L.popup({ maxWidth: 360, minWidth: 260, className: 'wh-pop', autoPanPaddingTopLeft: [20, 60] })
      .setLatLng([lat, lon])
      .setContent('<div class="wh"><h3>What&#8217;s here</h3><div class="wh-wait">Checking every drawn legal layer at this point…</div></div>')
      .openOn(map);
    return queryPoint(lat, lon, { extras: true }).then(r => {
      if (map.hasLayer(p)) p.setContent(whHtml(r));
      return r;
    });
  });
}
function onPopupOpen(e) {
  const el = e.popup.getElement();
  if (!el) return;
  el.querySelectorAll('.wh-slot[data-lat]').forEach(slot => {
    if (slot.dataset.busy) return;
    slot.dataset.busy = '1';
    const lat = +slot.dataset.lat, lon = +slot.dataset.lon;
    queryPoint(lat, lon, { extras: false }).then(r => {
      const html = legalHtml(r);
      LEGAL_CACHE[legalKey(lat, lon)] = html;
      if (typeof e.popup._content === 'function' && map.hasLayer(e.popup)) e.popup.update();
      else slot.outerHTML = html;
    });
  });
}

/* ---------- legend / filter ---------- */
const vis = f => showInland || !isInland(f);
const zCount = (list, pred) => list.filter(pred).length;
function countFor(id) {
  if (id === 'ramp') return RAMPS.filter(vis).length;
  if (['natural', 'hirelief', 'artificial'].includes(id)) return SITES.filter(s => cat(s) === id && vis(s)).length;
  if (ENC_STYLE[id]) return ENC ? ENC.filter(p => p.k === id).length : null;
  if (id === 'encarea') return ENCA ? ENCA.length : null;
  if (id === 'spots') return SPOTS ? SPOTS.length : null;
  if (id === 'buoy') return BUOYS ? BUOYS.length : null;
  if (id === 'station') return STATIONS ? STATIONS.length : null;
  if (id === 'seabed') return SEABED ? SEABED.pts.length + (SEABED.areas || []).length : null;
  if (id === 'hbsw') return HBSW ? HBSW.length : null;
  if (id === 'encr') return ENCR ? ENCR.length : null;
  if (id === 'mpa') return MPA ? MPA.length : null;
  if (id === 'park') return PARKS ? PARKS.length : null;
  if (id === 'hardbottom') return HB ? HB.length : null;
  if (id === 'contour') return CONT ? CONT.reduce((n, c) => n + c.p.length, 0) : null;
  if (id === 'fknms') return FKNMS ? FKNMS.filter(z => z.fish !== 'Yes').length : null;
  if (id === 'pier') return PIERS ? PIERS.filter(vis).length : null;
  if (id === 'bridgeConf') return BRIDGES ? BRIDGES.filter(b => b.st === 'confirmed' && vis(b)).length : null;
  if (id === 'bridgePres') return BRIDGES ? BRIDGES.filter(b => b.st === 'presumed' && vis(b)).length : null;
  if (id === 'bridgeExcl') return BRIDGES ? BRIDGES.filter(b => b.st === 'excluded' && vis(b)).length : null;
  if (id === 'closure') return CLOSURES.length;
  if (id === 'cwa') return srcOk('cwa') ? CWA.length : null;
  if (id === 'local' || id === 'fed') {
    if (!srcOk('zones-local') && !srcOk('zones-statewide')) return null;
    return zCount(LOCALZ, z => (z.cat || 'local') === id) + zCount(STATEZ, z => z.cat === id);
  }
  if (id === 'flags') {
    if (!srcOk('zones-local') && !srcOk('zones-statewide')) return null;
    return zCount(LOCALZ, z => !!z.flag) + zCount(STATEZ, z => !!z.flag);
  }
  if (GRP_OF[id]) return srcOk('zones-statewide') ? zCount(STATEZ, z => z.cat === id) : null;
  return null;
}
/* row state from its sources: ok | loading | idle | missing | error */
function rowState(c) {
  const src = c.src || [];
  if (!src.length) return 'ok';
  const st = src.map(n => {
    if (!SRC[n]) return 'ok';
    if (window.__DATA && (window.__DATA[n] === undefined || window.__DATA[n] === null)) return 'missing';
    return SRC[n].st;
  });
  if (st.every(s => s === 'missing')) return 'missing';
  if (st.some(s => s === 'loading')) return 'loading';
  if (st.some(s => s === 'ok')) return 'ok';
  if (st.some(s => s === 'error')) return 'error';
  if (st.some(s => s === 'missing')) return 'missing';
  return 'idle';
}
let lgFolded = null;
/* groups whose rows are all off by default start folded, to keep the legend short */
const grpFold = { bridge: true, habitat: true, ref: true };
function legendRow(c) {
  const st = rowState(c), n = st === 'ok' ? countFor(c.id) : null;
  const tail = st === 'loading' ? '…'
    : st === 'missing' ? '<span class="lg-miss">not included in this offline build</span>'
    : st === 'error' ? '<span class="lg-miss">did not load, click to retry</span>'
    : (n == null ? '' : n.toLocaleString());
  return '<button class="lg-row' + (shown[c.id] ? ' on' : '') + (st === 'loading' ? ' pending' : '') +
    (st === 'missing' ? ' missing' : '') + '" data-cat="' + c.id + '"' + (st === 'missing' ? ' disabled' : '') +
    ' aria-pressed="' + (!!shown[c.id]) + '">' +
    '<i style="background:' + c.col + '"></i>' +
    '<span>' + c.label + '</span>' +
    '<em>' + tail + '</em></button>';
}
function buildLegend() {
  const el = document.getElementById('legend');
  if (!el) return;
  if (lgFolded === null) lgFolded = window.innerWidth < 700;
  el.classList.toggle('folded', lgFolded);
  el.innerHTML =
    '<div class="lg-head"><b>Legend</b>' +
      '<span><button class="lg-mini" id="lg-all">all</button>' +
      '<button class="lg-mini" id="lg-none">none</button>' +
      '<button class="lg-mini" id="lg-fold" aria-expanded="' + !lgFolded + '" title="' + (lgFolded ? 'Show the legend' : 'Hide the legend') + '">' +
      (lgFolded ? '+' : '&minus;') + '</button></span></div>' +
    '<div id="lg-body"' + (lgFolded ? ' style="display:none"' : '') + '>' + GROUPS_ORDER.map(g => {
      const rows = CATS.filter(c => c.grp === g);
      if (!rows.length) return '';
      const nOn = rows.filter(c => shown[c.id]).length;
      return '<div class="lg-g' + (grpFold[g] ? ' folded' : '') + '">' +
        '<button class="lg-grp" data-grp="' + g + '" aria-expanded="' + !grpFold[g] + '">' +
        '<span class="lg-caret">' + (grpFold[g] ? '&#9656;' : '&#9662;') + '</span>' + GRPLABEL[g] +
        '<em>' + nOn + '/' + rows.length + '</em></button>' +
        '<div class="lg-rows">' + rows.map(legendRow).join('') +
          (g === 'ref' ? '<div class="lg-note lg-note-ref">Charted and inventory areas for context. The ' +
            'legal boundaries are the layers above.</div>' : '') + '</div>' +
        '</div>';
    }).join('') +
      '<div class="lg-note">' + (showInland
        ? '<b>Inland waters shown.</b> Spearfishing is prohibited in all Florida fresh water, so these are '
          + 'for context only.'
        : '<b>Inland waters hidden.</b> ' + (BRIDGES ? BRIDGES.filter(isInland).length.toLocaleString() : 'Some')
          + ' bridges and ' + (PIERS ? PIERS.filter(isInland).length : 'some')
          + ' piers are on fresh water and excluded. Toggle in the header.') +
      '</div></div>';
  el.querySelectorAll('[data-cat]').forEach(b => {
    b.onclick = () => {
      const id = b.dataset.cat, c = CATS.find(x => x.id === id);
      shown[id] = !shown[id];
      b.classList.toggle('on', shown[id]);
      b.setAttribute('aria-pressed', String(shown[id]));
      if (shown[id] && c && c.src) c.src.forEach(n => {
        if (SRC[n] && SRC[n].st === 'error') { SRC[n].p = null; SRC[n].st = 'idle'; }
        ensure(n);
      });
      applyVisibility(); render(); legendSoon();
    };
  });
  el.querySelectorAll('[data-grp]').forEach(b => {
    b.onclick = () => { grpFold[b.dataset.grp] = !grpFold[b.dataset.grp]; buildLegend(); };
  });
  const setAll = on => {
    CATS.forEach(c => { shown[c.id] = on; if (on && c.src) c.src.forEach(ensure); });
    applyVisibility(); buildLegend(); render();
  };
  el.querySelector('#lg-all').onclick = () => setAll(true);
  el.querySelector('#lg-none').onclick = () => setAll(false);
  el.querySelector('#lg-fold').onclick = () => { lgFolded = !lgFolded; buildLegend(); };
}
function applyVisibility() {
  if (!map) return;
  let added = false;
  CATS.forEach(c => {
    const l = layers[c.id], il = ilayers[c.id];
    const low = c.z != null && c.z < 5;
    if (l) { if (shown[c.id]) { if (!map.hasLayer(l)) { l.addTo(map); added = added || low; } }
             else if (map.hasLayer(l)) map.removeLayer(l); }
    if (il) { if (shown[c.id] && showInland) { if (!map.hasLayer(il)) { il.addTo(map); added = added || low; } }
              else if (map.hasLayer(il)) map.removeLayer(il); }
  });
  /* a polygon group added late is drawn above the point groups; put it back underneath */
  if (added) restackSoon();
}

/* ---------- sidebar ---------- */
const GROUPS = [
  ['natural', 'Natural reef & ledge', 'Relief you can ambush at close range.'],
  ['hirelief', 'Artificial, high relief', '10 ft or more off the sand.'],
  ['artificial', 'Artificial, low or unknown relief', 'Rubble, modules, concrete and small wrecks.']
];
function render() {
  if (!origin) return;
  const inRange = SITES.filter(s => s.nm != null && s.nm < 15 && vis(s)).sort((a, b) => a.nm - b.nm);
  const county = origin.c;
  const cinfo = REGS.counties && REGS.counties[county];
  let h = '';
  const closedNear = inRange.filter(s => s.closed).length;

  if (closedNear) {
    h += '<div class="crit"><b>Statutory closure in range.</b><br><br>' + closedNear +
      ' site' + (closedNear > 1 ? 's' : '') + ' within 15 nm sit inside a Fla. Stat. § 379.2425 closed area ' +
      '(the Upper Keys or John Pennekamp). Spearfishing there is prohibited outright, freediving included.</div>';
  }
  if (county === 'Palm Beach') {
    const openNat = inRange.filter(s => s.t === 'n' && !blocked(s) && !edging(s));
    h += '<div class="crit"><b>' + (mode === 'scuba'
      ? 'On scuba, Refuge Areas 1 and 2 close most of the near reef.'
      : 'Freediving: the § 13-56 refuge rule does not restrict freediving.') + '</b><br><br>' + (mode === 'scuba'
      ? 'PBC § 13-56 bans spearfishing on underwater breathing apparatus inside the two § 13-55 refuges. <b>' +
        openNat.length + ' natural sites within 15 nm are outside both refuges</b>; other rules still apply to them.'
      : '§ 13-56 only reaches spearfishing <i>while using underwater breathing apparatus</i>.') + '</div>';
  } else if (cinfo) {
    h += '<div class="info"><b>' + esc(county) + ': county notes.</b><br><br>' + cinfo.txt + '</div>';
  } else {
    h += '<div class="info"><b>' + esc(county) + ': no county notes.</b><br><br>' +
      'The statewide rules below apply. This county has no notes in this map, so its county and municipal ' +
      'ordinances may not have been checked. Of the R. 68B-20.003(2) buffers, jetties are drawn statewide, ' +
      'bridges and FWC-listed piers are drawn, and the beach buffer is drawn along the open-coast sandy beaches ' +
      'the state monitors, but <b>not</b> on bays, lagoons or beaches outside those monument chains. Assume a ' +
      'buffer applies wherever there is a beach, pier, fishing bridge or jetty.</div>';
  }
  h += '<h2>Launching from ' + esc(origin.n) + '</h2><div class="sub">' +
       origin.ln + ' lanes · ' + origin.tr + ' trailer spaces · ' + esc(origin.h) +
       ' · fee ' + esc(origin.fee) + '</div>';
  sideEl.innerHTML = h;

  let any = false;
  for (const [c, title, desc] of GROUPS) {
    if (!shown[c]) continue;
    const rows = inRange.filter(s => cat(s) === c).slice(0, 30);
    if (!rows.length) continue;
    any = true;
    sideEl.insertAdjacentHTML('beforeend', '<h2>' + title + ' <span class="ct">' +
      inRange.filter(s => cat(s) === c).length + ' in range</span></h2><div class="sub">' + desc + '</div>');
    rows.forEach(s => sideEl.appendChild(siteRow(s, c)));
  }
  if (!any) sideEl.insertAdjacentHTML('beforeend',
    '<div class="sub" style="margin-top:12px">No site categories are switched on in the legend, ' +
    'or nothing is within 15 nm of this ramp.</div>');

  const SEC = [['Before you launch', 'licences'], ['Statewide rules', 'statewide'],
               ['Fresh vs salt: the legal line', 'freshwater'],
               ['Ramps, fees & hours', 'ramps'], ['Seasons & limits', 'seasons'],
               ['Safety & conditions', 'safety']];
  SEC.forEach(([t, k]) => {
    if (!REGS[k]) return;
    sideEl.insertAdjacentHTML('beforeend', '<h2>' + t + '</h2>');
    REGS[k].forEach(([a, b]) =>
      sideEl.insertAdjacentHTML('beforeend', '<div class="reg"><b>' + a + '</b><span>' + b + '</span></div>'));
  });
  sideEl.insertAdjacentHTML('beforeend',
    '<h2>Prohibited by spear in Florida</h2><div class="prohib">' + REGS.prohibited + '</div>');
  sideEl.insertAdjacentHTML('beforeend', '<div class="note"><b>Read this before you rely on any line here.</b><br><br>' +
    '<b>Legal coverage is not uniform.</b> Palm Beach County has the most complete coverage, including the ' +
    'feature-relative beach, pier, bridge and jetty buffers. Statewide, the federal and state closures and many ' +
    'local ordinance closures are drawn, and every rule is available as text. Of the buffers in Fla. Admin. Code ' +
    'r. 68B-20.003(2), the jetty buffers are drawn structure by structure statewide, coastal bridge buffers run ' +
    'along each deck the chart or the road map shows, and the 100 yd beach buffer is drawn along the open-coast ' +
    'sandy beaches the state monitors. Beaches on bays and lagoons and unlisted piers have no buffer; assume ' +
    'they apply. Unshaded or unflagged water is not shown as open.<br><br>' +
    'The Palm Beach refuge <i>latitudes</i> are exact, quoted from § 13-55. The Upper Keys closure edges are a ' +
    'construction: the statute names Long Key and a county line, not coordinates. Buffers carry deliberate ' +
    'margin over the rule. Reef points are deployment or survey centroids, not the structure you swim. ' +
    'The Unified Reef Map hardbottom layer is southeast Atlantic only; Gulf and north Atlantic hardbottom comes ' +
    'from separate FWC compilations.<br><br>Not legal advice. Verify with FWC before every trip.</div>');
}
function siteRow(s, c) {
  const d = document.createElement('div'); d.className = 'row';
  let b = '';
  if (s.closed) b = '<span class="badge b-ref">Closed &middot; § 379.2425</span>';
  else if (blocked(s)) b = '<span class="badge b-ref">Refuge ' + s.ref + ' &middot; no scuba</span>';
  else if (edging(s)) b = '<span class="badge b-edge">On the boundary</span>';
  else if (s.rel >= 15) b = '<span class="badge b-hi">' + s.rel + ' ft relief</span>';
  d.innerHTML = '<div class="dot" style="background:' + col(s) + '"></div><div style="flex:1"><b>' +
    esc(s.n) + '</b>' + (depS(s) ? '<span>' + depS(s) +
    (s.rel ? ' · ' + s.rel + ' ft relief' : '') + '</span>' : '') + b +
    '</div><div class="tag">' + s.nm.toFixed(2) + ' nm<br>' + brgS(s.brg) + '&deg;</div>';
  d.onclick = () => { map.setView([s.lat, s.lon], 15); marks[key(s)].openPopup(); };
  return d;
}

/* ---------- exports ---------- */
function save(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function exportSites() {
  return SITES.filter(s => shown[cat(s)] && vis(s)).sort((a, b) => (a.nm || 0) - (b.nm || 0));
}
function downloadGpx() {
  let g = '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Bottom Truth" ' +
    'xmlns="http://www.topografix.com/GPX/1/1">\n<metadata><name>Bottom Truth: Florida spearfishing closures map</name>' +
    '<desc>Exported for the categories switched on in the legend. Not legal advice.</desc></metadata>\n';
  exportSites().forEach(s => {
    const d = [depS(s), s.rel ? s.rel + ' ft relief' : '', s.t === 'n' ? 'natural' : 'artificial', s.c, s.nt];
    if (s.closed) d.push('SPEARFISHING PROHIBITED - Fla. Stat. 379.2425 closed area');
    if (s.ref) d.push('REFUGE AREA ' + s.ref + ' - no spearfishing on scuba');
    if (s.edge) d.push('ON A REFUGE BOUNDARY - treat as closed to scuba');
    g += '<wpt lat="' + s.lat + '" lon="' + s.lon + '"><name>' + esc(s.n) + '</name><desc>' +
         esc(d.filter(Boolean).join(' | ')) + '</desc><sym>Fishing Hot Spot Facility</sym></wpt>\n';
  });
  if (shown.spots && SPOTS) SPOTS.forEach(s => {
    g += '<wpt lat="' + s.lat + '" lon="' + s.lon + '"><name>' + esc(s.n) + '</name><desc>' +
      esc([SPOT_KIND[s.kind] || s.kind, s.depth_ft ? s.depth_ft + ' ft' : '', s.county,
        'Listed for structure only; check the legal layers and posted signs'].filter(Boolean).join(' | ')) +
      '</desc><sym>Scuba Area</sym></wpt>\n';
  });
  if (shown.ramp) RAMPS.filter(vis).forEach(r => {
    g += '<wpt lat="' + r.lat + '" lon="' + r.lon + '"><name>RAMP ' + esc(r.n) + '</name><desc>' +
      esc(r.ln + ' lanes, ' + r.tr + ' trailers, ' + r.h + ', fee ' + r.fee +
      (/Temporar|Closed/i.test(r.st) ? ', ' + r.st : '')) + '</desc><sym>Boat Ramp</sym></wpt>\n';
  });
  if (BRIDGES) BRIDGES.forEach(b => {
    const k = { confirmed: 'bridgeConf', presumed: 'bridgePres', excluded: 'bridgeExcl' }[b.st];
    if (!shown[k] || !vis(b)) return;
    const d = { confirmed: 'CONFIRMED public fishing - 100 yd spearfishing buffer applies',
                presumed: 'UNPOSTED - presume 100 yd spearfishing buffer applies (posting unverified)',
                excluded: 'Limited access, no pedestrians - bridge buffer does not attach; other rules still apply' }[b.st];
    g += '<wpt lat="' + b.lat + '" lon="' + b.lon + '"><name>BRIDGE ' + esc(b.n) + '</name><desc>' +
      esc('over ' + b.o + ' | ' + d) + '</desc><sym>Bridge</sym></wpt>\n';
  });
  if (ENC) ENC.forEach((p, i) => {
    if (!shown[p.k]) return;
    const nm = ENC_STYLE[p.k] ? ENC_STYLE[p.k].n.replace('Unnamed ', '') : p.k;
    g += '<wpt lat="' + p.lat + '" lon="' + p.lon + '"><name>' + esc(p.n || nm + ' ' + (i + 1)) +
      '</name><desc>' + esc('NOAA ENC ' + p.k + (p.cat ? ', ' + p.cat : '') +
      (p.d != null ? ', ' + (p.d * M_FT).toFixed(0) + ' ft' : '')) + '</desc><sym>Shipwreck</sym></wpt>\n';
  });
  save('bottom-truth.gpx', g + '</gpx>\n', 'application/gpx+xml');
}
function downloadCsv() {
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const rows = [['name', 'lat', 'lon', 'depth', 'relief_ft', 'type', 'county', 'material',
    'nm_from_launch', 'bearing_T', 'refuge_area', 'legal_status', 'source', 'notes'].join(',')];
  exportSites().forEach(s => rows.push([
    s.n, s.lat, s.lon, depS(s), s.rel || '', s.t === 'n' ? 'natural' : 'artificial', s.c, s.m || '',
    s.nm == null ? '' : s.nm.toFixed(2), s.nm == null ? '' : brgS(s.brg), s.ref || '',
    s.closed ? 'PROHIBITED - 379.2425 closed area'
      : (s.ref ? 'no spearfishing on scuba' : (s.edge ? 'on a refuge boundary'
        : 'no drawn closure (undrawn rules may apply)')),
    s.src, s.nt].map(q).join(',')));
  save('bottom-truth-sites.csv', rows.join('\n'), 'text/csv');
}


/* ---------- URL parameters, embed mode, public API ---------- */
function applyParams() {
  const q = new URLSearchParams(location.search);
  if (q.get('embed') === '1') document.body.classList.add('embed');
  const cats = q.get('cats');
  if (cats) {
    const want = new Set(cats.split(',').map(x => x.trim()).filter(Boolean));
    CATS.forEach(c => shown[c.id] = want.has(c.id));
  }
  if (q.get('inland') === '1') {
    showInland = true;
    const cb = document.getElementById('inland-cb');
    if (cb) { cb.checked = true; document.getElementById('inland-tog').classList.add('on'); }
  }
  const m = q.get('mode');
  if (m === 'free' || m === 'scuba') {
    mode = m;
    document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  }
  const rn = q.get('ramp');
  let r = null;
  if (rn) r = RAMPS.find(x => x.n.toLowerCase().includes(rn.toLowerCase()));
  return { ramp: r, lat: parseFloat(q.get('lat')), lon: parseFloat(q.get('lon')), zoom: parseInt(q.get('zoom'), 10),
           spot: q.get('spot'), zone: q.get('zone'), law: q.get('law') };
}

window.FLSpearMap = {
  get map() { return map; },
  get sites() { return SITES; },
  get ramps() { return RAMPS; },
  get spots() { return SPOTS; },
  ready: coreReady,
  openZone,
  setMode(m) {
    if (m !== 'scuba' && m !== 'free') return;
    mode = m;
    document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
    SITES.forEach(s => { const c = col(s); const mk = marks[key(s)]; if (mk) mk.setStyle({ color: c, fillColor: c }); });
    render();
  },
  setCategories(ids) {
    const want = new Set(ids);
    CATS.forEach(c => { shown[c.id] = want.has(c.id); if (shown[c.id] && c.src) c.src.forEach(ensure); });
    applyVisibility(); buildLegend(); render();
  },
  categories() { return CATS.map(c => ({ id: c.id, label: c.label, group: c.grp, on: !!shown[c.id] })); },
  setInland(on) { showInland = !!on;
    const cb = document.getElementById('inland-cb');
    if (cb) { cb.checked = showInland; document.getElementById('inland-tog').classList.toggle('on', showInland); }
    applyVisibility(); buildLegend(); render(); },
  setLaunch(nameOrIndex) {
    const r = typeof nameOrIndex === 'number' ? RAMPS[nameOrIndex]
      : RAMPS.find(x => x.n.toLowerCase().includes(String(nameOrIndex).toLowerCase()));
    if (r) setOrigin(r);
    return !!r;
  },
  flyTo(lat, lon, zoom) { map.setView([lat, lon], zoom || 14); },
  /* Lists every drawn legal layer at a point and opens the popup. Resolves with the result. */
  whatsHere(lat, lon) { return whatsHere(lat, lon); },
  /* Same query without opening a popup. */
  queryPoint(lat, lon) { return queryPoint(lat, lon, { extras: true }); },
  openSpot(id) { return openSpot(id); },
  exportGpx: downloadGpx,
  exportCsv: downloadCsv
  /* search(q) is added by js/search.js */
};

boot();
