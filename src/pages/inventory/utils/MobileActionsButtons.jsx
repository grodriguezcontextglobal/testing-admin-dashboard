import { Grid } from "@mui/material";
import LightBlueButtonComponent from "../../../components/UX/buttons/LigthBlueButton";
import { EditIcon } from "../../../components/icons/EditIcon";
import { Link } from "react-router-dom";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import { RectangleBluePlusIcon } from "../../../components/icons/RectangleBluePlusIcon";
import PropTypes from "prop-types";
import { useMemo } from "react";
import { getPermittedLocations } from "../actions/utils/permissionUtils";

const MobileActionsButtons = ({ user, setOpenCreateLocationModal }) => {
  // Check permissions
  const { canCreate, canUpdate } = useMemo(() => {
    const createLocations = getPermittedLocations(user, "create");
    const updateLocations = getPermittedLocations(user, "update");

    // If getPermittedLocations returns null (Role 0) or a non-empty array, access is allowed.
    const canCreate = createLocations === null || createLocations.length > 0;
    const canUpdate = updateLocations === null || updateLocations.length > 0;

    return { canCreate, canUpdate };
  }, [user]);

  return (
    <Grid
      gap={1}
      sx={{
        display: { xs: "flex", sm: "flex", md: "none", lg: "none" },
        marginTop: "10px",
      }}
      container
    >
              {canCreate && (
                <BlueButtonComponent
                  title={"Create Location"}
                  styles={{ with: "100%" }}
                  icon={
                    <WhiteCirclePlusIcon style={{ height: "21px", margin: "auto" }} />
                  }
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
              icon={
                <EditIcon
                  stroke={"var(--blue-dark--800)"}
                  width={21}
                  height={18}
                  hoverStroke={"var(--basewhite)"}
                />
              }
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
                icon={
                  <WhiteCirclePlusIcon
                    hoverStroke={"var(--blue-dark--800)"}
                    width={21}
                    height={18}
                  />
                }
                buttonType="button"
                titleStyles={{
                  textTransform: "none",
                  with: "100%",
                  gap: "2px",
                }}
              />
            </Link>
          </Grid>
          <Grid item xs={12} sm={12}>
            <Link style={{ width: "100%" }} to="/inventory/new-item">
              <LightBlueButtonComponent
                title={"Add one item"}
                func={() => null}
                icon={
                  <RectangleBluePlusIcon
                    stroke={"var(--blue-dark--800)"}
                    width={21}
                    height={18}
                    hoverStroke={"var(--basewhite)"}
                  />
                }
                buttonType="button"
                titleStyles={{
                  textTransform: "none",
                  with: "100%",
                  gap: "2px",
                }}
              />
            </Link>
          </Grid>
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
