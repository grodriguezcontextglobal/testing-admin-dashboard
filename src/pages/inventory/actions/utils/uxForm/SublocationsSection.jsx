import { Grid } from "@mui/material";
import Breadcrumb from "../../../../../components/UX/breadcrumbs/Breadcrumb";
import Chip from "../../../../../components/UX/Chip/Chip";

const SublocationsSection = ({ subLocationsSubmitted, watch, setSubLocationsSubmitted}) => {
  return (
          <Grid item xs={12} sm={12} md={12} lg={12}>
        <Breadcrumb
          style={{
            display:subLocationsSubmitted.length > 0 ?"block":"none",
            width: "100%",
          }}
          items={[
            {
              title: (
                <p
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                    margin: "auto",
                    padding: 0,
                    fontFamily: "Inter",
                    width: "fit-content",
                  }}
                >
                  {watch("location")}
                </p>
              ),
            },
            ...subLocationsSubmitted.map((subLocation, index) => {
              return {
                title: (
                  <Chip
                    variant="ghost"
                    style={{
                      margin: 0,
                      padding: 0,
                      alignItems: "flex-start",
                    }}
                    label={subLocation}
                    onDelete={() =>
                      setSubLocationsSubmitted(
                        subLocationsSubmitted.filter((_, i) => i !== index),
                      )
                    }
                  />
                ),
              };
            }),
          ]}
        />
      </Grid>

  )
}

export default SublocationsSection