/* eslint-disable no-unused-vars */
import { Grid, InputLabel, Typography } from "@mui/material";
import { Select } from "antd";
import { buildActionFilterOptions } from "../utils/staffActivityLogUtils";

const Header = ({ staffOptions, filters, onFiltersChange }) => {
  const onChangeUser = (value) => {
    onFiltersChange((prev) => ({ ...prev, staffMemberId: value }));
  };
  const onSearchUser = (value) => {
    // console.log("search:", value);
  };

  const onChangeActions = (value) => {
    onFiltersChange((prev) => ({ ...prev, action: value }));
  };
  const onSearchActions = (value) => {
    // console.log("search:", value);
  };
  // Filter `option.label` match the user type `input`
  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
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
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        container
      >
        <Grid
          display={"flex"}
          flexDirection={"column"}
          alignSelf={"stretch"}
          marginY={0}
          item
          xs={5}
          sm={5}
          md={6}
        >
          <Typography
            textTransform={"none"}
            style={{
              color: "var(--gray-900, #171d1a)",
              lineHeight: "38px",
            }}
            textAlign={"left"}
            fontWeight={600}
            fontFamily={"Inter"}
            fontSize={"18px"}
            lineHeight={"28px"}
          >
            Audit trail
          </Typography>
          <Typography
            textTransform={"none"}
            style={{
              color: "var(--gray-600, #5d615a)",
              lineHeight: "38px",
            }}
            textAlign={"left"}
            fontWeight={400}
            fontFamily={"Inter"}
            fontSize={"14x"}
            lineHeight={"20px"}
          >
            Every action your staff and consumers have taken, most recent first.
          </Typography>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
          marginY={0}
          gap={2}
          item
          xs={5}
          sm={5}
          md={6}
        >
          <Grid
            item
            xs={6}
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            flexDirection={"column"}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                color={"var(--gray-600, #5d615a)"}
                textAlign={"left"}
                fontWeight={500}
                fontFamily={"Inter"}
                fontSize={"14x"}
                lineHeight={"20px"}
              >
                Users
              </Typography>
            </InputLabel>
            <Select
              showSearch
              placeholder="All"
              optionFilterProp="children"
              value={filters?.staffMemberId}
              onChange={onChangeUser}
              onSearch={onSearchUser}
              filterOption={filterOption}
              allowClear
              style={{
                width: "100%",
              }}
              options={staffOptions}
            />
          </Grid>
          <Grid
            item
            xs={6}
            display={"flex"}
            justifyContent={"flex-start"}
            alignItems={"center"}
            flexDirection={"column"}
          >
            <InputLabel style={{ width: "100%" }}>
              <Typography
                textTransform={"none"}
                color={"var(--gray-600, #5d615a)"}
                textAlign={"left"}
                fontWeight={500}
                fontFamily={"Inter"}
                fontSize={"14x"}
                lineHeight={"20px"}
              >
                Action
              </Typography>
            </InputLabel>
            <Select
              showSearch
              placeholder="All"
              optionFilterProp="children"
              value={filters?.action}
              onChange={onChangeActions}
              onSearch={onSearchActions}
              filterOption={filterOption}
              allowClear
              style={{
                width: "100%",
              }}
              options={buildActionFilterOptions()}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Header;
