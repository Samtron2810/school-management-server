import cloudinary from "../config/cloudinary.js";

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;

  return await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};

export default deleteFromCloudinary;
