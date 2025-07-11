import type { VercelRequest, VercelResponse } from "@vercel/node";
import connectDB from "../../lib/db";
import User from "../../models/UserModel";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST method is allowed" });
  }

  await connectDB();

  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const newUser = new User({ username, password, role: "admin" });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: "Admin account created successfully!",
      user: { id: newUser._id, username: newUser.username },
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}
