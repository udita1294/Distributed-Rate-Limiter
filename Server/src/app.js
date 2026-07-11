import express from "express";
import rateLimiter from "./middleware/rateLimiter.js";
import demoRoutes from "./routes/demo.js";

const app = express();

app.use(express.json());

app.use(
    rateLimiter({
        algorithm : "slidingWindow",
        window : 60,
        limit : 5,
        keyGenerator: (req) => req.ip
    })
);

app.use('/api',demoRoutes);

export default app;

