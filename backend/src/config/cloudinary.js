import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";

dotenv.config();
console.log("Cloudinary Config Loaded");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME ? "Loaded" : "Not Loaded");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;
