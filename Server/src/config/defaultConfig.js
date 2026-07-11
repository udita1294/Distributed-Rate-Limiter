// This file defines the default configuration for your rate limiter middleware. 
// Instead of hardcoding values inside the middleware, you keep them 
// in one place so they can be reused and overridden if needed.



const defaultConfig = {
    algorithm: "fixedWindow",
    window: 60,
    limit: 5,
    capacity:10,
    refillRate: 1,
    leakRate: 1,

    // a function that decides how to identify a client.
    keyGenerator: (req) => req.ip
};

export default defaultConfig;