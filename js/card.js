/* Bike card used on home + fleet pages */
(function () {
  'use strict';
  var BZ = window.BZ, esc = BZ.esc;
  BZ.bikeCard = function (b) {
    var off = b.available === false;
    var chips = [b.cc ? b.cc + ' cc' : '', b.fuel, b.transmission, b.mileage].filter(Boolean);
    var href = 'booking.html?bike=' + encodeURIComponent(b.id);
    return '<article class="bike' + (off ? ' is-off' : '') + '">' +
      '<a class="bike-pic" href="' + href + '" tabindex="-1" aria-hidden="true">' + BZ.photo(b.image, b.name) +
      (b.category ? '<span class="tag">' + esc(b.category) + '</span>' : '') + (off ? '<span class="off-flag">Out on rent</span>' : '') + '</a>' +
      '<div class="bike-body"><h3>' + esc(b.name) + '</h3>' +
      (b.brand ? '<p class="brand">' + esc(b.brand) + '</p>' : '') +
      (chips.length ? '<ul class="chips">' + chips.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' : '') +
      '<div class="rates"><span class="plate"><b>' + BZ.inr(b.hourlyPrice) + '</b> per hour</span><span class="plate"><b>' + BZ.inr(b.dailyPrice) + '</b> per day</span></div>' +
      (off ? '<span class="btn btn-off btn-block">Not available right now</span>' : '<a class="btn btn-green btn-block" href="' + href + '">Rent this bike</a>') +
      '</div></article>';
  };
})();
