const { getSession } = require('../../config/cognodb');

async function getCategories() {
    const session = getSession();

    try {
        const result = await session.run(`
            MATCH (c:Category)
            RETURN c.id AS id, c.name AS categoryName
            ORDER BY c.name
        `);

        return result.records.map(r => ({
            id: r.get('id'),
            name: r.get('categoryName'),
        }));
    } finally {
        await session.close();
    }
}

module.exports = { getCategories };