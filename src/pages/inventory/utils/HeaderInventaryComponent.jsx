import {
  Grid,
} from "@mui/material";
import { Dropdown } from "antd";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import { useStaffRoleAndLocations } from "../../../utils/checkStaffRoleAndLocations";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import { useSelector } from "react-redux";
import PlusSquareDarkIcon from "../../../components/icons/PlusSquareDarkIcon";
import ExcelIcon from "../../../components/icons/ExcelIcon";
import PlusCircleWhiteIcon from "../../../components/icons/PlusCircleWhiteIcon";
import AnnotationPlusIcon from "../../../components/icons/AnnotationPlusIcon";
import CheckSquareBrokenIcon from "../../../components/icons/CheckSquareBrokenIcon";
import PencilLineIcon from "../../../components/icons/PencilLineIcon";
import TrashIcon from "../../../components/icons/TrashIcon";
import Vertical3Dots from "../../../components/icons/Vertical3Dots";

/**
 * HeaderInventaryComponent
 *
 * Renders the page header and action buttons for the inventory page.
 *
 * Responsibilities:
 * - Displays the company inventory title.
 * - Keeps one primary action ("Add a group of items") and one secondary
 *   action ("Import inventory") visible; folds the remaining actions into
 *   an overflow menu.
 * - Checks `user.companyData.employees[].preference.managerLocation` for
 *   `create` and `update` permissions.
 *
 * @param {Object} props
 * @param {Object} props.user - User data object containing permissions.
 * @param {Object} props.TextFontSize30LineHeight38 - Style object for the title.
 * @param {Function} props.setAddInventoryFromXLSXFileModal - Callback to open the import modal.
 * @param {Function} props.setOpenCreateLocationModal - Callback to open the create-location modal.
 * @param {Function} props.setOpenCheckInDevicesFromEvent - Callback to open the check-in modal.
 * @param {Function} props.setOpenDeleteItemModal - Callback to open the delete-group modal.
 */
const HeaderInventaryComponent = ({
  user,
  TextFontSize30LineHeight38,
  setAddInventoryFromXLSXFileModal,
  setOpenCreateLocationModal,
  setOpenCheckInDevicesFromEvent,
  setOpenDeleteItemModal,
}) => {
  const {
    isAdmin
  } = useStaffRoleAndLocations();
  const navigate = useNavigate();
  const { role, locations } = useSelector((state) => state.permission);
  // Check permissions
  const canCreate = role === "0" ? true : locations.some(item => item.preference.managerLocation.actions.create)
  const canUpdate = role === "0" ? true : locations.some(item => item.preference.managerLocation.actions.update)
  const canManageDevices =
    role === "0" ||
    locations?.some(
      (location) =>
        location.actions?.create &&
        location.actions?.assign &&
        location.actions?.delete &&
        location.actions?.transfer,
    );

  const overflowMenuLabel = (icon, text) => (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: "8px",
        textAlign: "left",
        width: "100%",
      }}
    >
      {icon}
      <span>{text}</span>
    </span>
  );

  const overflowMenuItems = [
    canUpdate && {
      key: "update-group",
      label: overflowMenuLabel(
        <PencilLineIcon width={18} height={18} stroke="#344054" />,
        "Update a group of items",
      ),
      onClick: () => navigate("/inventory/edit-group"),
    },
    isAdmin && {
      key: "create-location",
      label: overflowMenuLabel(
        <AnnotationPlusIcon width={18} height={18} />,
        "Create location",
      ),
      onClick: () => setOpenCreateLocationModal(true),
    },
    canManageDevices && {
      key: "check-in-devices",
      label: overflowMenuLabel(
        <CheckSquareBrokenIcon width={18} height={18} stroke="#344054" />,
        "Check in devices from events",
      ),
      onClick: () => setOpenCheckInDevicesFromEvent?.(true),
    },
    canManageDevices && { type: "divider" },
    canManageDevices && {
      key: "delete-group",
      label: overflowMenuLabel(
        <TrashIcon width={18} height={18} stroke="#B42318" />,
        "Delete group",
      ),
      danger: true,
      onClick: () => setOpenDeleteItemModal?.(true),
    },
  ].filter(Boolean);

  return (
    <Grid
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "24px",
        marginBottom: "24px",
      }}
      item
      xs={12}
      sm={12}
      md={12}
      lg={12}
    >
      <Grid marginY={0} item xs={12} sm={12} md={4} lg={4}>
        <p style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}>
          Inventory
        </p>
      </Grid>
      <Grid
        textAlign={"right"}
        display={"flex"}
        justifyContent={"flex-end"}
        alignItems={"center"}
        gap={1}
        sx={{ display: { xs: "none", sm: "none", md: "flex", lg: "flex" } }}
        item
        md={8}
        lg={8}
      >
        {canCreate && (
          <Link to="/inventory/new-bulk-items">
            <BlueButtonComponent
              title={"Add a group of items"}
              styles={{ with: "100%" }}
              iconLeading={<PlusCircleWhiteIcon />}
              buttonType="button"
              titleStyles={{
                textTransform: "none",
                with: "100%",
                gap: "2px",
              }}
              func={() => null}
            />
          </Link>
        )}
        {canCreate && (
          <GrayButtonComponent
            title={"Import inventory (.xlsx)"}
            styles={{ with: "100%" }}
            buttonType="button"
            titleStyles={{
              textTransform: "none",
              with: "100%",
              gap: "2px",
            }}
            iconLeading={<PlusSquareDarkIcon />}
            iconTrailing={<ExcelIcon />}
            func={() => setAddInventoryFromXLSXFileModal(true)}
          />
        )}
        {overflowMenuItems.length > 0 && (
          <Dropdown
            menu={{ items: overflowMenuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <span style={{ display: "inline-flex" }}>
              <GrayButtonComponent
                title={"More Options"}
                ariaLabel="More options"
                buttonType="button"
                titleStyles={{
                  textTransform: "none",
                }}
                iconLeading={<Vertical3Dots stroke="#344054" />}
              />
            </span>
          </Dropdown>
        )}
      </Grid>
    </Grid>
  );
};

HeaderInventaryComponent.propTypes = {
  user: PropTypes.shape({
    role: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    company: PropTypes.string,
    email: PropTypes.string,
    companyData: PropTypes.shape({
      employees: PropTypes.arrayOf(
        PropTypes.shape({
          user: PropTypes.string,
          preference: PropTypes.object,
        })
      ),
    }),
  }).isRequired,
  TextFontSize30LineHeight38: PropTypes.object,
  setAddInventoryFromXLSXFileModal: PropTypes.func,
  setOpenCreateLocationModal: PropTypes.func,
  setOpenCheckInDevicesFromEvent: PropTypes.func,
  setOpenDeleteItemModal: PropTypes.func,
};

export default HeaderInventaryComponent;
