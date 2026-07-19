import { Readable } from "stream";

import cloudinary from "../config/cloudinary.js";
import ApiError from "./ApiError.js";

const uploadToCloudinary = (file, folder = "tronschool") => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new ApiError(400, "No file provided."));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return reject(new ApiError(500, "Cloudinary upload failed."));
        }

        resolve(result);
      },
    );

    Readable.from(file.buffer).pipe(stream);
  });
};

export default uploadToCloudinary;
