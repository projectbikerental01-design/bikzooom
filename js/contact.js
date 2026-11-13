(function () {
  'use strict';
  var BZ = window.BZ, $ = BZ.$, esc = BZ.esc;

  function render(s) {
    var rows = [
      ['phone', 'Call', '<a href="tel:+' + BZ.digits(s.phone) + '">' + esc(s.phone) + '</a>'],
      ['chat', 'WhatsApp', s.whatsapp ? '<a href="https://wa.me/' + BZ.digits(s.whatsapp) + '" target="_blank" rel="noopener">Message us</a>' : ''],
      ['mail', 'Email', '<a href="mailto:' + esc(s.email) + '">' + esc(s.email) + '</a>'],
      ['pin', 'Showroom', esc(s.address)],
      ['clock', 'Opening hours', esc(s.hours)],
      ['link', 'Instagram', s.instagram ? '<a href="' + esc(BZ.safeUrl(s.instagram)) + '" target="_blank" rel="noopener">Follow us</a>' : ''],
      ['link', 'Facebook', s.facebook ? '<a href="' + esc(BZ.safeUrl(s.facebook)) + '" target="_blank" rel="noopener">Visit page</a>' : '']
    ].filter(function (r) { return r[2]; });
    $('#clist').innerHTML = rows.map(function (r) { return '<li>' + BZ.icon(r[0]) + '<div><b>' + r[1] + '</b><span>' + r[2] + '</span></div></li>'; }).join('');
    $('#map').innerHTML = '<iframe title="Showroom location" loading="lazy" src="https://www.google.com/maps?q=' + encodeURIComponent(s.mapQuery || s.address) + '&output=embed"></iframe>';
    var faq = [
      ['What do I need to rent a bike?', 'Your Aadhaar card, a valid two-wheeler driving licence, and you must be 18 or older. You enter the details on the booking form and show the originals at handover.'],
      ['Do I pay online?', 'No. The booking form only sends us a request. After we verify it, you pay the rental and deposit at handover.'],
      ['What is the minimum rental?', s.minHours + ' hours. Up to ' + s.maxDays + ' days per booking.'],
      ['Can you deliver the bike?', s.deliveryEnabled ? 'Yes, home delivery costs ' + BZ.inr(s.deliveryFee) + ' and you choose it on the booking form. You can also collect from the showroom for free.' : 'Right now bikes are collected from the showroom only.'],
      ['What if I return late?', 'A late fee of ' + BZ.inr(s.lateFeePerHour) + ' per extra hour applies. Call us if you need more time.'],
      ['What about fuel?', s.fuelPolicy]
    ];
    $('#faq').innerHTML = faq.map(function (f) { return '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>'; }).join('');
  }

  BZ.init().then(function (s) {
    render(s);
    $('#mf').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!BZ.ready) return BZ.toast('Firebase is not configured yet.', 'err');
      var name = $('#m-name').value.trim(), email = $('#m-email').value.trim(), phone = BZ.digits($('#m-phone').value), msg = $('#m-msg').value.trim();
      if (name.length < 2) return BZ.toast('Please enter your name.', 'err');
      if (!/^[^@ ]+@[^@ ]+[.][^@ ]+$/.test(email)) return BZ.toast('Please enter a valid email.', 'err');
      if (msg.length < 5) return BZ.toast('Please write a short message.', 'err');
      var btn = $('#m-btn'); btn.disabled = true; btn.textContent = 'Sending...';
      db.ref('messages').push(BZ.clean({ name: name, email: email, phone: phone.slice(0, 15), message: msg, seen: false, createdAt: BZ.TS }))
        .then(function () { $('#mf').reset(); BZ.toast('Message sent. We will reply by email.'); })
        .catch(BZ.dbError).then(function () { btn.disabled = false; btn.textContent = 'Send message'; });
    });
  });
})();
