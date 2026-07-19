import uploadToCloudinary from "../utils/uploadToCloudinary.js";

const uploadFiles = async (files, folder) => {
  const uploads = [];

  for (const file of files) {
    const uploaded = await uploadToCloudinary(file, folder);

    uploads.push({
      originalName: file.originalname,

      fileName: uploaded.display_name,

      url: uploaded.secure_url,

      publicId: uploaded.public_id,

      fileType: file.mimetype,

      fileSize: file.size,

      resourceType: uploaded.resource_type,
    });
  }

  return uploads;
};

export default {
  uploadFiles,
};
