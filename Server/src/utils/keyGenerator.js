export function generateKey(req,config){
    return config.keyGenerator(req);
}