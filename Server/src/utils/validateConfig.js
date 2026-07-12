// to validate the configuration before the rate limiter starts working.

export function validateConfig(config){
    // The maximum allowed requests must be positive.
    if(config.limit <= 0){ 
        throw new Error("Rate Limit must be greater than 0");
    };

    // This checks the window size.A window cannot be zero seconds.Negative time is impossible.
    if(config.window <= 0){
        throw new Error("Window must be greater than 0");
    };

    // Creating a list of supported algorithms.Only these four values are accepted.Anything else should be rejected.
    const algorithms = [
        "fixedWindow",
        "slidingWindow",
        "tokenBucket",
        "leakyBucket"
    ];

    // This checks whether the selected algorithm exists in the list.
    if(!algorithms.includes(config.algorithm)){
        throw new Error(`Unsupported algorithm : ${config.algorithm}`);
    }

    // checks whether keyGenerator is actually a function.
    if(typeof config.keyGenerator !== "function"){
        throw new Error("keyGenerator must be a function");
    }

    if(typeof config.skip !== "function"){
        throw new Error("skip must be a function");
    }
}