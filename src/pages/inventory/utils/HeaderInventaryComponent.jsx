import {
  Grid,
} from "@mui/material";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import LightBlueButtonComponent from "../../../components/UX/buttons/LigthBlueButton";
import { useStaffRoleAndLocations } from "../../../utils/checkStaffRoleAndLocations";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import { useSelector } from "react-redux";

/**
 * HeaderInventaryComponent
 *
 * Renders the page header and action buttons for the inventory page.
 *
 * Responsibilities:
 * - Displays the company inventory title.
 * - Conditionally renders "Import inventory", "Update group", and "Add item" buttons.
 * - Checks `user.companyData.employees[].preference.managerLocation` for `create` and `update` permissions.
 *
 * @param {Object} props
 * @param {Object} props.user - User data object containing permissions.
 * @param {Object} props.TextFontSize30LineHeight38 - Style object for the title.
 * @param {Function} props.setAddInventoryFromXLSXFileModal - Callback to open the import modal.
 */
const HeaderInventaryComponent = ({
  user,
  TextFontSize30LineHeight38,
  setAddInventoryFromXLSXFileModal,
  setOpenCreateLocationModal,
}) => {
  const {
    isAdmin
  } = useStaffRoleAndLocations();
  const { role, locations } = useSelector((state) => state.permission);
  // Check permissions
  const canCreate = role === "0" ? true : locations.some(item => item.preference.managerLocation.actions.create)
  const canUpdate = role === "0" ? true : locations.some(item => item.preference.managerLocation.actions.update)
  return (
    <Grid
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
      item
      xs={12}
      sm={12}
      md={12}
      lg={12}
    >
      <Grid marginY={0} item xs={12} sm={12} md={4} lg={4}>
        <p style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}>
          Inventory of {user.company}
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
          <GrayButtonComponent
            title={"Import inventory (.xlsx)"}
            styles={{ with: "100%" }}
            buttonType="button"
            titleStyles={{
              textTransform: "none",
              with: "100%",
              gap: "2px",
            }}
            func={() => setAddInventoryFromXLSXFileModal(true)}
          />
        )}
        {isAdmin && (
          <BlueButtonComponent
            title={"Create Location"}
            styles={{ with: "100%" }}
            buttonType="button"
            titleStyles={{
              textTransform: "none",
              with: "100%",
              gap: "2px",
            }}
            func={() => setOpenCreateLocationModal(true)}
          />
        )}

        {canUpdate && (
          <Link to="/inventory/edit-group">
            <LightBlueButtonComponent
              title={"Update a group of items"}
              styles={{ with: "100%" }}
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
          <>
            <Link to="/inventory/new-bulk-items">
              <BlueButtonComponent
                title={"Add a group of items"}
                styles={{ with: "100%" }}
                // icon={
                //   <WhiteCirclePlusIcon
                //     style={{ height: "21px", margin: "auto" }}
                //   />
                // }
                buttonType="button"
                titleStyles={{
                  textTransform: "none",
                  with: "100%",
                  gap: "2px",
                }}
                func={() => null}
              />
            </Link>
          </>
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
};

export default HeaderInventaryComponent;
