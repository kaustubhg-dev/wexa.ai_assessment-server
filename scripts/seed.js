/**
 * seed.js
 * Seeds a small, fully-deterministic dataset: 7 real users, each guaranteed
 * to have the SAME complete set of data — events, a viewed-not-purchased
 * item, category engagement, a funnel-eligible journey, an abandoned cart,
 * and a valid recommendation + explanation path.
 *
 * Because every user follows the identical pattern, ANY of U101..U107 works
 * with the same test queries — easy to demo, easy to pick a user at random
 * and have it just work.
 *
 * A handful of hidden "helper" accounts (isSeedHelper: true) also get
 * created purely to generate realistic co-purchase statistics behind the
 * scenes. They're excluded from GET /api/users so the admin list stays
 * exactly 7 clean, testable users.
 *
 * Run: node scripts/seed.js --wipe
 */

require('dotenv').config();
const { connectGraphDB, getSession, closeConnection } = require('../config/cognodb');
const logger = require('../src/utils/logger');

const WIPE = process.argv.includes('--wipe');
const REAL_USER_COUNT = 7;
const HELPER_COUNT = 5;

// ---------- catalog ----------

const BRANDS = [
    { id: 'B101', name: 'Apple' },
    { id: 'B102', name: 'Samsung' },
    { id: 'B103', name: 'Sony' },
    { id: 'B104', name: 'Dell' },
    { id: 'B105', name: 'OnePlus' },
    { id: 'B106', name: 'Bose' },
    { id: 'B107', name: 'Lenovo' },
];

const CATEGORIES = [
    { id: 'C101', name: 'Mobiles' },
    { id: 'C102', name: 'Laptops' },
    { id: 'C103', name: 'Accessories' },
    { id: 'C104', name: 'Headphones' },
    { id: 'C105', name: 'Wearables' },
    { id: 'C106', name: 'Tablets' },
];

const PRODUCTS = [
    { id: 'P101', name: 'iPhone 16', type: 'Smartphone', price: 89999, brandId: 'B101', categoryId: 'C101' },
    { id: 'P102', name: 'Galaxy S25', type: 'Smartphone', price: 79999, brandId: 'B102', categoryId: 'C101' },
    { id: 'P110', name: 'OnePlus 13', type: 'Smartphone', price: 64999, brandId: 'B105', categoryId: 'C101' },
    { id: 'P103', name: 'MacBook Air', type: 'Laptop', price: 114900, brandId: 'B101', categoryId: 'C102' },
    { id: 'P104', name: 'MacBook Pro', type: 'Laptop', price: 169900, brandId: 'B101', categoryId: 'C102' },
    { id: 'P105', name: 'XPS 13', type: 'Laptop', price: 99990, brandId: 'B104', categoryId: 'C102' },
    { id: 'P111', name: 'ThinkPad X1', type: 'Laptop', price: 109990, brandId: 'B107', categoryId: 'C102' },
    { id: 'P106', name: 'AirPods Pro', type: 'Earbuds', price: 24900, brandId: 'B101', categoryId: 'C104' },
    { id: 'P109', name: 'WH-1000XM5', type: 'Headphones', price: 29990, brandId: 'B103', categoryId: 'C104' },
    { id: 'P112', name: 'QuietComfort Ultra', type: 'Headphones', price: 27900, brandId: 'B106', categoryId: 'C104' },
    { id: 'P107', name: 'Magic Mouse', type: 'Accessory', price: 7900, brandId: 'B101', categoryId: 'C103' },
    { id: 'P108', name: 'Laptop Sleeve', type: 'Accessory', price: 1499, brandId: 'B101', categoryId: 'C103' },
    { id: 'P113', name: 'USB-C Hub', type: 'Accessory', price: 3499, brandId: 'B104', categoryId: 'C103' },
    { id: 'P114', name: 'Watch Series 10', type: 'Smartwatch', price: 41900, brandId: 'B101', categoryId: 'C105' },
    { id: 'P115', name: 'Galaxy Watch 7', type: 'Smartwatch', price: 32999, brandId: 'B102', categoryId: 'C105' },
    { id: 'P116', name: 'iPad Air', type: 'Tablet', price: 59900, brandId: 'B101', categoryId: 'C106' },
    { id: 'P117', name: 'Galaxy Tab S10', type: 'Tablet', price: 54999, brandId: 'B102', categoryId: 'C106' },
];

