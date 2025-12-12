import { useState } from "react";
import { Typography, useMediaQuery, useTheme } from "@mui/material";
import { NavLink } from "react-router-dom";
import { Divider } from "antd";
import Return from "./return/Return";
import Lost from "./return/Lost";

const CustomizedSwitch = ({ state, handler }) => {
  const tabOptions = [
    {
      label: "Return device",
      route: true,
      permission: [0, 1, 2, 3, 4],
    },
    {
      label: "Mark device as Lost",
      route: false,
      permission: [0, 1, 2, 3, 4],
    },
  ];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <nav
      style={{
        display: "flex",
        gap: isMobile ? "8px" : "16px",
        minWidth: "min-content",
        padding: isMobile ? "8px 0" : "0",
      }}
    >
      {tabOptions.map((option) => {
        return (
          <NavLink
            key={option.label}
            style={({ state }) => ({
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: isMobile ? "4px 8px" : "1px 4px 11px",
              gap: "8px",
              borderBottom:
                state === option.route
                  ? "1px solid #004EEB"
                  : "rgba(0, 0, 0, 0.88)",
              whiteSpace: "nowrap",
            })}
          >
            <button
              onClick={() => handler(!state)}
              style={{
                width: "100%",
                outline: "none",
                border: "none",
                backgroundColor: "transparent",
              }}
            >
              <Typography
                sx={{
                  color: () => (state === option.route ? "#004EEB" : "#667085"),
                  fontFamily: "Inter",
                  fontSize: { xs: "12px", sm: "14px" },
                  fontWeight: 600,
                  lineHeight: "20px",
                }}
              >
                {option.label}
              </Typography>
            </button>
          </NavLink>
        );
      })}
    </nav>
  );
};

const ReturnOptions = ({ storedRecord, setStoredRecord,modalHandler }) => {
  const [checked, setChecked] = useState(true);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin:"0 0 -1.5rem"
        }}
      >
        <CustomizedSwitch state={checked} handler={setChecked} />
      </div>
      <Divider />
      {checked ? (
        <Return storedRecord={storedRecord} modalHandler={modalHandler} setStoredRecord={setStoredRecord} />
      ) : (
        <Lost storedRecord={storedRecord} modalHandler={modalHandler} />
      )}
    </div>
  );
};

export default ReturnOptions;
