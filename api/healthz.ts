import type { VercelRequest, VercelResponse } from "@vercel/node";
import { query } from "../lib/db.js";

export const config = { maxDuration: 10 };

function hasCloudinary(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    await query("SELECT 1");
    res.json({ status: "ok" });
  } catch {
    res.status(500).json({ status: "error" });
  }
}
