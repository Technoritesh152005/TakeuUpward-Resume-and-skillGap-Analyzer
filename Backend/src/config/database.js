import mongoose from 'mongoose'
import logger from "../utils/logs.js"

const connectDb = async()=>{
    try{
       const database = await mongoose.connect(process.env.DATABASE_URL, {
        useNewUrlParser:true,
        useUnifiedTopology:true,
       })
       
       logger.info(`MongoDb connected : ${mongoose.connection.host}`)

    // Handling succesfully connection
    // mongoose.connection.on always take a event and a callback fxn
        mongoose.connection.on('connected',()=>{
        logger.info('Mongoose connected to MongoDB')
    })

    // handling error event 
    mongoose.connection.on('error',()=>{
        logger.error('Error occured while connecting mongoose to MongoDb')
    })

    mongoose.connection.on('connecting',()=>{
        logger.info('Mongoose is connecting to MongoDb')
    })

    mongoose.connection.on('disconnected',()=>{
        logger.warn('Mongoose disconnected to MongoDb')
    })

    

    // handling graceful shutdown to mongodb
    // when app terminate mongodb sends signal interrupt to nodejs server
    process.on('SIGINT',async()=>{
        const isClose= await mongoose.connection.close()
        if(!isClose){
            logger.warn('Failed to close Mongodb')
        }
        logger.info('Mongodb graceful becomes shutdown due to app termination')
        // program ended with server shutdown
        process.exit(0);

       
        
    })

    }
    catch(err){
        logger.error(`Error is : ${err.message}`)
        // program ended with error
        process.exit(1)
    }
}
