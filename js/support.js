/* Contact and support dialog.

   Opens from the Contact button in the header, from a link to #contact, and once on its own after
   the visitor has used the map for a while (SHOW_AFTER_MS, or SHOW_AFTER_CLICKS clicks on the map).
   After it has been shown it stays away for QUIET_DAYS, remembered in localStorage.

   No third-party script or frame is loaded: the email button is a mailto link and the tip button,
   when TIP_URL is set, is a plain link. That keeps the privacy statement on the About page true. */
(function () {
  'use strict';

  var EMAIL = 'contact@bottomtruth.com';
  /* Leave empty until the Ko-fi page exists; set to its address (https://ko-fi.com/...) to show the
     tip paragraph and button. Nothing else needs to change. */
  var TIP_URL = '';
  var SHOW_AFTER_MS = 3 * 60 * 1000;
  var SHOW_AFTER_CLICKS = 5;
  var QUIET_DAYS = 60;
  var KEY = 'bt-support-shown';

  var box = null, lastFocus = null, clicks = 0, timer = null, autoDone = false, memShown = 0;

  function stored() {
    try { return +localStorage.getItem(KEY) || 0; } catch (e) { return memShown; }
  }
  function remember() {
    memShown = Date.now();
    try { localStorage.setItem(KEY, String(memShown)); } catch (e) {}
  }
  function quiet() { return Date.now() - stored() < QUIET_DAYS * 864e5; }

  /* The map view, so an emailed report says where the sender was looking. */
  function viewLine() {
    try {
      if (typeof map === 'undefined' || !map || !map.getCenter) return '';
      var c = map.getCenter();
      return 'Map view: ' + c.lat.toFixed(5) + ', ' + c.lng.toFixed(5) + ' (zoom ' + map.getZoom() + ')';
    } catch (e) { return ''; }
  }
  function mailHref() {
    var body = '\n\n\n' + (viewLine() || '') + '\nPage: ' + location.href.split('#')[0];
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Bottom Truth: correction or suggestion') +
      '&body=' + encodeURIComponent(body);
  }

  function build() {
    box = document.createElement('div');
    box.id = 'support';
    box.hidden = true;
    box.innerHTML =
      '<div class="sp-card" role="dialog" aria-modal="true" aria-labelledby="sp-h">' +
      '<button type="button" class="sp-x" aria-label="Close">&times;</button>' +
      '<h3 id="sp-h">Help keep this map accurate</h3>' +
      '<p>Bottom Truth is free, has no ads, and is researched by one person. Divers who know a stretch ' +
      'of coast are the best way to find what it gets wrong.</p>' +
      '<p>Email <a class="sp-addr" href="mailto:' + EMAIL + '">' + EMAIL + '</a> with:</p>' +
      '<ul><li>a posted sign or closure the map shows differently, with the location and a photo if you have one</li>' +
      '<li>a rule or local ordinance the map is missing</li>' +
      '<li>tips, suggestions and anything that would make the map more useful on a dive day</li></ul>' +
      '<p class="sp-dim">No account is needed. Each report is checked against the official source before ' +
      'the map changes, and corrections are listed in the changelog.</p>' +
      (TIP_URL ?
        '<p>If you want to help with costs, you can leave a tip. Tips pay for the domain and for trips to ' +
        'photograph posted closure signs. A tip is a gift: it buys no service and no say in where a line is drawn.</p>' : '') +
      '<div class="sp-btns">' +
      '<a class="hbtn sp-go" id="sp-mail" href="mailto:' + EMAIL + '">Email a correction or tip</a>' +
      (TIP_URL ? '<a class="hbtn" href="' + TIP_URL + '" target="_blank" rel="noopener">Leave a tip</a>' : '') +
      '<button type="button" class="hbtn sp-close">Not now</button>' +
      '</div>' +
      '<p class="sp-dim sp-fine">Not legal advice. Posted signs govern.</p>' +
      '</div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('.sp-x, .sp-close')) close();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      /* keep keyboard focus inside the dialog while it is open */
      var f = box.querySelectorAll('a[href], button');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    /* fill in the map view at the moment the visitor clicks, not when the dialog was built */
    box.querySelector('#sp-mail').addEventListener('click', function () { this.href = mailHref(); });
    box.querySelector('.sp-addr').addEventListener('click', function () { this.href = mailHref(); });
  }

  function open() {
    if (!box) build();
    if (!box.hidden) return;
    lastFocus = document.activeElement;
    box.hidden = false;
    remember();
    var b = box.querySelector('.sp-go');
    if (b) b.focus();
  }
  function close() {
    if (!box || box.hidden) return;
    box.hidden = true;
    if (location.hash === '#contact') {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* The automatic showing waits for a calm moment: not while typing, not over an open side panel. */
  function busy() {
    var a = document.activeElement;
    if (a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) return true;
    /* an open side panel or map popup means the visitor is reading something */
    return !!document.querySelector('#lawpanel.on, #spanel.on, .leaflet-popup');
  }
  function autoShow() {
    if (autoDone) return;
    if (quiet()) { autoDone = true; return; }
    if (busy()) { clearTimeout(timer); timer = setTimeout(autoShow, 20000); return; }
    autoDone = true;
    clearTimeout(timer);
    open();
  }

  function init() {
    var hb = document.getElementById('contactbtn');
    if (hb) hb.addEventListener('click', function (e) { e.preventDefault(); open(); });
    if (location.hash === '#contact') open();
    window.addEventListener('hashchange', function () { if (location.hash === '#contact') open(); });
    if (quiet()) return;
    timer = setTimeout(autoShow, SHOW_AFTER_MS);
    var m = document.getElementById('map');
    if (m) m.addEventListener('click', function () {
      if (++clicks >= SHOW_AFTER_CLICKS) setTimeout(autoShow, 1500);
    });
  }

  window.BTSupport = { open: open, close: close };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
