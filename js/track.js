(function () {
  'use strict';
  var BZ = window.BZ, $ = BZ.$, esc = BZ.esc, ref = null;

  function recent() {
    var list = []; try { list = JSON.parse(localStorage.getItem('bz_codes') || '[]'); } catch (e) {}
    $('#recent').innerHTML = list.length ? '<h3 class="mt">Your recent bookings on this device</h3><div class="recent">' +
      list.map(function (r) { return '<button type="button" class="chip" data-code="' + esc(r.code) + '">' + esc(r.code) + ' - ' + esc(r.bike) + '</button>'; }).join('') + '</div>' : '';
  }

  function stepsFor(t) {
    var del = t.handover === 'delivery';
    return [
      ['Request received', 'We have your form.'],
      ['Verification', 'We are checking your details.'],
      [del ? 'Out for delivery' : 'Ready for pickup', del ? 'The bike is on its way to your address.' : 'Collect it from our showroom.'],
      ['Completed', 'Bike returned. Thanks for riding with us.']
    ];
  }
  function stage(st) { return { pending: 1, approved: 2, active: 2, completed: 3 }[st]; }

  function show(t, code) {
    var st = t.status, meta = BZ.STATUS[st] || { label: st };
    var html = '<div class="track-card"><div class="track-top">' + BZ.photo(t.bikeImage, t.bikeName) +
      '<div><p class="muted">Booking ' + esc(code) + '</p><h2>' + esc(t.bikeName) + '</h2><span class="pill s-' + esc(st) + '">' + esc(meta.label) + '</span></div></div>';
    if (st === 'rejected' || st === 'cancelled') {
      html += '<div class="note-box bad"><b>' + (st === 'rejected' ? 'We could not approve this booking.' : 'This booking was cancelled.') + '</b>' + (t.message ? '<p>' + esc(t.message) + '</p>' : '') +
        '<p>You can submit a new request or contact us for help.</p></div>';
    } else {
      var cur = stage(st), steps = stepsFor(t);
      html += '<ol class="timeline">' + steps.map(function (s, i) {
        return '<li class="' + (i < cur ? 'done' : i === cur ? 'now' : '') + '"><b>' + s[0] + '</b><span>' + s[1] + '</span></li>';
      }).join('') + '</ol>';
      if (t.message) html += '<div class="note-box"><b>Message from Bikzooom</b><p>' + esc(t.message) + '</p></div>';
    }
    html += '<dl class="kv"><div><dt>Pickup</dt><dd>' + esc(BZ.fmtDT(t.start)) + '</dd></div><div><dt>Return</dt><dd>' + esc(BZ.fmtDT(t.end)) + '</dd></div>' +
      '<div><dt>Handover</dt><dd>' + (t.handover === 'delivery' ? 'Delivery to your address' : 'Pickup from showroom') + '</dd></div>' +
      '<div><dt>Rental amount (paid online)</dt><dd>' + BZ.inr(t.total) + '</dd></div><div><dt>Refundable deposit</dt><dd>' + BZ.inr(t.deposit) + '</dd></div></dl></div>';
    $('#result').innerHTML = html;
  }

  function lookup(raw) {
    var code = BZ.normCode(raw);
    $('#code').value = code;
    if (ref) { ref.off(); ref = null; }
    if (!/^BZ-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/.test(code)) { $('#result').innerHTML = '<p class="note-box bad">That code does not look right. Check it and try again.</p>'; return; }
    $('#result').innerHTML = '<p class="muted">Looking up...</p>';
    ref = db.ref('tracking/' + code);
    ref.on('value', function (s) {
      if (!s.exists()) { $('#result').innerHTML = '<p class="note-box bad">No booking found for ' + esc(code) + '. Check the code in your confirmation.</p>'; return; }
      show(s.val(), code);
    }, function (e) { BZ.dbError(e); });
  }

  BZ.init().then(function () {
    recent();
    $('#tf').addEventListener('submit', function (e) { e.preventDefault(); if (BZ.ready) lookup($('#code').value); });
    $('#recent').addEventListener('click', function (e) { var b = e.target.closest('[data-code]'); if (b && BZ.ready) lookup(b.dataset.code); });
    var c = new URLSearchParams(location.search).get('code');
    if (c && BZ.ready) lookup(c);
  });
})();
