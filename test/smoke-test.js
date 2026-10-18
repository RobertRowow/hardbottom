#!/usr/bin/env node
/* Boot smoke test for the map in jsdom, fully offline.

     NODE_PATH=/path/to/node_modules node test/smoke-test.js            (served files)
     NODE_PATH=/path/to/node_modules node test/smoke-test.js --standalone
     NODE_PATH=/path/to/node_modules node test/smoke-test.js --lite

   Needs jsdom (npm install jsdom) somewhere on NODE_PATH; it is not a dependency of the site.
   index.html and js/*.js load from disk through file:// URLs. fetch() is replaced by a reader for
   data/*.json; any other URL (tiles, ERDDAP) is refused, which is expected offline. Canvas drawing
   is stubbed, and the map container is given a size. Exit status 1 on any failed check. */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const MODE = process.argv.includes('--lite') ? 'lite' : (process.argv.includes('--standalone') ? 'standalone' : 'served');
const FILE = MODE === 'served' ? 'index.html'
  : (MODE === 'lite' ? 'bottom-truth-offline-lite.html' : 'bottom-truth-offline.html');

const errors = [], results = [];
let failed = 0;
function check(name, ok, detail) {
  results.push((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  (' + detail + ')' : ''));
  if (!ok) failed++;
}
process.on('unhandledRejection', e => errors.push('unhandled rejection: ' + (e && e.stack || e)));

const vc = new VirtualConsole();
vc.on('jsdomError', e => {
  const m = String(e && e.message || e);
  if (/Not implemented: (HTMLCanvasElement|window\.scrollTo|HTMLMediaElement)/.test(m)) return;
  if (/Could not load img/.test(m)) return;
  errors.push('jsdomError: ' + m + (e.detail ? ' ' + (e.detail.stack || e.detail) : ''));
});
vc.on('error', (...a) => errors.push('console.error: ' + a.map(String).join(' ')));
const warns = [];
vc.on('warn', (...a) => warns.push(a.map(String).join(' ')));

const fetched = [];
function fakeCtx() {
  const noop = () => {};
  return new Proxy({}, {
    get: (t, k) => (k in t ? t[k] : (k === 'measureText' ? () => ({ width: 10 }) : (k === 'getLineDash' ? () => [] : noop))),
    set: (t, k, v) => { t[k] = v; return true; }
  });
}

const dom = new JSDOM(fs.readFileSync(path.join(ROOT, FILE), 'utf8'), {
  url: 'file://' + path.join(ROOT, FILE) + '?ramp=Phil%20Foster',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () { return this._ctx || (this._ctx = fakeCtx()); };
    for (const [k, v] of [['clientWidth', 1200], ['clientHeight', 800], ['offsetWidth', 1200], ['offsetHeight', 800]]) {
      Object.defineProperty(window.HTMLElement.prototype, k, { configurable: true, get() { return v; } });
    }
    window.innerWidth = 1280; window.innerHeight = 900;
    /* browsers have these; jsdom does not */
    if (!window.Element.prototype.scrollIntoView) window.Element.prototype.scrollIntoView = function () {};
    window.fetch = url => {
      url = String(url);
      fetched.push(url);
      const m = /^(?:\.\/)?data\/([a-z0-9-]+\.json)$/.exec(url);
      if (!m) return Promise.reject(new window.TypeError('offline test: no network for ' + url));
      const f = path.join(ROOT, 'data', m[1]);
      if (!fs.existsSync(f)) return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error('404')) });
      const txt = fs.readFileSync(f, 'utf8');
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(txt)) });
    };
    window.addEventListener('error', e => errors.push('window error: ' + (e.error && e.error.stack || e.message)));
  }
});
const w = dom.window;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms, what) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (fn()) return true; } catch (e) {}
    await sleep(50);
  }
  throw new Error('timed out waiting for ' + what);
}
const text = sel => { const e = w.document.querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };

