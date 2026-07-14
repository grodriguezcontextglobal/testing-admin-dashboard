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
import { hasPermission, resolveRoleType } from "../../config/roles";
import AddNewMember from "./components/modals/AddNewMember";
import DeleteMember from "./components/modals/DeleteMember";
import MainTable from "./tables/MainTable";
import OverdueDevicesTable from "./tables/OverdueDevicesTable";
import MembersStatsRow from "./components/MembersStatsRow";
import industriesList from "../../components/navbar/component/industriesList.json";
import { buildManageMembersMenu } from "./utils/mainPageUtils";

const MainPage = () => {
  const location = useLocation();
  const slug = location.state?.referencing || "";
  const { user: adminUser } = useSelector((state) => state.admin);
  const industryLabel =
    industriesList?.[adminUser?.companyData?.industry]?.[0] ?? "Members";
  const titleParams = String(slug || industryLabel).replace(/-/g, " ");
  const [addingNewMember, setAddingNewMember] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);
  const [activeView, setActiveView] = useState("all"); // "all" | "overdue"
  const { register, setValue } = useForm();
  const { user } = useSelector((state) => state.admin);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const roleType = resolveRoleType(user);
  const canAddMembers = hasPermission("member:create", roleType);
  const canDeleteMembers = hasPermission("member:delete", roleType);
  const canManageMembers = canAddMembers || canDeleteMembers;

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
    canAdd: canAddMembers,
    canDelete: canDeleteMembers,
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
          <MembersStatsRow audienceLabel={titleParams.toLowerCase()} />
          <div
            role="tablist"
            style={{
              display: "inline-flex",
              gap: 4,
              padding: 4,
              margin: "0 0 12px",
              background: "var(--gray-50, #f7f7f4)",
              border: "1px solid var(--gray-200, #ddded6)",
              borderRadius: "var(--radius-md, 8px)",
            }}
          >
            {[
              { key: "all", label: `All ${titleParams || "members"}` },
              { key: "overdue", label: "Overdue devices" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeView === tab.key}
                onClick={() => setActiveView(tab.key)}
                style={{
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "var(--radius-sm, 6px)",
                  padding: "8px 12px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  backgroundColor:
                    activeView === tab.key ? "var(--base-white, #fff)" : "transparent",
                  color:
                    activeView === tab.key
                      ? "var(--gray-700, #484d47)"
                      : "var(--gray-500, #777b73)",
                  boxShadow: activeView === tab.key ? "var(--shadow-sm)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {loadingStatus ? (
            <DevitrakLoading />
          ) : activeView === "overdue" ? (
            <OverdueDevicesTable />
          ) : (
            <MainTable state={titleParams} />
          )}
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