const DEVICES = ['Mobile', 'Desktop', 'Tablet'];
const LOCATIONS = ['Pune', 'Mumbai', 'Bengaluru', 'Delhi'];
const EXTRA_EVENT_TYPES = ['VIEW', 'SEARCH', 'ADD_TO_CART'];

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function daysAgoIso(days) { return new Date(Date.now() - days * 86400000).toISOString(); }

// ---------- wipe / catalog / users ----------

async function wipe(session) {
    logger.info('Wiping existing graph data...');
    await session.run('MATCH (n) DETACH DELETE n');
}

async function seedCatalog(session) {
    for (const b of BRANDS) {
        await session.run('MERGE (b:Brand {id: $id}) SET b.name = $name', b);
    }
    for (const c of CATEGORIES) {
        await session.run('MERGE (c:Category {id: $id}) SET c.name = $name', c);
    }
    for (const p of PRODUCTS) {
        await session.run(
            `MERGE (p:Product {id: $id})
             SET p.name = $name, p.type = $type, p.price = $price
             WITH p
             MATCH (b:Brand {id: $brandId})
             MATCH (c:Category {id: $categoryId})
             MERGE (p)-[:OF_BRAND]->(b)
             MERGE (p)-[:BELONGS_TO]->(c)`,
            p
        );
    }
    logger.info(`Seeded ${BRANDS.length} brands, ${CATEGORIES.length} categories, ${PRODUCTS.length} products`);
}

async function seedRealUsers(session) {
    const users = [];
    for (let i = 1; i <= REAL_USER_COUNT; i++) {
        const id = `U${100 + i}`;
        const user = {
            id,
            name: `User ${i}`,
            email: `user${i}@example.com`,
            phoneNo: `9${randInt(100000000, 999999999)}`,
            createdAt: daysAgoIso(randInt(60, 400)),
        };
        users.push(user);
        await session.run(
            `MERGE (u:User {id: $id})
             SET u.name = $name, u.email = $email, u.phoneNo = $phoneNo,
                 u.createdAt = datetime($createdAt), u.updatedAt = datetime($createdAt)`,
            user
        );
    }
    logger.info(`Seeded ${users.length} real (testable) users: ${users.map(u => u.id).join(', ')}`);
    return users;
}

async function seedHelperUsers(session) {
    const ids = [];
    for (let i = 1; i <= HELPER_COUNT; i++) {
        const id = `U-HELPER-${i}`;
        ids.push(id);
        await session.run(
            `MERGE (u:User {id: $id})
             SET u.name = $name, u.email = $email, u.isSeedHelper = true,
                 u.createdAt = datetime(), u.updatedAt = datetime()`,
            { id, name: `Helper ${i}`, email: `helper${i}@example.com` }
        );
    }
    logger.info(`Seeded ${ids.length} hidden helper users (excluded from /api/users)`);
    return ids;
}

// ---------- deterministic per-user guarantees ----------
// Every real user gets the IDENTICAL pattern below, so the same test
// queries (same categories, same product IDs) work for any of them.

