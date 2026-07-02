import dotenv from 'dotenv';

dotenv.config();

import app from './app.js';
import {connectRedis} from './config/redis.js';

const PORT = process.env.PORT || 3000;

async function startServer(){
    try{
        await connectRedis();

        app.listen(PORT , ()=>{
            console.log(`Server is running on port ${PORT}`);
        });
    }catch(err){
        console.error('Error starting server:', err);
        process.exit(1);
    }
}

startServer();