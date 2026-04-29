
import { convertToBase64 } from "../../../../../../../components/utils/convertToBase64";
import ImageUploaderFormat from "../../../../../../../classes/imageCloudinaryFormat";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { formatDate } from "../../../../../../inventory/utils/dateFormat";

export const handleImageUpload = async (imageFile, companyId, categoryName, itemGroup) => {
    if (imageFile?.length > 0 && imageFile[0].size > 5242880) {
        throw new Error("Image is bigger than allow. Please resize the image or select a new one.");
    }
    if (imageFile?.length > 0) {
        const base64 = await convertToBase64(imageFile[0]);
        const templateImageUpload = new ImageUploaderFormat(
            base64,
            companyId,
            categoryName,
            itemGroup,
            "",
            "",
            "",
            "",
            "",
        );
        const registerImage = await devitrakApi.post(
            "/cloudinary/upload-image",
            templateImageUpload.item_uploader(),
        );

        await devitrakApi.post(`/image/new_image`, {
            source: registerImage.data.imageUploaded.secure_url,
            category: categoryName,
            item_group: itemGroup,
            company: companyId,
        });

        return registerImage.data.imageUploaded.secure_url;
    }
    return null;
};

export const createNewItemTemplate = (data, moreInfo, returningDate, user, img_url) => {
    return {
        category_name: data.category_name,
        item_group: data.item_group,
        cost: data.cost,
        brand: data.brand,
        descript_item: data.descript_item,
        ownership: data.ownership,
        serial_number: data.serial_number,
        warehouse: true,
        main_warehouse: data.tax_location,
        created_at: formatDate(new Date()),
        update_at: formatDate(new Date()),
        company: user.company,
        location: data.location,
        sub_location: JSON.stringify([
            data.sub_location,
            data.sub_location_2,
            data.sub_location_3,
        ]),
        current_location: data.location,
        extra_serial_number: JSON.stringify(moreInfo),
        company_id: user.sqlInfo.company_id,
        return_date: `${data.ownership === "Rent" ? formatDate(returningDate) : null}`,
        container: String(data.container).includes("Yes"),
        containerSpotLimit: data.containerSpotLimit,
        image_url: img_url,
    };
};