async function seedFunnelJourney(session, userId) {
    // VIEW MacBook Air (Laptops) -> WISHLIST Laptop Sleeve (same Apple brand) -> PURCHASE MacBook Pro (Laptops)
    await session.run(
        `MATCH (u:User {id: $userId}), (p:Product {id: 'P103'})
         MERGE (e:Event {id: $eventId})
         SET e.type = 'VIEW', e.timestamp = datetime($t), e.device = $device, e.location = $location, e.createdAt = datetime()
         MERGE (u)-[:PERFORMED]->(e)-[:ON_PRODUCT]->(p)`,
        { userId, eventId: `E-VIEW-P103-${userId}`, t: daysAgoIso(25), device: pick(DEVICES), location: pick(LOCATIONS) }
    );
    await session.run(
        `MATCH (u:User {id: $userId}), (p:Product {id: 'P108'})
         MERGE (e:Event {id: $eventId})
         SET e.type = 'ADD_TO_WISHLIST', e.timestamp = datetime($t), e.device = $device, e.location = $location, e.createdAt = datetime()
         MERGE (u)-[:PERFORMED]->(e)-[:ON_PRODUCT]->(p)`,
        { userId, eventId: `E-WISH-P108-${userId}`, t: daysAgoIso(15), device: pick(DEVICES), location: pick(LOCATIONS) }
    );
    await session.run(
        `MATCH (u:User {id: $userId}), (p:Product {id: 'P104'})
         MERGE (e:Event {id: $eventId})
         SET e.type = 'PURCHASE', e.timestamp = datetime($t), e.device = $device, e.location = $location, e.createdAt = datetime()
         MERGE (u)-[:PERFORMED]->(e)-[:ON_PRODUCT]->(p)
         MERGE (o:Order {id: $orderId})
         SET o.total = p.price, o.status = 'DELIVERED', o.createdAt = datetime($t)
         MERGE (u)-[:PLACED]->(o)-[:CONTAINS {quantity: 1}]->(p)`,
        { userId, eventId: `E-PURCHASE-P104-${userId}`, orderId: `O-FUNNEL-${userId}`, t: daysAgoIso(5), device: pick(DEVICES), location: pick(LOCATIONS) }
    );
}

async function seedAbandonedCart(session, userId) {
    // WH-1000XM5 sitting in cart, added 10 days ago, never purchased
    await session.run(
        `MATCH (u:User {id: $userId}), (p:Product {id: 'P109'})
         MERGE (u)-[:HAS_CART]->(ct:Cart {id: $cartId})
         SET ct.status = 'ACTIVE', ct.createdAt = datetime($t), ct.updatedAt = datetime($t)
         MERGE (ct)-[c:CONTAINS]->(p)
         SET c.quantity = 1, c.addedAt = datetime($t)`,
        { userId, cartId: `CART-${userId}`, t: daysAgoIso(10) }
    );
}

async function seedRecommendationSetup(session, userId) {
    // Every real user views + buys iPhone 16 (P101) ONLY - never Galaxy S25 (P102).
    // Helper accounts buy both together, building the CO_PURCHASED_WITH edge.
    // Result: every real user gets a valid recommendation(P102) + explain(P102) path.
    await session.run(
        `MATCH (u:User {id: $userId}), (p:Product {id: 'P101'})
         MERGE (e:Event {id: $eventId})
         SET e.type = 'VIEW', e.timestamp = datetime($t), e.device = $device, e.location = $location, e.createdAt = datetime()
         MERGE (u)-[:PERFORMED]->(e)-[:ON_PRODUCT]->(p)
         MERGE (o:Order {id: $orderId})
         SET o.total = p.price, o.status = 'DELIVERED', o.createdAt = datetime($t)
         MERGE (u)-[:PLACED]->(o)-[:CONTAINS {quantity: 1}]->(p)`,
        { userId, eventId: `E-VIEW-P101-${userId}`, orderId: `O-P101-ONLY-${userId}`, t: daysAgoIso(3), device: pick(DEVICES), location: pick(LOCATIONS) }
    );
}

async function seedHelperCoPurchase(session, helperId) {
    // buys iPhone 16 + Galaxy S25 together
    await session.run(
        `MATCH (u:User {id: $helperId}), (p1:Product {id: 'P101'}), (p2:Product {id: 'P102'})
         MERGE (o:Order {id: $orderId})
         SET o.total = p1.price + p2.price, o.status = 'DELIVERED', o.createdAt = datetime()
         MERGE (u)-[:PLACED]->(o)
         MERGE (o)-[:CONTAINS {quantity: 1}]->(p1)
         MERGE (o)-[:CONTAINS {quantity: 1}]->(p2)`,
        { helperId, orderId: `O-HELPER-CP-${helperId}` }
    );
}

async function seedReview(session, userId) {
    await session.run(
        `MATCH (u:User {id: $userId}), (p:Product {id: 'P104'})
         MERGE (r:Review {id: $reviewId})
         SET r.rating = $rating, r.comment = $comment, r.createdAt = datetime()
         MERGE (u)-[:WROTE]->(r)-[:FOR_PRODUCT]->(p)`,
        { userId, reviewId: `R-${userId}`, rating: randInt(4, 5), comment: pick(['Great!', 'Excellent', 'Loved it', 'Works perfectly']) }
    );
}

