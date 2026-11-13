/* Bikzooom payment logic for Netlify Functions.
   Keys come from Netlify environment variables (never from files in the website):
   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, FIREBASE_SERVICE_ACCOUNT (service account JSON), FIREBASE_DATABASE_URL */
const admin = require('firebase-admin');
const crypto = require('crypto');

if (!admin.apps.length) {
  let cred;
  try { cred = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || ''); } catch (e) { cred = null; }
  if (cred) admin.initializeApp({ credential: admin.credential.cert(cred), databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://bikzooom-default-rtdb.firebaseio.com' });
}
const db = { ref: (p) => { if (!admin.apps.length) throw Object.assign(new Error('Server is missing FIREBASE_SERVICE_ACCOUNT.'), { status: 500 }); return admin.database().ref(p); } };
const KEY_ID = { value: () => process.env.RAZORPAY_KEY_ID || '' };
const KEY_SECRET = { value: () => process.env.RAZORPAY_KEY_SECRET || '' };

const DEFAULTS = { minHours: 2, maxDays: 30, deliveryEnabled: true, deliveryFee: 150 };

function fail(status, message) { const e = new Error(message); e.status = status; return e; }
function str(v, max) { return String(v == null ? '' : v).trim().slice(0, max); }
function digits(s) { return String(s || '').replace(/\D/g, ''); }
function phone10(s) {
  let d = digits(s);
  if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
  if (d.length === 11 && d[0] === '0') d = d.slice(1);
  return d;
}
function genCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let out = '';
  for (let i = 0; i < 10; i++) out += A[crypto.randomInt(A.length)];
  return 'BZ-' + out.slice(0, 5) + '-' + out.slice(5);
}

/* same maths as BZ.calcPrice in js/common.js, but run on the server so the customer cannot change the price */
function calcPrice(bike, s, e, settings, percent, delivery) {
  const minH = Number(settings.minHours) || 1;
  const hours = Math.max(Math.max(0, Math.ceil((e - s) / 3600000)), minH);
  const hourly = Number(bike.hourlyPrice) || 0, daily = Number(bike.dailyPrice) || 0;
  const days = Math.floor(hours / 24), rem = hours - days * 24;
  const base = days * daily + (rem > 0 ? Math.min(rem * hourly, daily) : 0);
  const discount = percent ? Math.round(base * percent / 100) : 0;
  const fee = delivery ? (Number(settings.deliveryFee) || 0) : 0;
  return { base, discount, delivery: fee, total: base - discount + fee, deposit: Number(bike.deposit) || 0, hours };
}

async function razorpay(path, body) {
  if (!KEY_ID.value() || !KEY_SECRET.value()) throw fail(500, 'Payment keys are not configured on the server.');
  const auth = Buffer.from(KEY_ID.value() + ':' + KEY_SECRET.value()).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1' + path, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw fail(401, 'Razorpay rejected the API keys.');
  if (!res.ok) throw fail(500, (data.error && data.error.description) || 'Razorpay error');
  return data;
}

