const agentService = require('../services/agentService');

async function ask(req, res, next) {
    try {
        const { question, userId } = req.body;
        if (!question) {
            return res.status(400).json({ error: 'question is required in the request body' });
        }
        const result = await agentService.ask(question, userId);
        res.json(result);
    } catch (err) { next(err); }
}

module.exports = { ask };