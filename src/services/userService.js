const userRepository = require('../repositories/userRepository');


async function getUsers(params) {
    return userRepository.getUsers()
}

async function getUserEvents(userId, days) {
    const parsedDays = Number(days) > 0 ? Number(days) : 50; // default window
    return userRepository.getUserEvents(userId, parsedDays);
}

async function getViewedNotPurchased(userId) {
    return userRepository.getViewedNotPurchased(userId);
}

async function getCategoryAffinity(userId) {
    return userRepository.getCategoryAffinity(userId);
}

async function getFunnel(userId, { viewedCategory, purchasedCategory, days }) {
    if (!viewedCategory || !purchasedCategory) {
        const err = new Error('viewedCategory and purchasedCategory query params are required');
        err.status = 400;
        throw err;
    }
    const windowDays = Number(days) > 0 ? Number(days) : 30;
    return userRepository.getFunnel(userId, viewedCategory, purchasedCategory, windowDays);
}

module.exports = {
    getUsers,
    getUserEvents,
    getViewedNotPurchased,
    getCategoryAffinity,
    getFunnel,
};