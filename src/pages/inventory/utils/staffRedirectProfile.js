/**
 * The staff profile the inventory filters open when someone clicks a staff
 * member's email: the company's employee record joined with the admin user
 * from POST /staff/admin-users. Someone missing from the employees list used
 * to throw on `.status`.
 */
export const buildStaffRedirectProfile = ({ staffEmail, companyData, adminUser }) => {
  const employee = companyData?.employees?.find((entry) => entry.user === staffEmail);
  return {
    ...employee,
    email: staffEmail,
    status: employee?.status,
    adminUserInfo: adminUser,
    companyData,
  };
};
