
import defaultConfig from '../config/defaultConfig.js'
import {getAlgorithm} from '../strategy/algorithmFactory.js'
import {generateKey} from '../utils/keyGenerator.js'
import {validateConfig} from '../utils/validateConfig.js'


export default function rateLimiter(options = {}){

    // Merge user config with defaults
    const config = {
        ...defaultConfig,
        ...options
    }

    // Validate once during startup
    validateConfig(config);

    return async(req,res,next)=>{
        try{
            // Generate key
            const key = generateKey(req,config);
            // get algorithm function based on the config
            const algorithm = getAlgorithm(config.algorithm);
            // execute the algorithm with the key and config
            const result = await algorithm(key,config);

            // Standard Rate Limit Headers
            res.setHeader('X-RateLimit-Limit',config.limit);
            res.setHeader('X-RateLimit-Remaining',result.remaining);
            res.setHeader('Retry-After',result.retryAfter);


            if(!result.allowed){
                return res.status(429).json({
                    success : false,
                    message : "Too many requests."
                });
            }
            next();
        }catch(error){
            console.error(error);
            return res.status(500).json({
                success : false,
                message : error.message
            });
        }
    }
}

