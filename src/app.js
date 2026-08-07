require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const logger = require('./utils/logger');

const routes = require('./routes');

function createApp() {
    const app = express();

    // Middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());


    // Routes
    app.use('/api', routes);
    app.get('/health', (req, res) => res.json({ status: 'ok',message:"I'M STILL ALIVE !!!", timeStamp: new Date() }));

    app.use((err, req, res, next) => {
        logger.error(err.message, err);
        res.status(err.status || 500).json({ error: err.message });
    });

    return app;
}

module.exports = createApp;