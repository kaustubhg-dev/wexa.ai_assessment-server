const recommendationRepository = require('../repositories/recommendationRepository');

async function getRecommendations(userId, limit) {
    const parsedLimit = Number(limit) > 0 ? Number(limit) : 5;
    return recommendationRepository.getNextPurchaseRecommendations(userId, parsedLimit);
}

async function explainRecommendation(productId, userId) {
    if (!userId) {
        const err = new Error('userId query param is required');
        err.status = 400;
        throw err;
    }
    const explanation = await recommendationRepository.explainRecommendation(userId, productId);
    if (!explanation) {
        const err = new Error('No explanation path found for this user/product pair');
        err.status = 404;
        throw err;
    }
    return explanation;
}

module.exports = {
    getRecommendations,
    explainRecommendation,
};