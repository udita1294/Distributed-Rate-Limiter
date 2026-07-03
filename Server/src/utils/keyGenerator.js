// This is a helper function whose job is to generate the unique key 
// that the rate limiter will use for counting requests.

export function generateKey(req,config){
    return config.keyGenerator(req);
}