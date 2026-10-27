import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "../config/db.js";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export async function register(
  req: Request<{}, {}, RegisterBody>,
  res: Response
): Promise<void> {
  const { name, email, password } = req.body;

  // 1. Validate input
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    res.status(400).json({
      message: "Name, email and password are required.",
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({
      message: "Password must be at least 8 characters long.",
    });
    return;
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (
    cleanName.length > 100 ||
    cleanEmail.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    res.status(400).json({
      message: "Please provide a valid name and email.",
    });
    return;
  }

  const client = await pool.connect();

  try {
    // 2. Start transaction
    await client.query("BEGIN");

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Create student account
    const userResult = await client.query(
      `INSERT INTO users
        (name, email, password_hash, role, account_status)
       VALUES ($1, $2, $3, 'student', 'pending')
       RETURNING id, name, email, role, account_status, created_at`,
      [cleanName, cleanEmail, passwordHash]
    );

    const user = userResult.rows[0];

    // 5. Split name into first and last name
    const nameParts = cleanName.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    // 6. Create profile
    await client.query(
      `INSERT INTO profiles
        (user_id, first_name, last_name)
       VALUES ($1, $2, $3)`,
      [user.id, firstName, lastName]
    );

    // 7. Commit transaction
    await client.query("COMMIT");

    res.status(201).json({
      message: "Registration successful. Await admin approval.",
      user,
    });
  } catch (error: unknown) {
    await client.query("ROLLBACK");

    const dbError = error as { code?: string };

    if (dbError.code === "23505") {
      res.status(409).json({
        message: "An account with this email already exists.",
      });
      return;
    }

    console.error("Registration error:", error);

    res.status(500).json({
      message: "Registration failed due to a server error.",
    });
  } finally {
    client.release();
  }
}

interface LoginBody{
    email:string;
    password:string;
}
export async function login(req:Request<{},{},LoginBody>,res:Response):Promise<void> {

    const {email,password} = req.body ??{};
    if(typeof email !== "string" || typeof password !== "string" || !email.trim() || !password ){
        res.status(400).json({
            messages:"email and pass are required",
        });
        return;
    }
    const cleanEmail = email.trim().toLocaleLowerCase();
    if( cleanEmail.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    password.length > 128 ){
        res.status(400).json({
            message:"invalid email or pass",
        });
        return;
    }
    try {
        const result = await pool.query(
             `SELECT id, name, email, password_hash, role, account_status
       FROM users
       WHERE email = $1`,
      [cleanEmail]
        );
        const user = result.rows[0];
        if(!user){
            res.status(401).json({
                message:"invalid email or pass",
            });
            return;
        }

        const passwordMatches = await bcrypt.compare(password,  user.password_hash);
        if(!passwordMatches){
            res.status(401).json({
                message:"invalid email or pass",
            });
            return;
        }
        if(user.account_status  !== "active"){
            res.status(403).json({
                message:
                user.account_status =="pending" ? "Your account is awaiting admin approval."
            : "Your account is not active.",
            });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET;
 

    if (!jwtSecret || jwtSecret.length < 32) {
      console.error("JWT_SECRET is missing or too short.");

      res.status(500).json({
        message: "Internal server error.",
      });
      return;
    }
    const token = jwt.sign({id:String(user.id)},jwtSecret,{expiresIn:"1h"});
    res.status(200).json({
        message:"login sucessfull",
        token,
        user:{
            id:String(user.id),
            name:user.name,
            email:user.email,
            role:user.role,
          accountStatus: user.account_status,

        },
    });
    } catch (error:unknown) {
         console.error("Login error:", error);

    res.status(500).json({
      message: "Internal server error.",
    });
    }
}