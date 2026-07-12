// This is a helper function whose job is to generate the unique key 
// that the rate limiter will use for counting requests.

export function generateKey(req,config){
    try{
        return config.keyGenerator(req);
    }catch(err){
        throw new Error(`Error generating rate limitkey: ${err.message}`);
    }
}