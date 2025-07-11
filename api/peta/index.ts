import type { VercelRequest, VercelResponse } from "@vercel/node";
import connectDB from "../../lib/db";
import Rts from "../../models/PetaModel";
import Pekerjaan from "../../models/PekerjaanModel";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Only GET method is allowed" });
  }
  await connectDB();
  try {
    const docs = await Rts.find({ type: "FeatureCollection" }).lean();
    const dominantGenderData = await Pekerjaan.aggregate([
      {
        $group: {
          _id: { rt: "$RT", rw: "$RW", jenisKelamin: "$Jenis Kelamin" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.rt": 1, "_id.rw": 1, count: -1 } },
      {
        $group: {
          _id: { rt: "$_id.rt", rw: "$_id.rw" },
          mostDominantGender: { $first: "$_id.jenisKelamin" },
          totalPopulation: { $sum: "$count" },
        },
      },
      {
        $project: {
          _id: 0,
          rt: "$_id.rt",
          rw: "$_id.rw",
          mostDominantGender: 1,
          totalPopulation: 1,
        },
      },
    ]);
    const genderMap = new Map();
    dominantGenderData.forEach((item) => {
      genderMap.set(`${item.rt}-${item.rw}`, {
        gender: item.mostDominantGender,
        total: item.totalPopulation,
      });
    });
    const features = docs.flatMap((doc) => {
      if (!doc.features || !Array.isArray(doc.features)) return [];
      return doc.features.map((feature) => {
        const { nmsls, nmkec, nmdesa } = feature.properties;
        const rtMatch = nmsls ? nmsls.match(/RT\s(\S+)/) : null;
        const rwMatch = nmsls ? nmsls.match(/RW\s(\S+)/) : null;
        const dusunMatch = nmsls ? nmsls.match(/DUSUN\s(.+)/i) : null;
        const rt = rtMatch ? parseInt(rtMatch[1], 10) : null;
        const rw = rwMatch ? parseInt(rwMatch[1], 10) : null;
        const dominantInfo =
          rt !== null && rw !== null ? genderMap.get(`${rt}-${rw}`) : null;
        return {
          ...feature,
          properties: {
            ...feature.properties,
            RT: rt,
            RW: rw,
            dusun: dusunMatch ? dusunMatch[1].trim() : "-",
            kecamatan: nmkec || "-",
            nmdesa: nmdesa || "Data Tidak Tersedia",
            dominantGender: dominantInfo ? dominantInfo.gender : null,
            totalPopulation: dominantInfo ? dominantInfo.total : 0,
          },
        };
      });
    });
    res.status(200).json({ type: "FeatureCollection", features });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch GeoJSON data", error: error.message });
  }
}
