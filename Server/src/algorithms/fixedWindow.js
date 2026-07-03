import redisClient from '../config/redis.js'

export async function fixedWindow(key,options){
    console.log("fixedWindow called");
    const {limit,window} = options;

    console.log("Key:", key);
    const count = await redisClient.incr(key);
    console.log("Count =", count);

    if(count === 1){
        await redisClient.expire(key,window);
    }

    const ttl = await redisClient.ttl(key);

    return{
        allowed : count <= limit,
        count,
        remaining : Math.max(limit - count , 0),
        retryAfter : ttl
    };
}