/* ---------- POST /api/create-order ---------- */
async function createOrder(b) {
  const start = Number(b.start), end = Number(b.end), now = Date.now();
  const handover = b.handover === 'delivery' ? 'delivery' : 'pickup';
  if (!b.bikeId || !start || !end) throw fail(400, 'Missing booking details.');

  const [bikeSnap, setSnap, availSnap] = await Promise.all([
    db.ref('bikes/' + str(b.bikeId, 60).replace(/[.#$\[\]\/]/g, '')).once('value'),
    db.ref('settings/public').once('value'),
    db.ref('availability/' + str(b.bikeId, 60).replace(/[.#$\[\]\/]/g, '')).once('value')
  ]);
  const bike = bikeSnap.val();
  if (!bike || bike.available === false) throw fail(400, 'This bike is not available.');
  const settings = Object.assign({}, DEFAULTS, setSnap.val() || {});

  if (start < now - 3600000) throw fail(400, 'Pickup time is in the past.');
  if (end <= start) throw fail(400, 'Return must be after pickup.');
  if ((end - start) < settings.minHours * 3600000) throw fail(400, 'Minimum rental is ' + settings.minHours + ' hours.');
  if ((end - start) > settings.maxDays * 86400000) throw fail(400, 'Maximum rental is ' + settings.maxDays + ' days.');
  if (handover === 'delivery' && settings.deliveryEnabled === false) throw fail(400, 'Home delivery is not available.');
  const clash = Object.values(availSnap.val() || {}).some((x) => x && x.start < end && x.end > start);
  if (clash) throw fail(409, 'This bike is already booked for those times.');

  let percent = 0, coupon = '';
  const code = str(b.coupon, 24).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (code) {
    const c = (await db.ref('coupons/' + code).once('value')).val();
    if (c && c.active && c.percent > 0) { percent = Number(c.percent); coupon = code; }
  }
  const pricing = calcPrice(bike, start, end, settings, percent, handover === 'delivery');
  const orderKey = db.ref('orders').push().key;
  const record = {
    bikeId: str(b.bikeId, 60), bikeName: str(bike.name, 80), bikeImage: str(bike.image, 2000), category: str(bike.category, 30),
    start, end, handover, coupon, pricing, status: 'created', createdAt: admin.database.ServerValue.TIMESTAMP
  };

  if (pricing.total < 1) { // fully covered by a coupon: nothing to pay
    await db.ref('orders/free_' + orderKey).set(record);
    return { free: true, orderId: 'free_' + orderKey, amount: 0, currency: 'INR' };
  }
  const amount = Math.round(pricing.total * 100);
  if (amount < 100) throw fail(400, 'Amount must be at least 100 paise.');
  const order = await razorpay('/orders', { amount, currency: 'INR', receipt: ('bz_' + orderKey).slice(0, 40) });
  await db.ref('orders/' + order.id).set(Object.assign(record, { amountPaise: amount }));
  return { order_id: order.id, amount: order.amount, currency: order.currency, keyId: KEY_ID.value() };
}

/* ---------- POST /api/verify-payment ---------- */
async function verifyPayment(b) {
  const orderId = str(b.razorpay_order_id, 60), paymentId = str(b.razorpay_payment_id, 60), signature = str(b.razorpay_signature, 128);
  const isFree = orderId.indexOf('free_') === 0;
  if (!orderId || (!isFree && (!paymentId || !signature))) throw fail(400, 'Missing payment fields.');

  const ref = db.ref('orders/' + orderId);
  const order = (await ref.once('value')).val();
  if (!order) throw fail(404, 'Order not found.');
  if (order.status === 'booked') return { success: true, code: order.code }; // retry-safe

  if (isFree) {
    if (order.pricing.total >= 1) throw fail(400, 'This order needs a payment.');
  } else {
    const expected = crypto.createHmac('sha256', KEY_SECRET.value()).update(orderId + '|' + paymentId).digest('hex');
    const a = Buffer.from(expected), s = Buffer.from(signature);
    if (a.length !== s.length || !crypto.timingSafeEqual(a, s)) throw fail(400, 'Payment signature does not match.');
  }

  const c = b.customer || {};
  const customer = {
    fullName: str(c.fullName, 80), phone: phone10(c.phone), email: str(c.email, 100), dob: str(c.dob, 10), address: str(c.address, 300), city: str(c.city, 60),
    pincode: str(c.pincode, 6), aadhaar: digits(c.aadhaar), licenseNo: str(c.licenseNo, 25).toUpperCase(), emergencyName: str(c.emergencyName, 80), emergencyPhone: phone10(c.emergencyPhone)
  };
  const bad = customer.fullName.length < 2 || !/^[6-9][0-9]{9}$/.test(customer.phone) || !/^[^@ ]+@[^@ ]+[.][^@ ]+$/.test(customer.email) || customer.dob.length < 8 ||
    customer.address.length < 8 || customer.city.length < 2 || !/^[0-9]{6}$/.test(customer.pincode) || !/^[2-9][0-9]{11}$/.test(customer.aadhaar) ||
    customer.licenseNo.length < 5 || customer.emergencyName.length < 2 || !/^[6-9][0-9]{9}$/.test(customer.emergencyPhone);
  if (bad) throw fail(400, 'Some customer details are invalid.');

  const p = order.pricing;
  let code = genCode();
  while ((await db.ref('tracking/' + code).once('value')).exists()) code = genCode();
  const id = db.ref('bookings').push().key;
  const TS = admin.database.ServerValue.TIMESTAMP;
  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ''));

  const booking = clean({
    bikeId: order.bikeId, bikeName: order.bikeName, bikeImage: order.bikeImage, category: order.category, start: order.start, end: order.end,
    handover: order.handover, deliveryAddress: order.handover === 'delivery' ? str(b.deliveryAddress, 300) : '', customerNote: str(b.customerNote, 300),
    pricing: Object.assign(clean({ base: p.base, total: p.total, deposit: p.deposit, hours: p.hours, coupon: order.coupon }), { discount: p.discount, delivery: p.delivery }),
    customer: clean(customer), status: 'pending', code, createdAt: TS,
    payment: { id: isFree ? 'free' : paymentId, orderId, status: isFree ? 'free' : 'paid', amount: p.total, verified: true, paidAt: TS }
  });
  const track = clean({ status: 'pending', bikeName: order.bikeName, bikeImage: order.bikeImage, start: order.start, end: order.end, total: p.total, deposit: p.deposit, handover: order.handover, firstName: customer.fullName.split(' ')[0].slice(0, 40), createdAt: TS });

  await db.ref().update({ ['bookings/' + id]: booking, ['tracking/' + code]: track, ['orders/' + orderId + '/status']: 'booked', ['orders/' + orderId + '/code']: code });
  return { success: true, code };
}


/* wraps a function so Netlify gets a proper JSON response, with CORS for your website only */
function allowed(origin) {
  const list = (process.env.ALLOWED_ORIGINS || '').split(',').map((x) => x.trim().replace(/\/+$/, '')).filter(Boolean);
  return origin && list.indexOf(origin.replace(/\/+$/, '')) >= 0 ? origin : '';
}
function run(fn) {
  return async (event) => {
    const origin = allowed((event.headers || {}).origin || (event.headers || {}).Origin || '');
    const cors = origin ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' } : { 'Vary': 'Origin' };
    const json = (status, obj) => ({ statusCode: status, headers: Object.assign({ 'Content-Type': 'application/json' }, cors), body: JSON.stringify(obj) });
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
    try {
      if (!origin) throw fail(403, 'This website is not allowed to use the payment server.');
      if (event.httpMethod !== 'POST') throw fail(405, 'Use POST.');
      let body = {};
      try { body = JSON.parse(event.body || '{}'); } catch (e) { throw fail(400, 'Invalid request.'); }
      return json(200, await fn(body));
    } catch (e) {
      const status = e.status || 500;
      if (status >= 500) console.error(e);
      return json(status, { error: status >= 500 && !e.status ? 'Server error' : e.message });
    }
  };
}

module.exports = { createOrder, verifyPayment, run };
