import { Grid, InputAdornment, OutlinedInput, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Space, Tag, Tooltip } from "antd";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { MagnifyIcon } from "../../../../components/icons/MagnifyIcon";
import RefreshButton from "../../../../components/utils/UX/RefreshButton";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { TextFontSize14LineHeight20 } from "../../../../styles/global/TextFontSize14LineHeight20";
import { Title } from "../../../../styles/global/Title";
import { CustomerDatabase } from "./table/CustomerDatabase";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import {
  buildConsumerRows,
  countConsumersByStatus,
} from "./utils/consumerRows";
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
  const search = watch("searchCustomer");

  /* The query used to live inside the table, which is why the legend directly
     above it could not say how many consumers were in each bucket. It is one
     request either way, and the table now takes its rows as a prop.

     Keyed by event and company: it was a bare ["checking_new_path_to"], so
     opening a second event could be served the first event's consumers out of
     the cache. */
  const consumersQuery = useQuery({
    queryKey: ["eventConsumers", event.id, user.companyData.id],
    queryFn: () =>
      devitrakApi.get(
        `/event/all-users-and-transactions-per-event?event_providers=${event.id}&company_providers=${user.companyData.id}`,
      ),
  });

  const rows = useMemo(
    () => buildConsumerRows(consumersQuery.data?.data?.data, { search }),
    [consumersQuery.data, search],
  );
  /* Counted before the status filter, so every pill keeps saying what it would
     show rather than dropping to 0 the moment another one is active. */
  const counts = useMemo(() => countConsumersByStatus(rows), [rows]);

  const refreshCustomerDatabase = async () => {
    await clearCacheMemory(`event=${event.id}&company=${user.companyData.id}`);
    /* Reset the key this screen actually uses. It reset ["customerDatabase"],
       which no query was ever registered under, so Refresh cleared the server
       cache and then re-rendered the same rows. */
    return queryClient.resetQueries({
      queryKey: ["eventConsumers", event.id, user.companyData.id],
    });
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
              const count = counts[status.value];
              /* An empty bucket would filter to an empty table, so it is not
                 offered — unless it is the one already selected, which has to
                 stay clickable to be switched off. */
              const empty = !consumersQuery.isLoading && count === 0 && !selected;
              return (
                <Tooltip
                  key={status.value}
                  title={
                    selected
                      ? "Showing only these consumers. Click to show all again."
                      : empty
                        ? `${status.description} — nobody here right now`
                        : status.description
                  }
                >
                  <button
                    type="button"
                    aria-pressed={selected}
                    disabled={empty}
                    onClick={() =>
                      setStatusFilter((current) =>
                        toggleStatusFilter(current, status.value),
                      )
                    }
                    style={{
                      border: "none",
                      background: "none",
                      padding: 0,
                      cursor: empty ? "default" : "pointer",
                      /* Dim the buckets that are being filtered out, so which
                         one is doing it is legible without reading the table. */
                      opacity: empty ? 0.35 : !filtering || selected ? 1 : 0.45,
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
                      <p style={{ color: status.color }}>
                        {status.label}
                        &nbsp;·&nbsp;
                        <span style={{ fontWeight: 700 }}>{count}</span>
                      </p>
                    </Tag>
                  </button>
                </Tooltip>
              );
            })}
          </Space>
        </Grid>
        <Grid item xs={12}>
          <CustomerDatabase
            rows={rows}
            loading={consumersQuery.isLoading}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default CustomerInformationSection;