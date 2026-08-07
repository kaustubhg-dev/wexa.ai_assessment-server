const { getSession } = require('../../config/cognodb');
const neo4j = require('neo4j-driver');

async function getAbandonedCarts(minDays) {
    const session = getSession();
    try {
        const result = await session.executeRead(tx => tx.run(
            `MATCH (u:User)-[:HAS_CART]->(ct:Cart {status: "ACTIVE"})-[c:CONTAINS]->(p:Product)
             WHERE c.addedAt <= datetime() - duration({days: $minDays})
             RETURN u.id AS userId, u.name AS userName,
                    collect(DISTINCT p.name) AS items,
                    min(c.addedAt) AS since`,
            { minDays: neo4j.int(minDays) }
        ));
        return result.records.map(r => ({
            userId: r.get('userId'),
            userName: r.get('userName'),
            items: r.get('items'),
            since: r.get('since').toString(),
        }));
    } finally {
        await session.close();
    }
}

module.exports = {
    getAbandonedCarts,
};