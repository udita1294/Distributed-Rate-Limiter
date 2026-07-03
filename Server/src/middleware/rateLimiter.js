import {fixedWindow} from '../algorithms/fixedWindow.js'

export default function rateLimiter(options = {}){

    return async(req,res,next)=>{

        const key = req.ip;

        const result = await fixedWindow(key,options);
        console.log(result);
        res.setHeader('X-RateLimit-Limit',options.limit);
        res.setHeader('X-RateLimit-Remaining',result.remaining);
        res.setHeader('Retry-After',result.retryAfter);

        if(!result.allowed){
            return res.status(429).json({
                success : false,
                message : "Too many requests. Please try again later."
            });
        }
        
        console.log("Rate Limiter Executed");

        next();
    }
}

// Right now it's only logging the request. Later, this middleware will call one of our rate-limiting algorithms.