(async () => {
  const t0 = Date.now();
  try {
    await until(() => w.FLSpearMap && w.document.getElementById('load') === null, 30000, 'boot');
    await w.FLSpearMap.ready;
    await sleep(300);
    check('boot: map created and loading screen removed', !!w.FLSpearMap.map, (Date.now() - t0) + ' ms');

    /* notice */
    const nt = text('#notice');
    check('notice: persistent, has the required sentences',
      /Not legal advice · Not for navigation/.test(nt) && /Unshaded water is not shown as open/.test(nt) &&
      /Boundaries are approximate\. NOT FOR NAVIGATION\./.test(nt) && !w.document.getElementById('caution'));
    check('notice: law.json version date shown', /Rules current as of 8 Oct 2026/.test(nt), nt.match(/Rules current as of[^.]*?20\d\d/) ? nt.match(/Rules current as of[^.]*?20\d\d/)[0] : 'no date');
    check('notice: no dismiss control', !w.document.querySelector('#notice [title="Dismiss"]'));

    /* base layers */
    const L = w.FLLayers;
    check('layers: panel installed, satellite is the default base',
      !!L && L.bases().some(b => b.id === 'sat' && b.on), L ? L.bases().filter(b => b.on).map(b => b.id).join() : 'no FLLayers');
    check('layers: no Esri or CARTO base without a key', L && !L.bases().some(b => /esri|dark/.test(b.id)));
    const ids = L ? L.overlays().map(o => o.id) : [];
    check('layers: 12 overlays, all off', ids.length === 12 && L.overlays().every(o => !o.on), ids.join(','));
    let noHotlink = true;
    w.FLSpearMap.map.eachLayer(l => { if (l._url && /arcgisonline|cartocdn/.test(l._url)) noHotlink = false; });
    check('layers: no unlicensed hotlinked tiles on the map', noHotlink);
    const satU = L.under('sat'), m = w.FLSpearMap.map;
    check('layers: Sentinel-2 drawn beneath the satellite base, below it',
      !!satU && m.hasLayer(satU) && m.hasLayer(L.layer('sat')) && /s2cloudless/.test(satU._url) &&
      satU.options.zIndex < L.layer('sat').options.zIndex, satU ? satU.options.zIndex + ' vs ' + L.layer('sat').options.zIndex : 'none');
    L.setBase('chart');
    check('layers: switching base removes the satellite and its fill', !m.hasLayer(satU) && !m.hasLayer(L.layer('sat')));
    L.setBase('sat');
    const chart = L.layer('chart');
    check('layers: chart tiles use zoomOffset -2', chart && chart.options.zoomOffset === -2 && chart.options.maxNativeZoom === 16);
    /* simulated failing overlay marks itself unavailable */
    L.setOverlay('relief', true);
    const rl = L.layer('relief');
    for (let i = 0; i < 17; i++) rl.fire('tileerror', { tile: {}, coords: {} });
    await sleep(20);
    const rel = L.overlays().find(o => o.id === 'relief');
    check('layers: an overlay whose tiles fail marks itself unavailable', rel.unavailable && !rel.on &&
      /Unavailable/.test(text('#layerpanel')));
    const sst = L.layer('sst');
    check('layers: ERDDAP WMS uses EPSG:4326', sst && sst.options.crs === w.L.CRS.EPSG4326 && sst.wmsParams.layers === 'jplMURSST41:analysed_sst');

    /* legend */
    await until(() => w.document.querySelectorAll('#legend .lg-row').length > 30, 5000, 'legend');
    const rows = [...w.document.querySelectorAll('#legend [data-cat]')].map(b => b.dataset.cat);
    const want = ['spots', 'fishhaven', 'rock', 'encarea', 'seabed', 'contour', 'hbsw', 'buoy', 'station', 'encr', 'mpa',
      'fedfish', 'mil', 'manatee', 'stateareas', 'nwr', 'local', 'fed', 'covNone', 'covPart', 'covFull'];
    const miss = want.filter(x => !rows.includes(x));
    check('legend: new rows present', !miss.length, miss.length ? 'missing ' + miss.join(',') : rows.length + ' rows');
    const grps = [...w.document.querySelectorAll('#legend .lg-grp')].map(b => b.textContent);
    check('legend: six collapsible groups', grps.length === 6 && /Reference, not the law/.test(grps.join('|')), grps.join(' | '));
    await until(() => /\d/.test(text('#legend [data-cat="spots"] em')), 10000, 'spots count');
    check('legend: spot count', text('#legend [data-cat="spots"] em') === '283', text('#legend [data-cat="spots"] em'));
    await until(() => /\d/.test(text('#legend [data-cat="mil"] em')), 10000, 'statewide zones count');
    check('legend: statewide zone counts', text('#legend [data-cat="mil"] em') === '94' && text('#legend [data-cat="manatee"] em') === '26',
      'mil ' + text('#legend [data-cat="mil"] em') + ', manatee ' + text('#legend [data-cat="manatee"] em'));
    check('legend: coverage note attached', !!w.document.querySelector('#legend .lg-note-cov'));

    /* switching on a lazy row loads its data */
    const sb = w.document.querySelector('#legend [data-cat="seabed"]');
    const sbMissing = sb.classList.contains('missing');
    if (MODE === 'lite') {
      check('lite build: seabed row says not included', sbMissing && /not included in this offline build/.test(sb.textContent));
    } else {
      sb.click();
      await until(() => /\d/.test(text('#legend [data-cat="seabed"] em')), 15000, 'seabed load');
      check('lazy load: seabed loads on first switch-on', true, text('#legend [data-cat="seabed"] em'));
    }
    if (MODE !== 'served') {
      const mr = w.document.querySelector('#legend [data-cat="mpa"]');
      check('standalone: reference rows say not included in this offline build',
        mr.classList.contains('missing') && /not included in this offline build/.test(mr.textContent));
    }

    /* search */
    const r1 = await w.FLSpearMap.search('Oriskany');
    const hit = r1.find(r => r.type === 'spot' && r.id === 'uss-oriskany');
    check('search("Oriskany") returns the spot', !!hit, r1.slice(0, 4).map(r => r.type + ':' + r.name).join(' | '));
    const r2 = await w.FLSpearMap.search('26 46.9 N 80 02.7 W');
    check('search parses degrees and decimal minutes', r2[0] && r2[0].type === 'coord' &&
      Math.abs(r2[0].lat - 26.78167) < 1e-4 && Math.abs(r2[0].lon + 80.045) < 1e-4, r2[0] && r2[0].name);
    const r3 = await w.FLSpearMap.search('26.78, -80.04');
    check('search parses decimal degrees', r3[0] && r3[0].type === 'coord' && r3[0].lat === 26.78 && r3[0].lon === -80.04);
    const r4 = await w.FLSpearMap.search('hogfish');
    check('search finds a species', r4.some(r => r.type === 'species'), r4.filter(r => r.type === 'species').map(r => r.name).join(', '));
    const r5 = await w.FLSpearMap.search('379.2425');
    check('search finds a law entry by citation', r5.some(r => r.type === 'law' && r.id === 'fs-379-2425'));
    const r6 = await w.FLSpearMap.search('Western Sambo');
    check('search finds a zone by name', r6.some(r => r.type === 'zone' && /Western Sambo/.test(r.name)),
      r6.map(r => r.type + ':' + r.name).slice(0, 5).join(' | '));
    check('search results capped at 40', (await w.FLSpearMap.search('reef')).length <= 40);
    /* selecting a spot result opens its popup */
    hit.select();
    await sleep(400);
    const pop = text('.leaflet-popup-content');
    check('selecting the spot opens its popup', /USS Oriskany/.test(pop) && /Legal layers at this point/.test(pop), pop.slice(0, 80));
    await until(() => !/Checking every drawn legal layer/.test(text('.leaflet-popup-content')), 15000, 'spot legal block');
    const pop2 = text('.leaflet-popup-content');
    const permissive = pop2.replace(/does not mean spearfishing is legal at this spot/g, '')
      .match(/(open to spear\w*|you may spear|spear\w* is (legal|allowed|permitted|ok)|legal to spear)/i);
    check('spot popup: legal block filled, no permissive wording',
      /No researched closure covers this point|Closed at this point|Restricted at this point/.test(pop2) && !permissive,
      permissive ? 'found: ' + permissive[0] : (pop2.match(/No researched closure[^.]*\.|Closed at this point|Restricted at this point/) || [''])[0]);
    w.FLSpearMap.map.closePopup();

    /* What's here */
    const a = await w.FLSpearMap.whatsHere(24.46, -81.87);
    const at = x => x.map(i => i.n).join('; ');
    check('whatsHere(24.46, -81.87): returns a result with legal content',
      !!a && (a.closed.length + a.restrict.length + a.near.length) > 0,
      'closed [' + at(a.closed) + '] restricted [' + at(a.restrict) + '] near [' + a.near.map(n => n.n + ' ' + Math.round(n.d) + ' m').join('; ') + ']');
    /* The brief calls 24.46, -81.87 the Western Sambo area. It is Sand Key: about 156 m east of the
       drawn Sand Key SPA edge and inside the Key West NWR, which is drawn as a restriction. So the
       result must name a closure, but within the near band, not at the point itself. */
    check('whatsHere(24.46, -81.87): result names at least one closure (at the point or within 300 m)',
      a.closed.length > 0 || a.near.some(n => /Sanctuary Preservation Area|Reserve/.test(n.n)),
      a.closed.length ? 'at point: ' + at(a.closed) : 'within 300 m: ' + a.near.map(n => n.n).join('; '));
    const b = await w.FLSpearMap.whatsHere(24.48345, -81.70375);
    check('whatsHere at the Western Sambo spot lists the Ecological Reserve as closed',
      b.closed.some(i => /Western Sambo/.test(i.n)), at(b.closed));
    const wp = text('.leaflet-popup-content');
    check('whatsHere popup lists closures with citation chips', /Closed at this point/.test(wp) &&
      !!w.document.querySelector('.leaflet-popup-content .cite'));
    const c = await w.FLSpearMap.whatsHere(27.2, -79.6);
    check('whatsHere offshore with no drawn closure gives the required caution',
      c.closed.length === 0 && /No researched closure covers this point\. That does not mean the water is open/.test(text('.leaflet-popup-content')));
    const pb = await w.FLSpearMap.whatsHere(26.7735, -80.034);
    check('whatsHere inside the Lake Worth Inlet lists the county inlet ban and a buffer', pb.closed.length >= 2, at(pb.closed));
    const jt = await w.FLSpearMap.whatsHere(30.40281, -81.39479);
    check('whatsHere on the St. Johns north jetty lists the traced jetty buffer', jt.closed.some(i => /St\. Johns.*jetty/i.test(i.n)), at(jt.closed));
    const jx = await w.FLSpearMap.whatsHere(30.40110, -81.37900);
    check('whatsHere on the long-jetty stretch does not list the jetty buffer', !jx.closed.some(i => /St\. Johns.*north jetty/i.test(i.n)), at(jx.closed));
    const br = await w.FLSpearMap.whatsHere(27.87926, -82.58237);
    check('whatsHere at the west end of the Gandy Bridge deck lists the bridge buffer (3.9 km from the NBI point)', br.closed.some(i => /US-92/.test(i.n)), at(br.closed));
    const bh = await w.FLSpearMap.whatsHere(29.25357, -81.01878);
    check('whatsHere off the Daytona surf line lists the beach buffer', bh.closed.some(i => /Volusia County beach/.test(i.n)), at(bh.closed));
    check('whatsHere extras: nearest spot and state-waters distance', !!(b.spot && b.sw), (b.spot ? b.spot.n : '-') + ', ' + (b.sw ? Math.round(b.sw.d) + ' m' : '-'));

    /* species panel */
    w.document.getElementById('spbtn').click();
    await until(() => w.document.querySelectorAll('#sp-list details').length > 50, 5000, 'species list');
    const nSp = w.document.querySelectorAll('#sp-list details').length;
    check('species panel lists species', nSp === 91, nSp + ' cards');
    const spText = text('#spanel');
    check('species panel: disclaimer at the top', /Not legal advice/.test(text('#sp-head')));
    check('species panel: "allowed" never shown in green; neutral wording', /Spear not excluded as gear; limits and closures apply/.test(spText) &&
      !w.document.querySelector('#spanel .sp-b.b-ok, #spanel .sp-neu[style*="green"]'));
    w.document.querySelector('#spanel [data-sp="prohibited"]').click();
    const nPro = w.document.querySelectorAll('#sp-list details').length;
    check('species panel: Prohibited chip filters', nPro === 32, nPro + ' cards');
    await w.FLSpecies.open('nassau-grouper');
    check('species panel: open at a species', w.document.getElementById('sp-nassau-grouper') && w.document.getElementById('sp-nassau-grouper').open);
    w.document.querySelector('#sp-nassau-grouper .cite').click();
    await sleep(50);
    check('species citation chip opens the encyclopedia', w.document.getElementById('lawpanel').classList.contains('on') &&
      !w.document.getElementById('spanel').classList.contains('on'));
    w.FLLaw.close();

    /* law.js fallback */
    check('law.js: unknown verification status falls back to unverified',
      /VLABEL\[e\.verified\] \|\| VLABEL\.unverified/.test(fs.readFileSync(path.join(ROOT, 'js/law.js'), 'utf8')) &&
      !/VLABEL\.verbatim\)/.test(fs.readFileSync(path.join(ROOT, 'js/law.js'), 'utf8')));

    /* ?spot= */
    const opened = await w.FLSpearMap.openSpot('western-sambo');
    await sleep(200);
    check('openSpot / ?spot= opens a spot popup', opened && /Western Sambo/.test(text('.leaflet-popup-content')));

    /* contact and support dialog (js/support.js) */
    w.FLSpearMap.map.closePopup();
    check('support: no dialog before it is asked for', !w.document.querySelector('#support:not([hidden])'));
    w.document.getElementById('contactbtn').click();
    const sp = w.document.getElementById('support');
    const spT = text('#support');
    check('support: Contact button opens the dialog with the contact address',
      sp && !sp.hidden && /contact@bottomtruth\.com/.test(spT) && /Not legal advice/.test(spT));
    check('support: no tip link and no third-party frame or script while TIP_URL is empty',
      !/Leave a tip/.test(spT) && !sp.querySelector('iframe, script') && !/ko-fi/i.test(sp.innerHTML));
    const ml = w.document.getElementById('sp-mail');
    ml.addEventListener('click', e => e.preventDefault(), { once: true });
    ml.click();
    check('support: email link carries the subject and the map view', /^mailto:contact@bottomtruth\.com\?subject=/.test(ml.href) &&
      /Map%20view%3A%20/.test(ml.href), ml.href.slice(0, 90));
    let spMem = null; try { spMem = w.localStorage.getItem('bt-support-shown'); } catch (e) { spMem = 'storage unavailable'; }
    check('support: opening is remembered so it does not reappear for 60 days', !!spMem, String(spMem));
    sp.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    check('support: Escape closes the dialog', sp.hidden);

    /* public API still there */
    const api = ['setMode', 'setCategories', 'categories', 'setInland', 'setLaunch', 'flyTo', 'exportGpx', 'exportCsv', 'search', 'whatsHere'];
    check('FLSpearMap API complete', api.every(k => typeof w.FLSpearMap[k] === 'function'));
    w.FLSpearMap.setCategories(['natural', 'closure']);
    check('setCategories still works', w.FLSpearMap.categories().filter(c => c.on).length === 2);
  } catch (e) {
    errors.push('test harness: ' + (e && e.stack || e));
  }
  await sleep(200);
  const remote = fetched.filter(u => !/^(\.\/)?data\//.test(u));
  console.log('smoke test (' + MODE + ': ' + FILE + ')\n');
  results.forEach(r => console.log('  ' + r));
  if (remote.length) console.log('\n  remote requests refused offline (expected): ' + [...new Set(remote.map(u => u.replace(/\?.*/, '')))].join(', '));
  if (warns.length) console.log('\n  console warnings: ' + warns.length + (warns.length ? ' (first: ' + warns[0].slice(0, 160) + ')' : ''));
  if (errors.length) {
    console.log('\n  UNCAUGHT ERRORS (' + errors.length + '):');
    errors.slice(0, 20).forEach(e => console.log('    ' + String(e).split('\n').slice(0, 4).join('\n      ')));
  } else console.log('\n  no uncaught errors');
  const bad = failed + errors.length;
  console.log('\n' + (bad ? 'FAILED: ' + failed + ' check(s), ' + errors.length + ' error(s)' : 'all checks passed'));
  w.close();
  process.exit(bad ? 1 : 0);
})();
