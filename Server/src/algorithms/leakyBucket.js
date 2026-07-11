import redisClient from '../config/redis.js';

export async function leakyBucket(key,options){
    const {capacity,leakRate} = options;
    const redisKey = `leakyBucket:${key}`;

    const now = Date.now();

    let bucket = await redisClient.get(redisKey);
    if(!bucket){
        bucket = {
            queue : 0,
            lastLeak : now
        };
    }else{
        bucket = JSON.parse(bucket);
    }

    const elapsed = (now - bucket.lastLeak)/1000;
    const leaked = elapsed * leakRate;

    bucket.queue = Math.max(0,bucket.queue - leaked);

    bucket.lastLeak = now;

    if(bucket.queue >= capacity){
        await redisClient.set(redisKey,JSON.stringify(bucket),{EX:3600});

        return{
            allowed: false,
            count:capacity,
            remaining: 0,
            retryAfter: Math.ceil((bucket.queue - capacity+1)/leakRate)
        };
    }

    bucket.queue += 1;

    await redisClient.set(redisKey,JSON.stringify(bucket),{EX:3600});

    return{
        allowed: true,
        count: Math.ceil(bucket.queue),
        remaining: Math.max(0 , capacity - Math.ceil(bucket.queue)),
        retryAfter: 0
    };
}