export default function rateLimiter(options = {}){

    return async(req,res,next)=>{

        console.log("Rate Limiter Executed");

        console.log({
            ip : req.ip,
            method : req.method,
            path : req.originalUrl
        });

        next();
    }
}

// Right now it's only logging the request. Later, this middleware will call one of our rate-limiting algorithms.