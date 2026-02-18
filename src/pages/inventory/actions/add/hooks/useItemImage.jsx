import { useState, useEffect } from "react";
import { message } from "antd";
import { convertToBase64 } from "../../../../../components/utils/convertToBase64";
import { storeAndGenerateImageUrl } from "../../utils/EditBulkActionOptions";

const useItemImage = ({ watch, user }) => {
  const [imageUploadedValue, setImageUploadedValue] = useState(null);
  const [displayPreviewImage, setDisplayPreviewImage] = useState(false);
  const [imageUrlGenerated, setImageUrlGenerated] = useState(null);
  const [convertImageTo64ForPreview, setConvertImageTo64ForPreview] = useState(null);

  useEffect(() => {
    if (imageUploadedValue?.length > 0) {
      const triggerImageInto64 = async () => {
        const base64 = await convertToBase64(imageUploadedValue[0]);
        setConvertImageTo64ForPreview(base64);
        setDisplayPreviewImage(true);
      };
      triggerImageInto64();
    } else {
      setConvertImageTo64ForPreview(null);
      setDisplayPreviewImage(false);
      setImageUrlGenerated(null);
    }
  }, [imageUploadedValue]);

  const acceptAndGenerateImage = async () => {
    try {
      if (
        imageUploadedValue?.length > 0 &&
        imageUploadedValue[0].size > 5242880
      ) {
        return alert(
          "Image is bigger than allow. Please resize the image or select a new one."
        );
      }
      if (!watch("category_name") || !watch("item_group")) {
        return alert("Category name and item group are required.");
      }
      const data = {
        category_name: watch("category_name"),
        item_group: watch("item_group"),
      };

      const img_url = await storeAndGenerateImageUrl({
        data,
        imageUploadedValue,
        user,
      });

      setImageUrlGenerated(img_url);
      return message.success("Image was successfully accepted.");
    } catch (error) {
      message.error("Failed to upload image: " + error.message);
    }
  };

  return {
    imageUploadedValue,
    setImageUploadedValue,
    displayPreviewImage,
    setDisplayPreviewImage,
    imageUrlGenerated,
    setImageUrlGenerated,
    convertImageTo64ForPreview,
    setConvertImageTo64ForPreview,
    acceptAndGenerateImage,
  };
};

export default useItemImage;
