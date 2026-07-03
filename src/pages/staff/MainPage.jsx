import { Icon } from "@iconify/react";
import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { Divider, Dropdown } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { usePermission } from "../../hooks/usePermission";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import DevitrakLoading from "../../components/animation/DevitrakLoading";
import { MagnifyIcon } from "../../components/icons/MagnifyIcon";
import "../../styles/global/OutlineInput.css";
import { OutlinedInputStyle } from "../../styles/global/OutlinedInputStyle";
import { TextFontSize20LineHeight30 } from "../../styles/global/TextFontSize20HeightLine30";
import { Title } from "../../styles/global/Title";
import MainAdminSettingPage from "./MainAdminSettingPage";
import DeleteStaffMember from "./action/DeleteStaffMember";
import { NewStaffMember } from "./action/NewStaffMember";

const MainPage = () => {
  const { register, watch, setValue } = useForm();
  const [modalState, setModalState] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState(false);
  const canManageStaff = usePermission("staff:create");
  const [loadingStatus, setLoadingStatus] = useState(false);

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

  const manageStaffItems = [
    {
      key: "add",
      label: "Add new staff",
      icon: <Icon icon="tabler:user-plus" width={18} />,
      onClick: () => setModalState(true),
    },
    { type: "divider" },
    {
      key: "delete",
      danger: true,
      label: "Delete staff members",
      icon: <Icon icon="tabler:trash" width={18} />,
      onClick: () => setDeleteModalState(true),
    },
  ];

  return (
    <>
      <Grid display={"flex"} alignItems={"center"} justifyContent={"center"} container>
        <Grid item xs={12}>
          <p
            style={{
              ...Title,
              padding: "16px 24px 16px 0",
              textTransform: "none",
              textAlign: "left",
            }}
          >
            Staff
          </p>
        </Grid>

        <Divider style={{ margin: "0 0 16px" }} />

        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          gap={2}
          flexWrap={"wrap"}
          margin={"0 0 0.5rem"}
          item
          xs={12}
        >
          <Grid
            item
            xs={12}
            sm
            md
            lg
            display={"flex"}
            alignItems={"center"}
            gap={"12px"}
            flex={1}
          >
            <p
              style={{
                ...TextFontSize20LineHeight30,
                fontWeight: 500,
                color: "var(--gray-900, #101828)",
                margin: 0,
                whiteSpace: "nowrap",
              }}
            >
              Staff:
            </p>
            <OutlinedInput
              {...register("searchAdmin")}
              style={OutlinedInputStyle}
              fullWidth
              placeholder="Search"
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyIcon />
                </InputAdornment>
              }
            />
          </Grid>

          {canManageStaff && (
            <Dropdown menu={{ items: manageStaffItems }} trigger={["click"]}>
              {/* span wrapper: antd Dropdown injects its toggle onClick + ref
                  here. BlueButton overrides its own onClick with `func`, so it
                  can't receive antd's handler directly — the click bubbles to
                  the span instead, which opens the menu. */}
              <span style={{ display: "inline-flex" }}>
                <BlueButtonComponent
                  title="Manage staff"
                  iconLeading={<Icon icon="tabler:users" width={18} />}
                  iconTrailing={<Icon icon="tabler:chevron-down" width={18} />}
                />
              </span>
            </Dropdown>
          )}
        </Grid>

        <Grid item xs={12}>
          {loadingStatus ? (
            <DevitrakLoading />
          ) : (
            <MainAdminSettingPage
              searchAdmin={watch("searchAdmin")}
              modalState={modalState}
              deletingStaffMembers={deleteModalState}
              loadingRenderInfoStaff={loadingStatus}
            />
          )}
        </Grid>
      </Grid>

      {modalState && (
        <NewStaffMember
          modalState={modalState}
          setModalState={setModalState}
          deletingStaffMembers={deleteModalState}
        />
      )}
      {deleteModalState && (
        <DeleteStaffMember
          modalState={deleteModalState}
          setModalState={setDeleteModalState}
        />
      )}
    </>
  );
};

export default MainPage;
