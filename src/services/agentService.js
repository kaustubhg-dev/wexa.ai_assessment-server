const userService = require('./userService');
const cartService = require('./cartService');
const recommendationService = require('./recommendationsService');

const GEMINI_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

// The fixed set of queries the agent is allowed to route to.
// Keep this list in sync with routes/api.js — this IS your query library.
const QUERY_CATALOG = [
    { name: 'getUserEvents', description: 'What did a user do recently? Params: userId, days (number)' },
    { name: 'getViewedNotPurchased', description: 'Products a user viewed but never bought. Params: userId' },
    { name: 'getCategoryAffinity', description: 'Which categories a user engages with most. Params: userId' },
    { name: 'getFunnel', description: 'Multi-step journey: viewed a category, wishlisted same brand, purchased another category, within N days. Params: userId, viewedCategory, purchasedCategory, days' },
    { name: 'getAbandonedCarts', description: 'Users with items sitting in cart, unpurchased, for N+ days. Params: minDays' },
    { name: 'getRecommendations', description: 'Predicted next purchase for a user based on co-purchase patterns. Params: userId, limit' },
];

async function routeQuestion(question, userId) {
    const prompt = `You are a routing engine for a graph database of e-commerce customer behavior.
Given a user's question, choose exactly one query from this catalog and extract its parameters.
If the question mentions "userId" and none is given explicitly, use "${userId || 'null'}
extarct parameters carefully".

Catalog:
${QUERY_CATALOG.map(q => `- ${q.name}: ${q.description}`).join('\n')}

Respond with ONLY a JSON object: {"queryName": "...", "params": {...}}

Question: "${question}"`;

    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
             'X-goog-api-key': process.env.GEMINI_API_KEY
            },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
        }),
    });

    if (!response.ok) {
        const err = new Error(`Gemini routing call failed: ${response.status}`);
        err.status = 502;
        throw err;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? data.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(text); // { queryName, params }
}

async function executeQuery(queryName, params) {
    switch (queryName) {
        case 'getUserEvents':
            return userService.getUserEvents(params.userId, params.days);
        case 'getViewedNotPurchased':
            return userService.getViewedNotPurchased(params.userId);
        case 'getCategoryAffinity':
            return userService.getCategoryAffinity(params.userId);
        case 'getFunnel':
            return userService.getFunnel(params.userId, params);
        case 'getAbandonedCarts':
            return cartService.getAbandonedCarts(params.minDays);
        case 'getRecommendations':
            return recommendationService.getRecommendations(params.userId, params.limit);
        default: {
            const err = new Error(`Unknown queryName from agent: ${queryName}`);
            err.status = 502;
            throw err;
        }
    }
}

async function narrate(question, data) {
    const prompt = `You are a helpful assistant summarizing e-commerce customer data for a non-technical reader.
Question: "${question}"
Raw data (JSON): ${JSON.stringify(data)}

Write a short, natural-language answer (2-4 sentences). Do not mention JSON, Cypher, or databases.`;

    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) return 'Here is the data I found.'; // graceful fallback if narration fails
    const responseData = await response.json();
    return responseData.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Here is the data I found.';
}

async function ask(question, userId) {
    const { queryName, params } = await routeQuestion(question, userId);
    const data = await executeQuery(queryName, params);
    const answer = await narrate(question, data);
    return { answer, data, queryUsed: queryName };
}

module.exports = { ask };