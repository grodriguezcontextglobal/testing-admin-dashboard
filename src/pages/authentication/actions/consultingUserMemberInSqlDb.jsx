import { devitrakApi } from "../../../api/devitrakApi";
import { checkArray } from "../../../components/utils/checkArray";

const consultingUserMemberInSqlDb = async ({ref, user, token}) => {
        const config = token ? { headers: { "x-token": token } } : {};
        if (ref.current.userSQL) {
          const consultingNewStaffMember = await devitrakApi.post(
            "/db_staff/consulting-member",
            { staff_id: ref.current.userSQL.member.insertId },
            config
          );
          if (consultingNewStaffMember.data) {
            const sqlMemberInfo = checkArray(consultingNewStaffMember.data.member);
            return (ref.current = {
              ...ref.current,
              sqlMemberInfo: sqlMemberInfo,
            });
          }
        } else {
          const consultingNewStaffMember = await devitrakApi.post(
            "/db_staff/consulting-member",
            { email: user.email },
            config
          );
          if (consultingNewStaffMember.data) {
            const sqlMemberInfo = checkArray(consultingNewStaffMember.data.member);
            return (ref.current = {
              ...ref.current,
              sqlMemberInfo: sqlMemberInfo,
            });
          }
        }
      };
    
export default consultingUserMemberInSqlDb