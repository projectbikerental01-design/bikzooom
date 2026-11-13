/* Shared helpers + header/footer for all public pages */
(function () {
  'use strict';
  var BZ = (window.BZ = window.BZ || {});

  BZ.DEFAULTS = {
    businessName: 'Bikzooom',
    tagline: 'Rent a bike by the hour or by the day.',
    phone: '+91 98765 43210', whatsapp: '919876543210', email: 'support@bikzooom.in',
    address: 'Bikzooom Showroom, Model Town Road, Hoshiarpur, Punjab 146001',
    hours: 'Every day, 8:00 am to 9:00 pm', mapQuery: '', instagram: '', facebook: '',
    about: 'Bikzooom is a local bike rental service. Everyday commuters, Royal Enfields and premium sports bikes, all serviced and insured.',
    minHours: 2, maxDays: 30, deliveryEnabled: true, deliveryFee: 150, lateFeePerHour: 100,
    fuelPolicy: 'Bikes are handed over with some fuel. Please return with the same level.',
    announcement: ''
  };

  BZ.STATUS = {
    pending:   { label: 'Awaiting verification', short: 'Pending' },
    approved:  { label: 'Verified', short: 'Verified' },
    active:    { label: 'On the road', short: 'On rent' },
    completed: { label: 'Completed', short: 'Completed' },
    rejected:  { label: 'Not approved', short: 'Rejected' },
    cancelled: { label: 'Cancelled', short: 'Cancelled' }
  };

  /* ---------- tiny helpers ---------- */
  BZ.$ = function (s, r) { return (r || document).querySelector(s); };
  BZ.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  BZ.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  BZ.inr = function (n) { return '\u20B9' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 }); };
  BZ.fmtDT = function (ms) {
    if (!ms) return '';
    return new Date(ms).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };
  BZ.fmtD = function (ms) { return ms ? new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; };
  BZ.safeUrl = function (u) {
    try { var x = new URL(String(u || '').trim()); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : ''; } catch (e) { return ''; }
  };
  BZ.toList = function (obj) {
    return Object.keys(obj || {}).map(function (k) { var o = obj[k]; return (o && typeof o === 'object') ? Object.assign({ id: k }, o) : { id: k, value: o }; });
  };
  BZ.clean = function (o) {
    var r = {};
    Object.keys(o).forEach(function (k) { var v = o[k]; if (v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && isNaN(v))) r[k] = v; });
    return r;
  };
  BZ.digits = function (s) { return String(s || '').replace(/\D/g, ''); };
  BZ.phone10 = function (s) {
    var d = BZ.digits(s);
    if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
    if (d.length === 11 && d[0] === '0') d = d.slice(1);
    return d;
  };
  BZ.genCode = function () {
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '', arr = new Uint32Array(10);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    for (var i = 0; i < 10; i++) out += A[arr[i] % A.length];
    return 'BZ-' + out.slice(0, 5) + '-' + out.slice(5);
  };
  BZ.normCode = function (s) {
    var c = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (c.indexOf('BZ') === 0 && c.length === 12) return 'BZ-' + c.slice(2, 7) + '-' + c.slice(7);
    return String(s || '').toUpperCase().trim();
  };
  BZ.debounce = function (fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; };

  var ICONS = {
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.5 7.3L3 20.5l1.8-5.3A8.4 8.4 0 1 1 21 11.5z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'
  };
  BZ.icon = function (n) {
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';
  };

  BZ.PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#E4E9E5"/><g fill="none" stroke="#9AA6A0" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><circle cx="110" cy="190" r="42"/><circle cx="290" cy="190" r="42"/><path d="M110 190l50-70h60l30 70M160 120l-10-20h-30M220 120l20-25h30"/></g><text x="200" y="272" text-anchor="middle" font-family="Arial" font-size="18" fill="#7A867F">Photo not available</text></svg>');
  BZ.photo = function (url, alt) {
    var u = BZ.safeUrl(url);
    return '<span class="imgbox' + (u ? '' : ' broken') + '"><img src="' + BZ.esc(u || BZ.PLACEHOLDER) + '" alt="' + BZ.esc(alt || '') +
      '" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=BZ.PLACEHOLDER;this.parentNode.classList.add(\'broken\')"></span>';
  };

  /* ---------- toast ---------- */
  BZ.toast = function (msg, type) {
    var box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, type === 'err' ? 6000 : 3800);
  };

  /* ---------- pricing ---------- */
  BZ.calcPrice = function (bike, startMs, endMs, o) {
    o = o || {};
    var s = o.settings || {};
    var minH = Number(s.minHours) || 1;
    var raw = Math.max(0, Math.ceil((endMs - startMs) / 3600000));
    var hours = Math.max(raw, minH);
    var hourly = Number(bike.hourlyPrice) || 0, daily = Number(bike.dailyPrice) || 0;
    var days = Math.floor(hours / 24), rem = hours - days * 24;
    var base = days * daily + (rem > 0 ? Math.min(rem * hourly, daily) : 0);
    var discount = o.percent ? Math.round(base * o.percent / 100) : 0;
    var delivery = o.delivery ? (Number(s.deliveryFee) || 0) : 0;
    var label = (days ? days + (days === 1 ? ' day' : ' days') : '') + (days && rem ? ' + ' : '') + (rem ? rem + (rem === 1 ? ' hour' : ' hours') : '');
    return { hours: hours, days: days, rem: rem, base: base, discount: discount, delivery: delivery, total: base - discount + delivery, deposit: Number(bike.deposit) || 0, label: label };
  };

  /* ---------- layout ---------- */
  var NAV = [['index.html', 'Home', 'home'], ['bikes.html', 'Our bikes', 'bikes'], ['track.html', 'Track booking', 'track'], ['contact.html', 'Contact', 'contact']];
  var LOGO = '<svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="#FFC800"/><circle cx="32" cy="32" r="17" fill="none" stroke="#0E5A3C" stroke-width="5"/><circle cx="32" cy="32" r="4" fill="#0E5A3C"/><path d="M32 15v9M32 40v9M15 32h9M40 32h9" stroke="#0E5A3C" stroke-width="3"/></svg>';
  BZ.LOGO = LOGO;

  function renderHeader(name) {
    var page = document.body.getAttribute('data-page');
    var h = document.getElementById('site-header'); if (!h) return;
    h.innerHTML = '<header class="site-head"><div class="wrap head-in">' +
      '<a class="brand" href="index.html" aria-label="' + BZ.esc(name) + ' home">' + LOGO + '<span>' + BZ.esc(name) + '</span></a>' +
      '<nav class="main-nav" id="mainNav" aria-label="Main">' +
      NAV.map(function (n) { return '<a href="' + n[0] + '"' + (n[2] === page ? ' aria-current="page"' : '') + '>' + n[1] + '</a>'; }).join('') +
      '<a class="btn btn-yellow nav-cta" href="bikes.html">Book a bike</a></nav>' +
      '<button class="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="mainNav"><span></span><span></span><span></span></button>' +
      '</div></header>';
    var btn = BZ.$('.menu-btn', h);
    btn.addEventListener('click', function () {
      var o = document.body.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
  }

  function renderFooter(s) {
    var f = document.getElementById('site-footer'); if (!f) return;
    var wa = BZ.digits(s.whatsapp);
    f.innerHTML = '<footer class="site-foot"><div class="wrap foot-grid">' +
      '<div><a class="brand brand-w" href="index.html">' + LOGO + '<span>' + BZ.esc(s.businessName) + '</span></a><p class="foot-about">' + BZ.esc(s.about) + '</p></div>' +
      '<div><h4>Visit</h4><p>' + BZ.esc(s.address) + '</p><p>' + BZ.esc(s.hours) + '</p></div>' +
      '<div><h4>Talk to us</h4><p><a href="tel:' + BZ.esc(BZ.digits(s.phone).length ? '+' + BZ.digits(s.phone) : '') + '">' + BZ.esc(s.phone) + '</a></p>' +
      '<p><a href="mailto:' + BZ.esc(s.email) + '">' + BZ.esc(s.email) + '</a></p>' +
      (s.instagram ? '<p><a href="' + BZ.esc(BZ.safeUrl(s.instagram)) + '" target="_blank" rel="noopener">Instagram</a></p>' : '') +
      (s.facebook ? '<p><a href="' + BZ.esc(BZ.safeUrl(s.facebook)) + '" target="_blank" rel="noopener">Facebook</a></p>' : '') + '</div>' +
      '<div><h4>Pages</h4>' + NAV.map(function (n) { return '<p><a href="' + n[0] + '">' + n[1] + '</a></p>'; }).join('') + '<p><a href="admin/index.html">Staff login</a></p></div>' +
      '</div><div class="wrap foot-base"><span>\u00A9 ' + new Date().getFullYear() + ' ' + BZ.esc(s.businessName) + '. Bike photos from Wikimedia Commons contributors.</span></div></footer>' +
      (wa ? '<a class="wa-float" href="https://wa.me/' + wa + '?text=' + encodeURIComponent('Hi ' + s.businessName + ', I have a question about renting a bike.') + '" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">' + BZ.icon('chat') + '<span>Chat</span></a>' : '');
  }

  function renderAnnouncement(s) {
    var old = document.getElementById('announce'); if (old) old.remove();
    if (!s.announcement) return;
    var d = document.createElement('div'); d.id = 'announce'; d.className = 'announce';
    d.innerHTML = '<div class="wrap">' + BZ.esc(s.announcement) + '</div>';
    document.body.insertBefore(d, document.body.firstChild);
  }

  function configBanner() {
    var d = document.createElement('div'); d.className = 'cfg-banner';
    d.innerHTML = '<strong>Firebase is not connected yet.</strong> Open <code>js/config.js</code> and paste your Firebase web-app details, then reload. See README.md for the 10-minute setup.';
    document.body.insertBefore(d, document.body.firstChild);
  }

  BZ.init = function () {
    renderHeader(BZ.DEFAULTS.businessName);
    renderFooter(BZ.DEFAULTS);
    BZ.settings = Object.assign({}, BZ.DEFAULTS);
    function apply() {
      renderHeader(BZ.settings.businessName); renderFooter(BZ.settings); renderAnnouncement(BZ.settings);
      return BZ.settings;
    }
    if (!BZ.ready) { configBanner(); return Promise.resolve(BZ.settings); }
    return db.ref('settings/public').once('value').then(function (snap) {
      BZ.settings = Object.assign({}, BZ.DEFAULTS, snap.val() || {});
    }).catch(function (e) { console.warn('settings load failed', e); }).then(apply);
  };

  BZ.dbError = function (e) {
    console.error(e);
    var m = (e && e.code === 'PERMISSION_DENIED') ? 'Permission denied by database rules. Publish database.rules.json in Firebase Console.' : 'Could not reach the database. Check your connection and js/config.js.';
    BZ.toast(m, 'err');
  };
})();
