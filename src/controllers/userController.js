const userService = require('../services/userService');


async function getUsers(req, res, next) {
    try {
        const data = await userService.getUsers();
        res.json({ data });
    } catch (err) { next(err); }
}

async function getEvents(req, res, next) {
    try {
        const data = await userService.getUserEvents(req.params.id, req.query.days);
        res.json({ data });
    } catch (err) { next(err); }
}

async function getViewedNotPurchased(req, res, next) {
    try {
        const data = await userService.getViewedNotPurchased(req.params.id);
        res.json({ data });
    } catch (err) { next(err); }
}

async function getCategoryAffinity(req, res, next) {
    try {
        const data = await userService.getCategoryAffinity(req.params.id);
        res.json({ data });
    } catch (err) { next(err); }
}

async function getFunnel(req, res, next) {
    try {
        const data = await userService.getFunnel(req.params.id, req.query);
        res.json({ data });
    } catch (err) { next(err); }
}

module.exports = {
    getUsers,
    getEvents,
    getViewedNotPurchased,
    getCategoryAffinity,
    getFunnel,
};