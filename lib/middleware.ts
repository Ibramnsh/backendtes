import type { VercelRequest } from "@vercel/node";
import jwt from "jsonwebtoken";
import User from "../models/UserModel";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

interface DecodedToken {
  userId: string;
  username: string;
  role: string;
}

export async function authenticate(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authorization header is missing or invalid.");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new Error("Token is missing.");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error("User not found.");
    }

    return user;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired.");
    }
    throw new Error("Invalid token.");
  }
}
