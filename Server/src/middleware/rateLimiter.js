
import defaultConfig from '../config/defaultConfig.js'
import {getAlgorithm} from '../strategy/algorithmFactory.js'
import {generateKey} from '../utils/keyGenerator.js'
import {validateConfig} from '../utils/validateConfig.js'
import {setRateLimitHeaders} from '../utils/setHeaders.js'


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
            //skip request
            if(config.skip(req)){
                return next();
            }
            // Generate key
            const key = generateKey(req,config);
            // get algorithm function based on the config
            const algorithm = getAlgorithm(config.algorithm);
            // execute the algorithm with the key and config
            const result = await algorithm(key,config);

            // Standard Rate Limit Headers
            setRateLimitHeaders(res,config,result);

            //limit exceeded
            if(!result.allowed){
                if(typeof config.onLimitReached === "function"){
                    config.onLimitReached(req,res,result);
                }
                return res.status(config.statusCode).json({
                    success : false,
                    message : config.message,
                    retryAfter : result.retryAfter
                });
            }
            next();
        }catch(error){
            next(error);
        }
    }
}