// a few extra light events per user so event history / category-affinity
// have more than the 2-3 scripted data points - purely for realism, doesn't
// affect any of the guarantees above
async function seedExtraEvents(session, userId) {
    const count = randInt(3, 6);
    for (let i = 0; i < count; i++) {
        const product = pick(PRODUCTS);
        await session.run(
            `MATCH (u:User {id: $userId}), (p:Product {id: $productId})
             CREATE (e:Event {id: randomUUID(), type: $type, timestamp: datetime($t),
                               device: $device, location: $location, createdAt: datetime()})
             CREATE (u)-[:PERFORMED]->(e)-[:ON_PRODUCT]->(p)`,
            {
                userId, productId: product.id, type: pick(EXTRA_EVENT_TYPES),
                t: daysAgoIso(randInt(0, 60)), device: pick(DEVICES), location: pick(LOCATIONS),
            }
        );
    }
}

// Instead of an expensive multi-hop Cypher self-join across orders/users/products
// (which was timing out on the free-tier instance), pull raw purchase data with
// one cheap query, compute co-purchase pairs in Node, and write all resulting
// edges back in a single batched UNWIND - one cheap read, one cheap write, no
// heavy joins for the database to execute.
async function computeCoPurchases(session) {
    const purchasesResult = await session.executeRead(tx => tx.run(
        `MATCH (u:User)-[:PLACED]->(:Order)-[:CONTAINS]->(p:Product)
         RETURN u.id AS userId, collect(DISTINCT p.id) AS productIds`
    ));

    // productId -> Set of userIds who bought it
    const buyersByProduct = new Map();
    for (const record of purchasesResult.records) {
        const userId = record.get('userId');
        for (const productId of record.get('productIds')) {
            if (!buyersByProduct.has(productId)) buyersByProduct.set(productId, new Set());
            buyersByProduct.get(productId).add(userId);
        }
    }

    const typeById = new Map(PRODUCTS.map(p => [p.id, p.type]));
    const edges = [];

    for (const [p1, buyers1] of buyersByProduct.entries()) {
        for (const [p2, buyers2] of buyersByProduct.entries()) {
            if (p1 === p2) continue;
            if (typeById.get(p1) !== typeById.get(p2)) continue;

            const coPurchasers = [...buyers1].filter(u => buyers2.has(u)).length;
            const totalP1 = buyers1.size;
            if (totalP1 === 0) continue;

            edges.push({ p1, p2, confidence: coPurchasers / totalP1, support: coPurchasers });
        }
    }

    if (edges.length > 0) {
        await session.executeWrite(tx => tx.run(
            `UNWIND $edges AS edge
             MATCH (p1:Product {id: edge.p1}), (p2:Product {id: edge.p2})
             MERGE (p1)-[r:CO_PURCHASED_WITH]->(p2)
             SET r.confidence = edge.confidence, r.support = edge.support`,
            { edges }
        ));
    }

    logger.info(`Computed ${edges.length} CO_PURCHASED_WITH edges (in-app, single batched write)`);
}

// ---------- main ----------

async function main() {
    await connectGraphDB();
    const session = getSession();

    try {
        if (WIPE) await wipe(session);

        await seedCatalog(session);
        const users = await seedRealUsers(session);
        const helperIds = await seedHelperUsers(session);

        for (const helperId of helperIds) {
            await seedHelperCoPurchase(session, helperId);
        }

        for (const user of users) {
            await seedFunnelJourney(session, user.id);
            await seedAbandonedCart(session, user.id);
            await seedRecommendationSetup(session, user.id);
            await seedReview(session, user.id);
            await seedExtraEvents(session, user.id);
        }

        // must run after ALL orders exist (helpers + real users)
        await computeCoPurchases(session);

        logger.info(`✅ Seed complete. Every one of these users works identically for all endpoints: ${users.map(u => u.id).join(', ')}`);
        logger.info(`   Test with: viewedCategory=Laptops, purchasedCategory=Laptops, minDays=7, recommendations->P102, explain(P102, any userId above)`);
    } catch (err) {
        logger.error('Seed failed', err);
        process.exitCode = 1;
    } finally {
        await session.close();
        await closeConnection();
    }
}

main();