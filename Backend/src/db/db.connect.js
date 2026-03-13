import mongoose from "mongoose"

const connectDb = async function db_connection(){
    try{
       const db_connection = await mongoose.connect(process.env.DATABASE_URL )
       console.log('database connection started at ')
        console.log(db_connection.connection.host)
    }catch(err){
        console.log(err)
    }
}

export {connectDb}