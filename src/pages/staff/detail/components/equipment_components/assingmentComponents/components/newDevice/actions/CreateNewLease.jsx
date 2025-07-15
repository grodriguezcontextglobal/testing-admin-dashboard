import { devitrakApi } from "../../../../../../../../../api/devitrakApi";

export const createNewLease = async ({
  address,
  profile,
  user,
  formatDate,
  insertId,
}) => {
  const staffMember = await devitrakApi.post("/db_staff/consulting-member", {
    email: profile.email,
  });
  if (staffMember.data.member.length > 0) {
      await devitrakApi.post("/db_lease/new-lease", {
        staff_admin_id: user.sqlMemberInfo.staff_id,
        company_id: user.sqlInfo.company_id,
        subscription_expected_return_data: formatDate(new Date()),
        location: `${address.street} ${address.city} ${address.state} ${address.zip}`,
        staff_member_id: staffMember.data.member.at(-1).staff_id,
        device_id: insertId,
      });
  } else {
    const newStaffMember = await devitrakApi.post("/db_staff/new_member", {
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,
      phone_number: "000-000-0000",
    });
    if (newStaffMember.data.result.insertId) {
        await devitrakApi.post("/db_lease/new-lease", {
          staff_admin_id: user.sqlMemberInfo.staff_id,
          company_id: user.sqlInfo.company_id,
          subscription_expected_return_data: formatDate(new Date()),
          location: `${address.street} ${address.city} ${address.state} ${address.zip}`,
          staff_member_id: newStaffMember.data.result.insertId,
          device_id: insertId,
        });
      
    }
  }
};
