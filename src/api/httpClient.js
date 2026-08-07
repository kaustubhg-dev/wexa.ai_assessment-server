const axios = require('axios');
const logger = require('../utils/logger');
require('dotenv').config();

class HttpClient {
    constructor(baseURL, options = {}) {
        this.token = options.token || process.env.TOKEN;

        this.client = axios.create({
            baseURL: baseURL || process.env.BASE_URL,
            timeout: options.timeout || 10000,
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...(options.headers || {}),
            },
        });
    }

    async get(url, params = {}) {
        try {
            const res = await this.client.get(url, { params });
            return res.data;
        } catch (error) {
            logger.error('GET request failed', { message: error.message });
            throw error;
        }
    }

    async post(url, data = {}) {
        try {
            const res = await this.client.post(url, data);
            return res.data;
        } catch (error) {
            logger.error('POST request failed', { message: error.message });
            throw error;
        }
    }

    async delete(url) {
        try {
            const res = await this.client.delete(url);
            return res.data;
        } catch (error) {
            logger.error('DELETE request failed', { message: error.message });
            throw error;
        }
    }

    async patch(url, data = {}) {
        try {
            const res = await this.client.patch(url, data);
            return res.data;
        } catch (error) {
            logger.error('PATCH request failed', { message: error.message });
            throw error;
        }
    }

    async getAll(url, params = {}) {
        const items = [];
        let pageToken = undefined;

        do {
            const res = await this.get(url, {
                ...params,
                ...(pageToken ? { pageToken } : {}),
            });
            items.push(...(res.items || []));
            pageToken = res.nextPageToken;
        } while (pageToken);

        return items;
    }
}

module.exports = HttpClient;