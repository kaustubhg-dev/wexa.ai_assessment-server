const { getSession } = require('../../config/cognodb');
const neo4j = require('neo4j-driver');

async function getNextPurchaseRecommendations(userId, limit = 5) {
    const session = getSession();
    try {
        const result = await session.executeRead(tx => tx.run(
            `MATCH (u:User {id: $userId})-[:PLACED]->(:Order)-[:CONTAINS]->(bought:Product)-[r:CO_PURCHASED_WITH]->(rec:Product)
             WHERE NOT EXISTS {
               MATCH (u)-[:PLACED]->(:Order)-[:CONTAINS]->(rec)
             }
             OPTIONAL MATCH (rec)-[:OF_BRAND]->(b:Brand)
             RETURN rec.id AS productId, rec.name AS name, b.name AS brand,
                    max(r.confidence) AS confidence
             ORDER BY confidence DESC
             LIMIT $limit`,
            { userId, limit: neo4j.int(limit) }
        ));
        return result.records.map(r => ({
            productId: r.get('productId'),
            name: r.get('name'),
            brand: r.get('brand'),
            confidence: r.get('confidence'),
        }));
    } finally {
        await session.close();
    }
}

async function explainRecommendation(userId, productId) {
    const session = getSession();
    try {
        const result = await session.executeRead(tx => tx.run(
            `MATCH path = (u:User {id: $userId})-[:PERFORMED]->(:Event)-[:ON_PRODUCT]->(:Product)-[:CO_PURCHASED_WITH]->(rec:Product {id: $productId})
             RETURN [n IN nodes(path) | coalesce(n.name, n.type)] AS chain
             LIMIT 1`,
            { userId, productId }
        ));
        if (result.records.length === 0) return null;
        return { explanationChain: result.records[0].get('chain') };
    } finally {
        await session.close();
    }
}

module.exports = {
    getNextPurchaseRecommendations,
    explainRecommendation,
};