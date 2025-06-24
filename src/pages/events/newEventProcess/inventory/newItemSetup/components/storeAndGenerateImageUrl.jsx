import { devitrakApi } from "../../../../../../api/devitrakApi";
import { convertToBase64 } from "../../../../../../components/utils/convertToBase64";

export const storeAndGenerateImageUrl = async ({
  data,
  imageUploadedValue,
  user,
}) => {
  try {
    if (!imageUploadedValue || !imageUploadedValue[0]) {
      throw new Error("No image file provided");
    }

    const base64 = await convertToBase64(imageUploadedValue[0]);
    const template = {
      imageFile: base64,
      imageID: `${user.companyData.id}_${data.category_name}_${data.item_group}`,
      tags: JSON.stringify([
        user.companyData.id,
        data.item_group,
        data.category_name,
      ]),
      context: `category_name:${data.category_name}|group_name:${
        data.item_group
      }|created_at:${Date.now()}|updated_at:${Date.now()}`,
    };

    const registerImage = await devitrakApi.post(
      "/cloudinary/upload-image",
      template
    );

    await devitrakApi.post(`/image/new_image`, {
      source: registerImage.data.imageUploaded.secure_url,
      category: data.category_name,
      item_group: data.item_group,
      company: user.companyData.id,
    });

    return registerImage.data.imageUploaded.secure_url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
