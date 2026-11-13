const { verifyPayment, run } = require('../lib/payment');
exports.handler = run(verifyPayment);
