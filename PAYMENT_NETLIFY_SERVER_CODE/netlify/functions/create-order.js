const { createOrder, run } = require('../lib/payment');
exports.handler = run(createOrder);
