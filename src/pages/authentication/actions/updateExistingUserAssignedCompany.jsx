import { devitrakApi } from "../../../api/devitrakApi";
import { checkArray } from "../../../components/utils/checkArray";

const updateExistingUserAssignedCompany = async ({ user, companyValue, ref }) => {
  const currentUserResp = await devitrakApi.post("/staff/__staff-search", {
    email: user.email,
  });
  const currentUser = checkArray(currentUserResp.data.adminUsers);
  const updatedCompaniesAssigned = [
    ...(currentUser.companiesAssigned ?? []),
    {
      company: companyValue,
      active: true,
      super_user: true,
      role: "0",
      inventory_location: [],
    },
  ];
  const resp = await devitrakApi.patch(`/admin/admin-user/${user.userID}`, {
    companiesAssigned: updatedCompaniesAssigned,
    company: companyValue,
  });
  if (resp.data) {
    ref.current = {
      ...ref.current,
      userRegistration: {
        data: currentUser,
        uid: user.userID,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        role: "0",
        company: companyValue,
        imageProfile: user.imageProfile ?? "",
      },
    };
    return resp.data;
  }
};

export default updateExistingUserAssignedCompany;
