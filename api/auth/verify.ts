import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticate } from "../../lib/middleware";
import connectDB from "../../lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Only GET method is allowed" });
  }

  await connectDB();

  try {
    const user = await authenticate(req);
    res.status(200).json({ success: true, message: "Token is valid", user });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
}
