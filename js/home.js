(function () {
  'use strict';
  var BZ = window.BZ, $ = BZ.$, esc = BZ.esc;

  function mapSrc(s) { return 'https://www.google.com/maps?q=' + encodeURIComponent(s.mapQuery || s.address) + '&output=embed'; }

  function renderStatic(s) {
    $('#hero-lead').textContent = s.tagline;
    $('#policies').innerHTML =
      '<li><b>Refundable deposit.</b> Each bike has its own deposit, shown before you book. It is returned when the bike comes back undamaged.</li>' +
      '<li><b>Minimum rental:</b> ' + esc(s.minHours) + ' hours. Beyond that, you pay by the hour up to the day rate, so you never pay more than one day for a day.</li>' +
      '<li><b>Late return:</b> ' + BZ.inr(s.lateFeePerHour) + ' for every extra hour.</li>' +
      '<li><b>Fuel:</b> ' + esc(s.fuelPolicy) + '</li>';
    $('#visit-addr').textContent = s.address;
    $('#visit-hours').textContent = s.hours;
    $('#visit-phone').innerHTML = '<a href="tel:+' + BZ.digits(s.phone) + '">' + esc(s.phone) + '</a>';
    $('#map').innerHTML = '<iframe title="Showroom location" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="' + esc(mapSrc(s)) + '"></iframe>';
  }

  function render(bikes) {
    var live = bikes.filter(function (b) { return b.available !== false; });
    // Every bike ticked "Show on the home page" is shown (newest change first).
    // Only if none are ticked do we fall back to the first 3 available bikes.
    var feat = live.filter(function (b) { return b.featured === true; }).sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    if (!feat.length) feat = live.slice(0, 3);

    $('#hero-photos').innerHTML = feat.slice(0, 2).map(function (b, i) {
      return '<figure class="print p' + i + '">' + BZ.photo(b.image, b.name) + '<figcaption>' + esc(b.name) + '</figcaption></figure>';
    }).join('');

    var min = bikes.length ? Math.min.apply(null, bikes.map(function (b) { return Number(b.hourlyPrice) || 0; })) : 0;
    var cats = {};
    bikes.forEach(function (b) { var c = b.category || 'Other'; (cats[c] = cats[c] || []).push(b); });
    $('#stones').innerHTML =
      stone(bikes.length, 'bikes in the fleet') + stone(Object.keys(cats).length, 'bike types') + stone(bikes.length ? BZ.inr(min) : '-', 'per hour, starting');

    $('#featured').innerHTML = feat.length ? feat.map(BZ.bikeCard).join('') : '<p class="empty">Bikes will appear here once they are added from the admin panel.</p>';

    $('#cats').innerHTML = Object.keys(cats).sort().map(function (c) {
      var m = Math.min.apply(null, cats[c].map(function (b) { return Number(b.hourlyPrice) || 0; }));
      return '<a class="cat" href="bikes.html?cat=' + encodeURIComponent(c) + '"><b>' + esc(c) + '</b><span>' + cats[c].length + (cats[c].length === 1 ? ' bike' : ' bikes') + ', from ' + BZ.inr(m) + '/hr</span></a>';
    }).join('');
  }
  function stone(n, label) { return '<div class="stone"><div class="stone-top"></div><div class="stone-body"><b>' + esc(n) + '</b><span>' + esc(label) + '</span></div></div>'; }

  BZ.init().then(function (s) {
    renderStatic(s);
    if (!BZ.ready) return;
    db.ref('bikes').on('value', function (snap) { render(BZ.toList(snap.val())); }, BZ.dbError);
  });
})();
