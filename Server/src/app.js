import express from "express";
import rateLimiter from "./middleware/rateLimiter.js";
import demoRoutes from "./routes/demo.js";

const app = express();

app.use(express.json());

app.use(rateLimiter({
        algorithm: "slidingWindow",
        limit: 5,
        window: 60,

        keyGenerator: (req) => {
            return req.ip;
        },

        skip: (req) => {
            return req.path === "/health";
        },

        message: "API rate limit exceeded.",

        onLimitReached(req) {
            console.log(
                `${req.ip} exceeded rate limit.`
            );
        }
    })
);

app.use("/api", demoRoutes);

// Health Route
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Healthy"
    });
});

// Global Error Handler
app.use((err,req,res,next) => {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
);

export default app;