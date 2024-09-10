import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";

// const ConnectDb = async()=>{
//     try {
//         const Connections = await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}  `)
//         console.log(`\n Db_Connected !!`);
//     } catch (error) {
//         console.log('connection error', error);
//         process.exit(1)
//     }
// }

const ConnectDb = async()=>{
    try {
        const Connections = await mongoose.connect( `${process.env.DB_URL}/${DB_NAME}`) //show in error 
        // const Connections = await mongoose.connect("mongodb://localhost:27017/testing")
        console.log(`Db_Connected !!`);
        // console.log(Connections);
    } catch (error) {
        console.log('connection error', error);
        process.exit(1)
    }
}
export default ConnectDb