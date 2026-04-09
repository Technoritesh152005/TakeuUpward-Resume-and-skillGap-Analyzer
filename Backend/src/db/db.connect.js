import mongoose from "mongoose"
import logger from "../utils/logs.js"

const connectDb = async function db_connection() {
    try {
        const dbConnection = await mongoose.connect(process.env.DATABASE_URL)
        logger.info(`MongoDB connected: ${dbConnection.connection.host}`)
        return dbConnection
    } catch (error) {
        logger.error(`MongoDB connection failed: ${error.message}`)
        throw error
    }
}

export { connectDb }
