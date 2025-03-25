import { devitrakApi } from "../../../api/devitrakApi";
import ImageUploaderFormat from "../../../classes/imageCloudinaryFormat";

const userRegistrationProcess = async ({ user, companyValue, ref }) => {
  try {
    const newAdminUserTemplate = {
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      company: companyValue,
      question: "What's your company name",
      answer: String(companyValue).toLowerCase(),
      role: "0",
      super_user: true,
      online: true,
      companiesAssigned: [
        {
          company: companyValue,
          active: true,
          super_user: false,
          role: "0",
          inventory_location: [],
        },
      ],

      data: {
        ...user.data,
      },
    };
    const resp = await devitrakApi.post(
      "/admin/new_admin_user",
      newAdminUserTemplate
    );
    if (resp.data) {
      if (user.imageProfile.length > 0) {
        const templateImageUpload = new ImageUploaderFormat(
          user.imageProfile,
          "",
          "",
          "",
          user.name,
          user.lastName,
          resp.data.uid,
          ""
        );
        const uploadingProfileImage = await devitrakApi.post(
          "/cloudinary/upload-image",
          templateImageUpload.staff_uploader()
        );
        if (uploadingProfileImage.data) {
          await devitrakApi.post(`/admin-user/${resp.data.uid}`, {
            imageProfile: uploadingProfileImage.data.secure_url,
            imageID: resp.data.uid,
          });
        }
        ref.current = {
          ...ref.current,
          userRegistration: {
            data: resp.data.entire,
            uid: resp.data.uid,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            phone: resp.data.entire.phone,
            role: "0",
            company: user.company,
            imageProfile: uploadingProfileImage.data.secure_url,
            // token: resp.data.token,
          },
        };
      }
      return (ref.current = {
        ...ref.current,
        userRegistration: {
          data: resp.data.entire,
          uid: resp.data.uid,
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          phone: resp.data.entire.phone,
          role: "0",
          company: user.company,
          imageProfile: "",
          // token: resp.data.token,
        },
      });
    }
    return resp.data;
  } catch (error) {
    throw new Error(error);
  }
};

export default userRegistrationProcess;
