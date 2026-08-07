const { getSession } = require('../../config/cognodb');

async function getUsers() {
    const session = getSession();
    try {
        const result = await session.executeRead(tx => tx.run(
            `MATCH (u:User)
             WHERE u.isSeedHelper IS NULL
             RETURN u.id AS id, u.name AS name, u.email AS email
             ORDER BY u.name`
        ));
        return result.records.map(r => ({
            id: r.get('id'),
            name: r.get('name'),
            email: r.get('email'),
        }));
    } finally {
        await session.close();
    }
}

async function getUserEvents(userId, days) {
    const session = getSession();
    try {
        const result = await session.executeRead(tx => tx.run(
            `MATCH (u:User {id: $userId})-[:PERFORMED]->(e:Event)
             WHERE e.timestamp >= datetime() - duration({days: $days})
             OPTIONAL MATCH (e)-[:ON_PRODUCT]->(p:Product)
             OPTIONAL MATCH (p)-[:BELONGS_TO]->(c:Category)
             RETURN e.type AS eventType, e.timestamp AS ts,
                    p.id AS productId, p.name AS productName, c.name AS category
             ORDER BY e.timestamp DESC`,
            { userId, days: neo4jInt(days) }
        ));
        return result.records.map(r => ({
            eventType: r.get('eventType'),
            ts: r.get('ts').toString(),
            productId: r.get('productId'),
            productName: r.get('productName'),
            category: r.get('category'),
        }));
    } finally {
        await session.close();
    }
}

async function getViewedNotPurchased(userId) {
    const session = getSession();
    try {
        const result = await session.executeRead(tx => tx.run(
            `MATCH (u:User {id: $userId})-[:PERFORMED]->(v:Event {type: "VIEW"})-[:ON_PRODUCT]->(p:Product)
             WHERE NOT EXISTS {
               MATCH (u)-[:PERFORMED]->(:Event {type: "PURCHASE"})-[:ON_PRODUCT]->(p)
             }
             OPTIONAL MATCH (p)-[:OF_BRAND]->(b:Brand)
             RETURN DISTINCT p.id AS productId, p.name AS name, b.name AS brand`,
            { userId }
        ));
        return result.records.map(r => r.toObject());
    } finally {
        await session.close();
    }
}

async function getCategoryAffinity(userId) {
    const session = getSession();
    try {
        const result = await session.executeRead(tx => tx.run(
            `MATCH (u:User {id: $userId})-[:PERFORMED]->(e:Event)-[:ON_PRODUCT]->(:Product)-[:BELONGS_TO]->(c:Category)
             RETURN c.name AS category, count(e) AS engagement
             ORDER BY engagement DESC`,
            { userId }
        ));
        return result.records.map(r => ({
            category: r.get('category'),
            engagement: r.get('engagement').toNumber(),
        }));
    } finally {
        await session.close();
    }
}

async function getFunnel(userId, viewedCategory, purchasedCategory, windowDays) {
    const session = getSession();
    try {
        const result = await session.executeRead(tx => tx.run(
            `MATCH (u:User {id: $userId})-[:PERFORMED]->(view:Event {type:"VIEW"})-[:ON_PRODUCT]->(p1:Product)-[:BELONGS_TO]->(c:Category {name: $viewedCategory})
             MATCH (p1)-[:OF_BRAND]->(b1:Brand)
             MATCH (u)-[:PERFORMED]->(wish:Event {type:"ADD_TO_WISHLIST"})-[:ON_PRODUCT]->(p2:Product)-[:OF_BRAND]->(b2:Brand)
             WHERE b1.name = b2.name AND wish.timestamp > view.timestamp
             MATCH (u)-[:PERFORMED]->(buy:Event {type:"PURCHASE"})-[:ON_PRODUCT]->(p3:Product)-[:BELONGS_TO]->(:Category {name: $purchasedCategory})
             WHERE buy.timestamp > wish.timestamp
               AND duration.between(view.timestamp, buy.timestamp).days <= $windowDays
             RETURN u.name AS user, p1.name AS viewed, p2.name AS wishlisted, p3.name AS purchased`,
            { userId, viewedCategory, purchasedCategory, windowDays: neo4jInt(windowDays) }
        ));
        return result.records.map(r => r.toObject());
    } finally {
        await session.close();
    }
}

// small helper so callers can pass plain JS numbers into duration()/limit params
function neo4jInt(n) {
    const neo4j = require('neo4j-driver');
    return neo4j.int(n);
}

module.exports = {
    getUsers,
    getUserEvents,
    getViewedNotPurchased,
    getCategoryAffinity,
    getFunnel,
};