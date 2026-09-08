import { devitrakApi } from "../../../../../../../../../api/devitrakApi";
import { formatLeaseLocation } from "../../../../../../../../../utils/assignmentSelection";

export const createNewLease = async ({
  address,
  profile,
  user,
  formatDate,
  insertId,
  verificationID,
}) => {
  /* Optional address, required field: joined rather than interpolated so a
     blank one is empty instead of "   ", and backed by the company's own
     address, which is where a device handed to staff usually lives. */
  const leaseLocation = formatLeaseLocation({
    address,
    companyAddress: user?.companyData?.address,
  });
  const staffMember = await devitrakApi.post("/db_staff/consulting-member", {
    email: profile.email,
  });
  if (staffMember.data.member.length > 0) {
    await devitrakApi.post("/db_lease/new-lease", {
      staff_admin_id: user.sqlMemberInfo.staff_id,
      company_id: user.sqlInfo.company_id,
      subscription_expected_return_data: formatDate(new Date()),
      location: leaseLocation,
      staff_member_id: staffMember.data.member.at(-1).staff_id,
      device_id: insertId,
      verification_id: verificationID.data.verificationInfo._id,
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
        location: leaseLocation,
        staff_member_id: newStaffMember.data.result.insertId,
        device_id: insertId,
        verification_id: verificationID.data.verificationInfo._id,
      });
    }
  }
};
