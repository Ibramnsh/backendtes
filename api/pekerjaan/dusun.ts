import type { VercelRequest, VercelResponse } from "@vercel/node";
import connectDB from "../../lib/db";
import Pekerjaan from "../../models/PekerjaanModel";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Only GET method is allowed" });
  }

  await connectDB();

  try {
    const dusunList = await Pekerjaan.distinct("Dusun");
    const filteredDusunList = dusunList.filter(
      (dusun) => dusun != null && dusun !== ""
    );
    res.status(200).json(filteredDusunList);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch dusun list", error: error.message });
  }
}
