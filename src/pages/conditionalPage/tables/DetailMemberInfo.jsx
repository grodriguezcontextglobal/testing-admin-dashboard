import { Grid } from "@mui/material";
import { Table } from "antd";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { columns } from "./detailTableComponents/columns";
import "../../../styles/global/ant-table.css";
const DetailMemberInfo = () => {
  const { memberInfo } = useSelector((state) => state.member);
  const { user } = useSelector((state) => state.admin);
  const memberId = memberInfo?.member_id;
  const devicesAssignedActive = useQuery({
    queryKey: ["devicesAssignedActive"],
    queryFn: () =>
      devitrakApi.post("/db_member/retrieve-members-assigned-devices", {
        member_id: memberId,
        company_id: user.sqlInfo.company_id,
      }),
    enabled: !!memberId && !!user.sqlInfo.company_id,
  });
  return (
    <Grid
      style={{
        padding: "5px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
      container
    >
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        margin={"2rem auto 1rem"}
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <p
          style={{
            ...TextFontSize20LineHeight30,
            fontWeight: 500,
            color: "#000",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          Current assigned devices:&nbsp;
        </p>
      </Grid>
      <Grid
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        item
        xs={12}
      >
        <Table
          sticky
          size="large"
          rowKey="device_id"
          columns={columns()}
          style={{ width: "100%" }}
          dataSource={devicesAssignedActive?.data?.data?.rows || []}
          pagination={{
            position: ["bottomCenter"],
          }}
          className="table-ant-customized"
        />
      </Grid>
    </Grid>
  );
};

export default DetailMemberInfo;
