const categoryService = require('../services/categoryService');


async function getCategories(req, res, next) {
    try {
        const data = await categoryService.getCategories()
        res.json({ data });
    } catch (err) { next(err); }
}

module.exports = {getCategories}
