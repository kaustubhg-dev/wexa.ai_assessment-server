const recommendationService = require('../services/recommendationsService');

async function getRecommendations(req, res, next) {
    try {
        const data = await recommendationService.getRecommendations(req.params.id, req.query.limit);
        res.json({ data });
    } catch (err) { next(err); }
}

async function explain(req, res, next) {
    try {
        const data = await recommendationService.explainRecommendation(req.params.productId, req.query.userId);
        res.json({ data });
    } catch (err) { next(err); }
}

module.exports = {
    getRecommendations,
    explain,
};