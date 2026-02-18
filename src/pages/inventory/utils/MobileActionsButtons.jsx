import { Grid } from "@mui/material";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import LightBlueButtonComponent from "../../../components/UX/buttons/LigthBlueButton";
import { useStaffRoleAndLocations } from "../../../utils/checkStaffRoleAndLocations";

const MobileActionsButtons = ({ user, setOpenCreateLocationModal }) => {
  // Check permissions
  const {
    isAdmin,locationsCreatePermission, locationsUpdatePermission
  } = useStaffRoleAndLocations();
  // Check permissions
  const canCreate = isAdmin ? isAdmin : locationsCreatePermission.length > 0
  const canUpdate = isAdmin ? isAdmin : locationsUpdatePermission.length > 0


  return (
    <Grid
      gap={1}
      sx={{
        display: { xs: "flex", sm: "flex", md: "none", lg: "none" },
        marginTop: "10px",
      }}
      container
    >
              {canCreate && Number(user.companyData?.employees?.find((emp) => emp.user === user.email)?.role) === 0 && (
                <BlueButtonComponent
                  title={"Create Location"}
                  styles={{ with: "100%" }}
                  // icon={
                  //   <WhiteCirclePlusIcon style={{ height: "21px", margin: "auto" }} />
                  // }
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
        <Grid item xs={12} sm={12}>
          <Link style={{ width: "100%" }} to="/inventory/edit-group">
            <LightBlueButtonComponent
              title={"Update a group of items"}
              func={() => null}
              // icon={
              //   <EditIcon
              //     stroke={"var(--blue-dark--800)"}
              //     width={21}
              //     height={18}
              //     hoverStroke={"var(--basewhite)"}
              //   />
              // }
              buttonType="button"
              titleStyles={{
                textTransform: "none",
                with: "100%",
                gap: "2px",
              }}
            />
          </Link>
        </Grid>
      )}

      {canCreate && (
        <>
          <Grid item xs={12} sm={12}>
            <Link style={{ width: "100%" }} to="/inventory/new-bulk-items">
              <BlueButtonComponent
                title={"Add a group of items"}
                func={() => null}
                // icon={
                //   <WhiteCirclePlusIcon
                //     hoverStroke={"var(--blue-dark--800)"}
                //     width={21}
                //     height={18}
                //   />
                // }
                buttonType="button"
                titleStyles={{
                  textTransform: "none",
                  with: "100%",
                  gap: "2px",
                }}
              />
            </Link>
          </Grid>
          {/* <Grid item xs={12} sm={12}>
            <Link style={{ width: "100%" }} to="/inventory/new-item">
              <LightBlueButtonComponent
                title={"Add one item"}
                func={() => null}
                // icon={
                //   <RectangleBluePlusIcon
                //     stroke={"var(--blue-dark--800)"}
                //     width={21}
                //     height={18}
                //     hoverStroke={"var(--basewhite)"}
                //   />
                // }
                buttonType="button"
                titleStyles={{
                  textTransform: "none",
                  with: "100%",
                  gap: "2px",
                }}
              />
            </Link>
          </Grid> */}
        </>
      )}
    </Grid>
  );
};

MobileActionsButtons.propTypes = {
  user: PropTypes.shape({
    role: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    email: PropTypes.string,
    companyData: PropTypes.shape({
      employees: PropTypes.arrayOf(
        PropTypes.shape({
          user: PropTypes.string,
          preference: PropTypes.shape({
            managerLocation: PropTypes.arrayOf(
              PropTypes.shape({
                actions: PropTypes.shape({
                  create: PropTypes.bool,
                  update: PropTypes.bool,
                }),
              })
            ),
          }),
        })
      ),
    }),
  }).isRequired,
};

export default MobileActionsButtons;
