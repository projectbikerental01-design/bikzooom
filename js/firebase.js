/* Firebase bootstrap (compat SDK). Reads values from js/config.js */
(function () {
  'use strict';
  var BZ = (window.BZ = window.BZ || {});
  var c = (window.BZ_CONFIG && window.BZ_CONFIG.firebase) || {};
  BZ.ready = !!(c.apiKey && c.databaseURL && !/PASTE|YOUR_PROJECT/i.test(c.apiKey + c.databaseURL));
  if (!BZ.ready || typeof firebase === 'undefined') { BZ.ready = false; return; }
  firebase.initializeApp(c);
  window.db = firebase.database();
  if (firebase.auth) window.auth = firebase.auth();
  BZ.TS = firebase.database.ServerValue.TIMESTAMP;
})();
