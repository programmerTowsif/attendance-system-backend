import {Request,Response,NextFunction}from"express";
import jwt from"jsonwebtoken";
import pool from "../config/db.js";


interface jwtPayload{
    id: string;
}


export interface AuthRequest extends Request{
    user?:{
        id: string;
        name:string;
        email:string;
        role:"admin" | "user";
        account_status:"pending" | "active" | "rejected";
    };
}



export async function authenticate(req: AuthRequest,
    res: Response,
    next:NextFunction
) :Promise<void>{
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            res.status(401).json({
                message:"Authorization token is required",
            });
            return;
        }

        const token = authHeader.split(" ")[1];
        if(!token){
            res.status(401).json({
                message:"internal server error",
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if(!jwtSecret || jwtSecret.length < 32){
            res.status(500).json({
                message:"internal server error",
            });
            return;
        }
        const decoded = jwt.verify(token,jwtSecret);
        if( typeof decoded === "string" || typeof decoded !== "string"){
            res.status(401).json({
                message:"invalid token",
            });
            return;
        }

    } catch (error) {
        
    }
}