import redisClient from '../config/redis.js';

export async function tokenBucket(key,options){
    const {capacity, refillRate} = options;
    const redisKey = `tokenBucket:${key}`;

    const now = Date.now();

    let bucket = await redisClient.get(redisKey);
    if(!bucket){
        bucket = {
            tokens: capacity,
            lastRefill: now
        };
    }else{
        bucket = JSON.parse(bucket);
    }

    //calculate elapsed time since last refill
    const elapsed = (now - bucket.lastRefill)/1000;

    //refill tokens
    const refill = elapsed * refillRate;
    bucket.tokens = Math.min(capacity , bucket.tokens + refill);

    bucket.lastRefill = now;

    // reject if no tokens
    if(bucket.tokens < 1){
        await redisClient.set(redisKey , JSON.stringify(bucket) , {EX : 3600});

        return{
            allowed: false,
            count : capacity,
            remaining: 0,
            retryAfter : Math.ceil((1 - bucket.tokens)/refillRate)
        };
    }

    //consume one token
    bucket.tokens -= 1;

    await redisClient.set(redisKey,JSON.stringify(bucket),{EX:3600});

    return{
        allowed: true,
        count : capacity - Math.floor(bucket.tokens),
        remaining: Math.floor(bucket.tokens),
        retryAfter : 0
    };

}