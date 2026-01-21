import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/construction_tracker";
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  return mongoose.connection;
}
