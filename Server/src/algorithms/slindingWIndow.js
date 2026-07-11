import crypto from 'crypto';
import redisClient from '../config/redis.js';

export async function slidingWindow(key,options){
    const {limit,window} = options;
    const now = Date.now();
    const oldest = now - window*1000;

    //removed expired requests
    await redisClient.zRemRangeByScore(key,0,oldest);

    //count requests inside the window
    const count = await redisClient.zCard(key);

    //block requests if limit exceeded
    if(count >= limit){
        const oldestRequest = await redisClient.zRange(key,0,0,{BY:"RANK"});
        const retryAfter = Math.ceil((Number(oldestRequest[0].split("-")[0]) + window*1000 - now)/1000);

        return{
            allowed: false,
            count,
            remaining: 0,
            retryAfter
        };
    }

    // store current request
    const member = `${now} - ${crypto.randomUUID()}`;

    await redisClient.zAdd(key,[{
        score: now,
        value: member
    }]);

    // expire redis key
    await redisClient.expire(key,window);

    return{
        allowed: true,
        count: count + 1,
        remaining: limit - (count + 1),
        retryAfter: 0
    };
}