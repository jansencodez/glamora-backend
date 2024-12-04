import cloudinary from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET, // Ensure this is correct
});

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const timestamp = Math.round(new Date().getTime() / 1000); // Current timestamp

    // Prepare the upload params
    const upload_params = {
      folder,
      timestamp, // Add timestamp for security
    };

    // Upload the image with Cloudinary's auto-generated signature
    const stream = cloudinary.v2.uploader.upload_stream(
      upload_params,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream); // Upload the image
  });
};

export { uploadToCloudinary };
