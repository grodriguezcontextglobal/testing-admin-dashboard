import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Space, Tag, Tooltip } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import RefreshButton from "../../../../components/utils/UX/RefreshButton";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { TextFontSize14LineHeight20 } from "../../../../styles/global/TextFontSize14LineHeight20";
import { Title } from "../../../../styles/global/Title";
import { CustomerDatabase } from "./table/CustomerDatabase";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";
import { useSelector } from "react-redux";
import {
  CONSUMER_STATUSES,
  toggleStatusFilter,
} from "./utils/consumerStatusFilter";

const CustomerInformationSection = () => {
  const { register, watch } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const queryClient = useQueryClient();

  /* The legend was read-only, so finding the consumers who still owe a device
     meant opening the Status column's dropdown — three clicks away from a row
     of labels that already named exactly that group. The pills now are the
     filter: one selection, shared with the column, clearable by clicking the
     active pill again. */
  const [statusFilter, setStatusFilter] = useState(null);
  const filtering = statusFilter !== null;

  const refreshCustomerDatabase = async () => {
    await clearCacheMemory(`event=${event.id}&company=${user.companyData.id}`);
    return queryClient.resetQueries({ queryKey: ["customerDatabase"] });
  };
  return (
    <>
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Typography
            style={{
              ...Title,
              fontSize: "28px",
              padding: 0,
              width: "fit-content",
            }}
          >
            Search consumers:&nbsp;
          </Typography>
          <Grid item xs sm md lg>
            <OutlinedInput
              {...register("searchCustomer")}
              style={OutlinedInputStyle}
              fullWidth
              placeholder="Search customer here..."
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyIcon />
                </InputAdornment>
              }
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid
        marginY={5}
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        <RefreshButton propsFn={refreshCustomerDatabase} />
        <Grid>
          <Space>
            {CONSUMER_STATUSES.map((status) => {
              const selected = statusFilter === status.value;
              return (
                <Tooltip
                  key={status.value}
                  title={
                    selected
                      ? "Showing only these consumers. Click to show all again."
                      : status.description
                  }
                >
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setStatusFilter((current) =>
                        toggleStatusFilter(current, status.value),
                      )
                    }
                    style={{
                      border: "none",
                      background: "none",
                      padding: 0,
                      cursor: "pointer",
                      /* Dim the buckets that are being filtered out, so which
                         one is doing it is legible without reading the table. */
                      opacity: !filtering || selected ? 1 : 0.45,
                    }}
                  >
                    <Tag
                      color={status.backgroundColor}
                      style={{
                        ...TextFontSize14LineHeight20,
                        letterSpacing: "0.00938em",
                        fontWeight: 500,
                        color: status.color,
                        borderRadius: "16px",
                        padding: "2px 8px",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        boxShadow: selected ? `0 0 0 2px ${status.color}` : "none",
                      }}
                    >
                      <p style={{ color: status.color }}>{status.label}</p>
                    </Tag>
                  </button>
                </Tooltip>
              );
            })}
          </Space>
        </Grid>
        <Grid item xs={12}>
          <CustomerDatabase
            searchAttendees={watch("searchCustomer")}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default CustomerInformationSection;