import { Icon } from "@iconify/react";
import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { Divider, Dropdown } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import DevitrakLoading from "../../components/animation/DevitrakLoading";
import { MagnifyIcon } from "../../components/icons/MagnifyIcon";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { Title } from "../../styles/global/Title";
import { isCoordinatorLevel } from "../../config/roles";
import AddNewMember from "./components/modals/AddNewMember";
import DeleteMember from "./components/modals/DeleteMember";
import MainTable from "./tables/MainTable";
import { buildManageMembersMenu } from "./utils/mainPageUtils";

const MainPage = () => {
  const location = useLocation();
  const slug = location.state?.referencing || "";
  const titleParams = String(slug || "").replace(/-/g, " ");
  const [addingNewMember, setAddingNewMember] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);
  const { register, setValue } = useForm();
  const { user } = useSelector((state) => state.admin);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const canManageMembers = isCoordinatorLevel(user.roleType);

  useEffect(() => {
    const controller = new AbortController();
    setValue("searchAdmin", ".");
    setLoadingStatus(true);
    setTimeout(() => {
      setValue("searchAdmin", "");
      setLoadingStatus(false);
    }, 900);
    return () => {
      controller.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const manageMembersItems = buildManageMembersMenu({
    titleParams,
    onAdd: () => setAddingNewMember(true),
    onDelete: () => setRemovingMember(true),
  });

  return (
    <>
      <Grid display={"flex"} alignItems={"center"} justifyContent={"center"} container>
        <Grid item xs={12}>
          <p
            style={{
              ...Title,
              padding: "16px 24px 16px 0",
              textTransform: "capitalize",
              textAlign: "left",
            }}
          >
            {titleParams}
          </p>
        </Grid>

        <Divider style={{ margin: "0 0 16px" }} />

        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={"12px"}
          flexWrap={"wrap"}
          margin={"0 0 0.75rem"}
          item
          xs={12}
        >
          <p
            style={{
              ...TextFontSize20LineHeight30,
              fontWeight: 500,
              color: "var(--gray-900, #101828)",
              margin: 0,
              whiteSpace: "nowrap",
              textTransform: "capitalize",
            }}
          >
            {titleParams || "Members"}:
          </p>
          <OutlinedInput
            {...register("searchMember")}
            style={{ ...OutlinedInputStyle, flex: "1 1 auto", minWidth: "240px" }}
            placeholder="Search"
            startAdornment={
              <InputAdornment position="start">
                <MagnifyIcon />
              </InputAdornment>
            }
          />

          {canManageMembers && (
            <Dropdown menu={{ items: manageMembersItems }} trigger={["click"]}>
              {/* span wrapper: antd Dropdown injects its toggle onClick + ref
                  here. BlueButton overrides its own onClick with `func`, so it
                  can't receive antd's handler directly — the click bubbles to
                  the span instead, which opens the menu. */}
              <span style={{ display: "inline-flex" }}>
                <BlueButtonComponent
                  title={`Manage ${titleParams || "members"}`}
                  iconLeading={<Icon icon="tabler:users" width={18} />}
                  iconTrailing={<Icon icon="tabler:chevron-down" width={18} />}
                />
              </span>
            </Dropdown>
          )}
        </Grid>

        <Grid item xs={12} sm={12} md={12} lg={12}>
          {loadingStatus ? <DevitrakLoading /> : <MainTable state={titleParams} />}
        </Grid>
      </Grid>
      {addingNewMember && (
        <AddNewMember
          openModal={addingNewMember}
          setOpenModal={setAddingNewMember}
        />
      )}
      {removingMember && (
        <DeleteMember
          openModal={removingMember}
          setOpenModal={setRemovingMember}
        />
      )}
    </>
  );
};

export default MainPage;
