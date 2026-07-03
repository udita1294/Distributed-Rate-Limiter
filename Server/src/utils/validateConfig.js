export function validateConfig(config){
    if(config.limit <= 0){
        throw new Error("Rate Limit must be greater than 0");
    };

    if(config.window <= 0){
        throw new Error("Window must be greater than 0");
    };

    const algorithms = [
        "fixedWindow",
        "slidingWindow",
        "tokenBucket",
        "leakyBucket"
    ];

    if(!algorithms.includes(config.algorithms)){
        throw new Error(`Unsupported algorithm : ${config.algorithm}`);
    }
    if(typeof config.keyGenerator !== "function"){
        throw new Error("keyGenerator must be a function");
    }
}