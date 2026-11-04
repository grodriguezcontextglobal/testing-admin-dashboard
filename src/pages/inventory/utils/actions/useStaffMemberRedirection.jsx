import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { useNavigate } from "react-router-dom";
import { onAddStaffProfile } from "../../../../store/slices/staffDetailSlide";
import { useEffect, useRef, useState } from "react";
import { buildStaffRedirectProfile } from "../staffRedirectProfile";

const useStaffMemberRedirection = ({ staff }) => {
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [staffMemberInfo, setStaffMemberInfo] = useState(null);

  // Read at answer time, not a dependency: a company update must not fetch
  // again and navigate a second time.
  const companyData = user?.companyData;
  const companyDataRef = useRef(companyData);
  useEffect(() => {
    companyDataRef.current = companyData;
  }, [companyData]);

  useEffect(() => {
    if (!staff) return undefined; // guard when no staff selected
    let cancelled = false;
    devitrakApi.post("/staff/admin-users", { email: staff }).then((individual) => {
      if (cancelled || !individual.data) return;
      setStaffMemberInfo(
        buildStaffRedirectProfile({
          staffEmail: staff,
          companyData: companyDataRef.current,
          adminUser: individual.data.adminUsers?.[0],
        }),
      );
    });
    // A newer selection wins over an answer still on its way.
    return () => {
      cancelled = true;
    };
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
