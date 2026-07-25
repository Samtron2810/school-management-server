import { Readable } from "stream";

import cloudinary from "../config/cloudinary.js";
import ApiError from "./ApiError.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const uploadToCloudinaryWithRetry = (
  file,
  folder = "tronschool",
  retries = 3,
) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new ApiError(400, "No file provided."));
    }

    const attempt = (remaining) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        async (error, result) => {
          if (error) {
            if (remaining > 1) {
              await wait((retries - remaining + 1) * 1000);
              return attempt(remaining - 1);
            }

            return reject(
              new ApiError(
                500,
                "Cloudinary upload failed after multiple attempts.",
              ),
            );
          }

          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(stream);
    };

    attempt(retries);
  });
};

export default uploadToCloudinaryWithRetry;
