import { useSelector } from "react-redux";

export const useStaffRoleAndLocations = () => {
  const { user } = useSelector((state) => state.admin);
  const role =
    user.companyData.employees.find((emp) => emp.user === user.email)?.role ||
    "2";
  const locationsViewPermission =
    user.companyData.employees
      .find((emp) => emp.user === user.email)
      ?.preference?.managerLocation?.filter((loc) => !loc?.actions?.view)
      ?.map((loc) => loc.location) || [];

  const locationsAssignPermission =
    user.companyData.employees
      .find((emp) => emp.user === user.email)
      ?.preference?.managerLocation?.filter((loc) => !loc?.actions?.assign)
      ?.map((loc) => loc.location) || [];

  const locationsCreatePermission =
    user.companyData.employees
      .find((emp) => emp.user === user.email)
      ?.preference?.managerLocation?.filter((loc) => !loc?.actions?.create)
      ?.map((loc) => loc.location) || [];

  const locationsDeletePermission =
    user.companyData.employees
      .find((emp) => emp.user === user.email)
      ?.preference?.managerLocation?.filter((loc) => !loc?.actions?.delete)
      ?.map((loc) => loc.location) || [];

  const locationsUpdatePermission =
    user.companyData.employees
      .find((emp) => emp.user === user.email)
      ?.preference?.managerLocation?.filter((loc) => !loc?.actions?.update)
      ?.map((loc) => loc.location) || [];

  const transferPermission =
    user.companyData.employees
      .find((emp) => emp.user === user.email)
      ?.preference?.managerLocation?.filter((loc) => !loc?.actions?.transfer)
      ?.map((loc) => loc.location) || [];
  return {
    role,
    locationsViewPermission,
    locationsAssignPermission,
    locationsCreatePermission,
    locationsDeletePermission,
    locationsUpdatePermission,
    transferPermission,
  };
};
