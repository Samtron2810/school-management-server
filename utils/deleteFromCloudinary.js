import cloudinary from "../config/cloudinary.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deleteFromCloudinary = async (
  publicId,
  resourceType = "image",
  retries = 3,
) => {
  if (!publicId) return;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (error) {
      if (attempt === retries) {
        console.error(
          `Cloudinary deletion failed after ${retries} attempts for publicId: ${publicId}`,
        );
        throw error;
      }

      await wait(attempt * 1000);
    }
  }
};

export default deleteFromCloudinary;
