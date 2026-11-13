(function () {
  'use strict';
  var BZ = window.BZ, $ = BZ.$, esc = BZ.esc;
  var all = [], cat = new URLSearchParams(location.search).get('cat') || 'All', q = '', sort = 'recommended';

  function draw() {
    var cats = ['All'].concat(Array.from(new Set(all.map(function (b) { return b.category || 'Other'; }))).sort());
    $('#filters').innerHTML = cats.map(function (c) {
      return '<button type="button" class="chip' + (c === cat ? ' on' : '') + '" data-c="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
    var list = all.filter(function (b) {
      var okC = cat === 'All' || (b.category || 'Other') === cat;
      var hay = (b.name + ' ' + (b.brand || '') + ' ' + (b.category || '')).toLowerCase();
      return okC && (!q || hay.indexOf(q) >= 0);
    });
    list.sort(function (a, b) {
      if (sort === 'low') return a.hourlyPrice - b.hourlyPrice;
      if (sort === 'high') return b.hourlyPrice - a.hourlyPrice;
      if ((a.available === false) !== (b.available === false)) return a.available === false ? 1 : -1;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.name.localeCompare(b.name);
    });
    $('#count').textContent = list.length + (list.length === 1 ? ' bike' : ' bikes');
    $('#grid').innerHTML = list.length ? list.map(BZ.bikeCard).join('') :
      '<p class="empty">' + (all.length ? 'No bikes match your search. Clear the filters to see the full fleet.' : 'No bikes have been added yet.') + '</p>';
  }

  BZ.init().then(function () {
    $('#filters').addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (b) { cat = b.dataset.c; draw(); } });
    $('#q').addEventListener('input', BZ.debounce(function (e) { q = e.target.value.trim().toLowerCase(); draw(); }, 150));
    $('#sort').addEventListener('change', function (e) { sort = e.target.value; draw(); });
    if (!BZ.ready) { $('#grid').innerHTML = '<p class="empty">Connect Firebase in js/config.js to load the fleet.</p>'; return; }
    db.ref('bikes').on('value', function (snap) { all = BZ.toList(snap.val()); draw(); }, BZ.dbError);
  });
})();
