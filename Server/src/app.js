import express from "express";
import rateLimiter from "./middleware/rateLimiter.js";
import demoRoutes from "./routes/demo.js";

const app = express();

app.use(express.json());

app.use(
    rateLimiter({
        algorithm : "fixed-window",
        window : 60,
        limit : 5
    })
);

app.use('/api',demoRoutes);

export default app;

// Even though the algorithm isn't implemented yet, we're already designing the middleware API.
