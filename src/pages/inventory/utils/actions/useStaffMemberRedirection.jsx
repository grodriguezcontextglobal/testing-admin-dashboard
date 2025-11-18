import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { useNavigate } from "react-router-dom";
import { onAddStaffProfile } from "../../../../store/slices/staffDetailSlide";
import { useEffect, useState } from "react";

const useStaffMemberRedirection = ({ staff }) => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [staffMemberInfo, setStaffMemberInfo] = useState(null);

  const fetchingStaffMemberInfo = async () => {
    if (!staff) return; // guard when no staff selected
    const individual = await devitrakApi.post("/staff/admin-users", {
      email: staff,
    });
    if (individual.data) {
      return setStaffMemberInfo({
        ...user.companyData.employees.find(
          (employee) => employee.user === staff
        ),
        email: staff,
        status: user.companyData.employees.find(
          (employee) => employee.user === staff
        ).status,
        adminUserInfo:individual?.data?.adminUsers[0],
        companyData: user?.companyData,
      });
    }
  };

  useEffect(() => {
    fetchingStaffMemberInfo();
  }, [staff]);

  useEffect(() => {
    if (staffMemberInfo?.adminUserInfo?.id) {
      dispatch(onAddStaffProfile(staffMemberInfo));
      navigate(`/staff/${staffMemberInfo?.adminUserInfo?.id}/main`);
    }
  }, [staffMemberInfo, dispatch, navigate]);

  return //navigate(`/staff/${staffMemberInfo?.adminUserInfo?.id}/main`);
};

export default useStaffMemberRedirection;
