const cartRepository = require('../repositories/cartRepository');

async function getAbandonedCarts(minDays) {
    const parsedMinDays = Number(minDays) > 0 ? Number(minDays) : 7; // default threshold
    return cartRepository.getAbandonedCarts(parsedMinDays);
}

module.exports = {
    getAbandonedCarts,
};