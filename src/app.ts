import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import authRoutes from"./routers/authRouters.js";
import cors from"cors";

const app = express();
app.use(cors());
app.use(express.json({limit:'1mb'}));
app.get("/",(_req:Request,res:Response)=>{
    res.json({
        message:"student attendance api is running",
    });
});


app.use("/api/auth", authRoutes);

app.use((_req:Request,res:Response)=>{
    res.status(404).json({
        message:"api endpoint not found",
    });
});
app.use((error:Error,_req:Request ,res:Response,_next:NextFunction)=>{
    console.log(error);
    res.status(500).json({
        message:"internal server error",
    });
},);
export default app;