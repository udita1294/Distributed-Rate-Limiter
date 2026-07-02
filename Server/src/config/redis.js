import {createClient} from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
    socket : {
        host : process.env.REDIS_HOST,
        port : Number(process.env.REDIS_PORT)
    },
});

client.on('connect',()=>{
    console.log('Redis client connected');
});
client.on('error',(err)=>{
    console.log('Redis client error',err.message);
});

export async function connectRedis(){
    await client.connect();
}

export default client;