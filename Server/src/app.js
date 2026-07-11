import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import rateLimiter from "./middleware/rateLimiter.js";
import demoRoutes from "./routes/demo.js";
import { getAlgorithm } from "./strategy/algorithmFactory.js";
import { validateConfig } from "./utils/validateConfig.js";
import redisClient from "./config/redis.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

// CORS Middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Serve frontend static assets
app.use(express.static(path.join(__dirname, "../../Client")));

// Simulator Endpoint
app.post("/api/simulate", async (req, res) => {
    try {
        const { algorithm: algoName, clientId, limit, window, capacity, refillRate, leakRate } = req.body;

        const config = {
            algorithm: algoName || "fixedWindow",
            limit: Number(limit) || 5,
            window: Number(window) || 60,
            capacity: Number(capacity) || 10,
            refillRate: Number(refillRate) || 1,
            leakRate: Number(leakRate) || 1,
            keyGenerator: () => clientId || req.ip
        };

        validateConfig(config);

        const key = `simulate:${config.algorithm}:${clientId || req.ip}`;
        const algorithm = getAlgorithm(config.algorithm);
        const result = await algorithm(key, config);

        // Send rate-limiter headers
        const limitVal = (config.algorithm === "tokenBucket" || config.algorithm === "leakyBucket") ? config.capacity : config.limit;
        res.setHeader('X-RateLimit-Limit', limitVal);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('Retry-After', result.retryAfter);

        return res.status(result.allowed ? 200 : 429).json({
            success: result.allowed,
            allowed: result.allowed,
            count: result.count,
            remaining: result.remaining,
            retryAfter: result.retryAfter,
            message: result.allowed ? "Request allowed" : "Too many requests.",
            key: key
        });
    } catch (error) {
        console.error("Simulation error:", error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Reset Endpoint
app.post("/api/reset", async (req, res) => {
    try {
        const patterns = ["simulate:*", "tokenBucket:simulate:*", "leakyBucket:simulate:*"];
        let deletedCount = 0;
        for (const pattern of patterns) {
            const keys = await redisClient.keys(pattern);
            if (keys && keys.length > 0) {
                await redisClient.del(keys);
                deletedCount += keys.length;
            }
        }
        return res.json({
            success: true,
            message: `Cleared ${deletedCount} simulation rate limit keys.`
        });
    } catch (error) {
        console.error("Reset error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Apply default rate limiter to API routes (excluding simulate & reset)
app.use(
    '/api',
    rateLimiter({
        algorithm : "slidingWindow",
        window : 60,
        limit : 5,
        keyGenerator: (req) => req.ip
    }),
    demoRoutes
);

export default app;

