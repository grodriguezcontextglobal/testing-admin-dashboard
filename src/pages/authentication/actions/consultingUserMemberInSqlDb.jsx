import { devitrakApi } from "../../../api/devitrakApi";
import { checkArray } from "../../../components/utils/checkArray";

const consultingUserMemberInSqlDb = async ({ref, user}) => {
        if (ref.current.userSQL) {
          const consultingNewStaffMember = await devitrakApi.post(
            "/db_staff/consulting-member",
            { staff_id: ref.current.userSQL.member.insertId }
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
            { email: user.email }
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