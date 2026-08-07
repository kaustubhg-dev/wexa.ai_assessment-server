const neo4j = require("neo4j-driver");
const logger = require("../src/utils/logger");

const driver = neo4j.driver(
    process.env.COGNODB_URI,
    neo4j.auth.basic(
        process.env.COGNODB_USER,
        process.env.COGNODB_PASSWORD
    )
);

async function connectGraphDB() {
    try {
        await driver.verifyConnectivity();
        logger.info("✅ Connected to CognoDB")
    } catch (err) {
        logger.error("❌ Graph DB Connection Failed : "+err)
        process.exit(1);
    }
}

function getSession() {
    return driver.session();
}

async function closeConnection() {
    await driver.close();
    logger.info("Graph DB connection closed");
}

module.exports = {
    connectGraphDB,
    getSession,
    closeConnection
};