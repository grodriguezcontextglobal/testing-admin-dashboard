import { devitrakApi } from "../../../api/devitrakApi";

const insertingUserMemberInSqlBd = async ({ props, user, ref }) => {
  const insertingNewMemberInCompany = await devitrakApi.post(
    "/db_staff/new_member",
    {
      first_name: user.name,
      last_name: user.lastName,
      email: user.email,
      phone_number: props.main_phone,
    }
  );
  if (insertingNewMemberInCompany.data) {
    ref.current = {
      ...ref.current,
      userSQL: insertingNewMemberInCompany.data,
    };
    return insertingNewMemberInCompany.data;
  }
};

export default insertingUserMemberInSqlBd;
