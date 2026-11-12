/* Bottom Truth: legal citation registry and encyclopedia.
   Every closure, buffer and boundary drawn on this map carries the citation it comes from.
   LAW is loaded from data/law.json (or window.__DATA.law in the standalone build). */
(function () {
  'use strict';
  var LAW = {}, LIST = [], ready = false;
  var esc = function (s) { return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var nl2br = function (s) { return esc(s).replace(/\n/g, '<br>'); };

  var JLABEL = { federal: 'Federal', state: 'Florida state', county: 'County', district: 'Port authorities and special districts', city: 'Municipal' };
  var VLABEL = {
    verbatim:  ['ok',   'Read verbatim from the primary source'],
    secondary: ['warn', 'From a secondary source; citation not confirmed word for word'],
    unverified:['no',   'NOT verified: treat as a lead, not a rule']
  };

  function load(entries) {
    LIST = entries || [];
    LAW = {};
    LIST.forEach(function (e) { LAW[e.id] = e; });
    ready = true;
  }

  /* Compact citation strip appended to a popup. ids = array of law ids.
     label === false drops the "Legal basis" heading (used in the What's here list). */
  function citeBlock(ids, label) {
    if (!ready || !ids || !ids.length) return '';
    var seen = {};
    ids = ids.filter(function (id) { if (!id || seen[id]) return false; seen[id] = 1; return true; });
    var chips = ids.map(function (id) {
      var e = LAW[id];
      if (!e) return '';
      var cls = e.kind === 'negative' ? 'cite-neg' : ('cite-' + (VLABEL[e.verified] || VLABEL.unverified)[0]);
      return '<button class="cite ' + cls + '" data-law="' + esc(id) + '" title="' +
        esc(e.title) + '. Click to open the full entry.">' + esc(e.cite) + '</button>';
    }).join('');
    if (!chips) return '';
    if (label === false) return '<div class="cites cites-c">' + chips + '</div>';
    return '<div class="cites"><span class="cites-h">' + esc(label || 'Legal basis') + '</span>' + chips + '</div>';
  }

  /* Full entry, rendered into the encyclopedia panel. */
  function entryHTML(e, open) {
    var v = VLABEL[e.verified] || VLABEL.unverified;
    var body =
      '<div class="lw-effect">' + nl2br(e.effect) + '</div>' +
      (e.excerpt ? '<blockquote class="lw-q">' + nl2br(e.excerpt) + '</blockquote>' : '') +
      (e.scope ? '<div class="lw-f"><b>Where it applies.</b> ' + nl2br(e.scope) + '</div>' : '') +
      (e.note ? '<div class="lw-f lw-note"><b>Read this.</b> ' + nl2br(e.note) + '</div>' : '') +
      (e.full ? '<details class="lw-full"><summary>Full text and detail</summary><div>' +
        nl2br(e.full) + '</div></details>' : '') +
      '<div class="lw-meta"><span class="v-' + v[0] + '" title="' + esc(v[1]) + '">' + esc(v[1]) + '</span>' +
      (e.url ? ' &middot; <a href="' + esc(e.url) + '" target="_blank" rel="noopener">Read the source text &rarr;</a>' : '') +
      '</div>';
    return '<details class="lw" id="lw-' + esc(e.id) + '"' + (open ? ' open' : '') + '>' +
      '<summary><span class="lw-cite">' + esc(e.cite) + '</span>' +
      '<span class="lw-title">' + esc(e.title) + '</span>' +
      (e.kind === 'negative' ? '<span class="lw-tag lw-tag-neg">no such rule</span>' : '') +
      '</summary><div class="lw-body">' + body + '</div></details>';
  }

  function render(filter, openId) {
    var q = (filter || '').trim().toLowerCase();
    var hits = LIST.filter(function (e) {
      if (!q) return true;
      return (e.cite + ' ' + e.title + ' ' + e.effect + ' ' + (e.excerpt || '') + ' ' +
              (e.scope || '') + ' ' + (e.note || '') + ' ' + (e.full || '')).toLowerCase().indexOf(q) >= 0;
    });
    var order = ['federal', 'state', 'county', 'district', 'city'];
    var html = '';
    order.forEach(function (j) {
      var g = hits.filter(function (e) { return e.juris === j && e.kind !== 'negative'; });
      if (!g.length) return;
      html += '<h4 class="lw-grp">' + JLABEL[j] + '</h4>' +
        g.map(function (e) { return entryHTML(e, e.id === openId); }).join('');
    });
    var neg = hits.filter(function (e) { return e.kind === 'negative'; });
    if (neg.length) {
      html += '<h4 class="lw-grp">Confirmed negatives: rules that do <em>not</em> exist</h4>' +
        '<p class="lw-intro">Rumours cost dives too. These were checked against the primary source and ' +
        'came back empty.</p>' +
        neg.map(function (e) { return entryHTML(e, e.id === openId); }).join('');
    }
    if (!html) html = '<p class="lw-intro">Nothing matches &ldquo;' + esc(filter) + '&rdquo;.</p>';
    return html;
  }

  function open(id) {
    var el = document.getElementById('lawpanel');
    if (!el) return;
    el.classList.add('on');
    var box = el.querySelector('#lw-list');
    var inp = el.querySelector('#lw-q');
    if (id && inp) inp.value = '';
    box.innerHTML = render(id ? '' : (inp ? inp.value : ''), id);
    if (id) {
      var t = document.getElementById('lw-' + id);
      if (t) { t.open = true; t.scrollIntoView({ block: 'center' }); t.classList.add('lw-flash');
               setTimeout(function () { t.classList.remove('lw-flash'); }, 1400); }
    }
  }
  function close() { var el = document.getElementById('lawpanel'); if (el) el.classList.remove('on'); }

  function mount() {
    var el = document.createElement('div');
    el.id = 'lawpanel';
    el.innerHTML =
      '<div class="lw-head"><b>Legal encyclopedia</b>' +
      '<button id="lw-x" title="Close">&times;</button></div>' +
      '<input id="lw-q" type="search" placeholder="Search citations, text, place names…" autocomplete="off">' +
      '<p class="lw-intro">Every zone on this map traces back to one of these. Click a citation ' +
      'anywhere in a popup to jump straight to its entry. Expand any entry for the full text and the ' +
      'link to the official source. <b>Nothing here is legal advice.</b> It is a reading of primary ' +
      'sources, compiled for trip planning, and rules change.</p>' +
      '<div id="lw-list"></div>';
    document.body.appendChild(el);
    el.querySelector('#lw-x').onclick = close;
    var inp = el.querySelector('#lw-q'), t = null;
    inp.oninput = function () {
      clearTimeout(t);
      t = setTimeout(function () { el.querySelector('#lw-list').innerHTML = render(inp.value); }, 120);
    };
    /* Citation chips are created inside Leaflet popups, so delegate from the document. */
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.cite');
      if (b && b.dataset.law) { ev.preventDefault(); open(b.dataset.law); }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') close();
    });
  }

  window.FLLaw = { load: load, cite: citeBlock, open: open, close: close, mount: mount,
                   get: function (id) { return LAW[id]; }, all: function () { return LIST; },
                   count: function () { return LIST.length; } };
})();
