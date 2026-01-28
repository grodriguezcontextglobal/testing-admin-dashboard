import { Grid } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import ModalUX from "../../../components/UX/modal/ModalUX";
import "../../../styles/global/ant-table.css";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
import ReturnOptions from "./detailTableComponents/acions/ReturnOptions";
import { columns } from "./detailTableComponents/columns";
import BaseTable from "../../../components/UX/tables/BaseTable";
const DetailMemberInfo = () => {
  const { memberInfo } = useSelector((state) => state.member);
  const { user } = useSelector((state) => state.admin);
  const [editing, setEditing] = useState([]);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [checked, setChecked] = useState(false);
  const [storedRecord, setStoredRecord] = useState(null);
  const memberId = memberInfo?.member_id;
  const devicesAssignedActive = useQuery({
    queryKey: ["devicesAssignedActive"],
    queryFn: () =>
      devitrakApi.post("/db_member/retrieve-members-assigned-devices", {
        member_id: memberId,
        company_id: user.sqlInfo.company_id,
      }),
    enabled: !!memberId && !!user.sqlInfo.company_id,
    staleTime: Infinity,
  });
  const queryClient = useQueryClient();
  const bodyModal = (
    <ReturnOptions
      storedRecord={storedRecord}
      setStoredRecord={setStoredRecord}
      modalHandler={setChecked}
    />
  );
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
        <BaseTable
          sticky
          size="large"
          rowKey="device_id"
          columns={columns({
            editing,
            setEditing,
            updateInfo,
            setUpdateInfo,
            queryClient,
            checked,
            setChecked,
            storedRecord,
            setStoredRecord,
          })}
          style={{ width: "100%" }}
          dataSource={devicesAssignedActive?.data?.data?.rows || []}
          enablePagination={true}
        />
      </Grid>
      {checked && (
        <ModalUX
          openDialog={checked}
          closeModal={() => setChecked(false)}
          body={bodyModal}
        />
      )}
    </Grid>
  );
};

export default DetailMemberInfo;
