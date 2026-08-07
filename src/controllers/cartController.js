const cartService = require('../services/cartService');

async function getAbandoned(req, res, next) {
    try {
        const data = await cartService.getAbandonedCarts(req.query.minDays);
        res.json({ data });
    } catch (err) { next(err); }
}

module.exports = {
    getAbandoned,
};