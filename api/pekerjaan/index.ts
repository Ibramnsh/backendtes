import type { VercelRequest, VercelResponse } from "@vercel/node";
import connectDB from "../../lib/db";
import Pekerjaan from "../../models/PekerjaanModel";
import { authenticate } from "../../lib/middleware";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  try {
    // Rute GET tidak memerlukan autentikasi
    if (req.method === "GET") {
      const { rt, rw } = req.query;
      const query: any = {};
      if (rt && rw) {
        query.RT = parseInt(rt as string);
        query.RW = parseInt(rw as string);
      }
      const data = await Pekerjaan.find(query).lean();
      return res.status(200).json(data);
    }

    // Metode lain (POST, PUT, DELETE) memerlukan autentikasi
    await authenticate(req);

    if (req.method === "POST") {
      const newData = new Pekerjaan(req.body);
      const savedData = await newData.save();
      return res.status(201).json(savedData);
    }

    // Jika metode bukan GET atau POST
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    if (
      error.message.includes("Authorization") ||
      error.message.includes("token")
    ) {
      return res
        .status(401)
        .json({ message: "Authentication Failed", error: error.message });
    }
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
}
