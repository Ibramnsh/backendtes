import type { VercelRequest, VercelResponse } from "@vercel/node";
import connectDB from "../../lib/db";
import Pekerjaan from "../../models/PekerjaanModel";
import { authenticate } from "../../lib/middleware";
import mongoose from "mongoose";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();

  const { id } = req.query;

  if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  try {
    // Rute GET by ID tidak memerlukan autentikasi
    if (req.method === "GET") {
      const data = await Pekerjaan.findById(id);
      if (!data) return res.status(404).json({ message: "Data not found" });
      return res.status(200).json(data);
    }

    // Metode lain (PUT, DELETE) memerlukan autentikasi
    await authenticate(req);

    if (req.method === "PUT") {
      const updatedData = await Pekerjaan.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!updatedData)
        return res.status(404).json({ message: "Data not found" });
      return res.status(200).json(updatedData);
    }

    if (req.method === "DELETE") {
      const deletedData = await Pekerjaan.findByIdAndDelete(id);
      if (!deletedData)
        return res.status(404).json({ message: "Data not found" });
      return res.status(200).json({ message: "Data deleted successfully" });
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
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
