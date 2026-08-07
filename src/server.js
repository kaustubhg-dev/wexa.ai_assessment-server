require('dotenv').config();

const createApp = require('./app');
const logger = require('./utils/logger');
const { connectGraphDB, closeConnection } = require('../config/cognodb');

const PORT = process.env.PORT || 3000;

let server;

async function start() {

     // Connect to GraphDB
     await connectGraphDB();

    const app = createApp();



    // Start HTTP server
    server = app.listen(PORT, () => {
        logger.info(`Server listening on port ${PORT}`, {
            env: process.env.NODE_ENV,
            port: PORT,
        });
    });
}

/**
 * Gracefully shutdown the server
 */

let isShuttingDown = false;

async function gracefulShutdown(signal) {
    if (isShuttingDown) return;

    isShuttingDown = true;

    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async (err) => {
        if (err) {
            logger.error('Error while closing server', err);
            process.exit(1);
        }

        logger.info('HTTP server closed.');

        // Closing DB connections here
        await closeConnection();

        logger.info('Shutdown complete.');
        process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
        logger.error('Graceful shutdown timed out. Force exiting.');
        process.exit(1);
    }, 10000);
}

// Handle termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Catch unexpected errors
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', reason);
    gracefulShutdown('unhandledRejection');
    // process.exit(1);
});

// Start server
start().catch((err) => {
    logger.error('Failed to start server', err);
    process.exit(1);
});