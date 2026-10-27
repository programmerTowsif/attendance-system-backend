import dotenv from "dotenv";
import app from "./app.js";
import pool from "./config/db.js";
dotenv.config();
const PORT = Number(process.env.PORT) || 5000;
async function  startServer() :Promise<void>{
    try {
        await pool.query("SELECT 1");
        console.log("pstsql connected successfully");
        app.listen(PORT,()=>{
            console.log(`Server running at http://localhost:${PORT}`);
        })
    } catch (error) {
        console.log("failed to statrt server",error);
        await pool.end();
        process.exit(1);
    }
}
void startServer();