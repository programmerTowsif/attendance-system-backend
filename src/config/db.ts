import {Pool} from "pg";
import dotenv from "dotenv";

dotenv.config();

if(!process.env.DATABASE_URL){
    throw new Error("db url is missing in . env");
}

const pool = new Pool({
    connectionString:process.env.DATABASE_URL,
    ssl: process.env.DB_SSL ==="true" ? {rejectUnauthorized:false} : false,
})
pool.on("error",(error)=>{
    console.log("unexpected postgresql error",error);
});
export default pool;