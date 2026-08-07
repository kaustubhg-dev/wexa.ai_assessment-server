/**
 * runCypherFile.js
 * Runs each statement in a .cypher file against CognoDB, one at a time.
 * Used for one-time setup scripts like schema-constraints.cypher.
 *
 * Usage: node scripts/runCypherFile.js scripts/schema-constraints.cypher
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectGraphDB, getSession, closeConnection } = require('../config/cognodb');
const logger = require('../src/utils/logger');

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Usage: node scripts/runCypherFile.js <path-to-cypher-file>');
        process.exit(1);
    }

    const raw = fs.readFileSync(path.resolve(filePath), 'utf-8');

    // strip // comments, split on semicolons, drop empty lines
    const statements = raw
        .split('\n')
        .filter(line => !line.trim().startsWith('//'))
        .join('\n')
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);

    await connectGraphDB();
    const session = getSession();

    try {
        for (const stmt of statements) {
            logger.info(`Running: ${stmt.slice(0, 80)}...`);
            await session.run(stmt);
        }
        logger.info(`✅ Ran ${statements.length} statements from ${filePath}`);
    } catch (err) {
        logger.error('Failed running cypher file', err);
        process.exitCode = 1;
    } finally {
        await session.close();
        await closeConnection();
    }
}

main();