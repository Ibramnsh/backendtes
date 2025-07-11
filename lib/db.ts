import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGO_URI environment variable inside .env.local"
  );
}

// Cache koneksi untuk menghindari koneksi berulang di lingkungan serverless
let cachedConnection: typeof mongoose | null = null;

async function connectDB() {
  if (cachedConnection) {
    return cachedConnection;
  }
  try {
    const opts = {
      bufferCommands: false,
    };
    cachedConnection = await mongoose.connect(MONGODB_URI, opts);
    console.log("New MongoDB connection established.");
    return cachedConnection;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw new Error("Database connection failed");
  }
}

export default connectDB;
