import { devitrakApi } from "../../../api/devitrakApi";

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
          // token: resp.data.token,
        },
      };
    }
    return resp.data;
  } catch (error) {
    return error;
  }
};

export default userRegistrationProcess;
