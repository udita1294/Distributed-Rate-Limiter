import redisClient from '../config/redis.js'

export async function fixedWindow(key,options){
    const {limit,window} = options;

    const count = await redisClient.incr(key);

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