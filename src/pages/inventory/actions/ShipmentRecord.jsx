import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import renderingTitle from "../../../components/general/renderingTitle";
import { DownNarrow } from "../../../components/icons/DownNarrow";
import { RightChevronIcon } from "../../../components/icons/RightChevronIcon";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import TextLink from "../../../components/UX/buttons/TextLink";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import Input from "../../../components/UX/inputs/Input";
import Label from "../../../components/UX/inputs/Label";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { ProfileErrorState, ProfileSkeleton, StatusChip } from "../../../components/UX/profile";
import BaseTable from "../../../components/UX/tables/BaseTable";
import "../../../styles/global/actionForm.css";
import ExpandedShipmentView from "./utils/ExpandedShipmentView";
import { describeShippingStatus, filterShipments, trackingUrl } from "./utils/shipping";

const expandIconStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  margin: 0,
  outline: "none",
  padding: 0,
};

/**
 * Every shipment this company has sent out.
 *
 * The table showed five columns and none of them was the one people open this
 * for: the status the shipment was created with was never displayed, so a
 * record that had been delivered looked exactly like one still pending. There
 * was no way to search either, which matters as soon as there is more than a
 * screenful.
 *
 * The tracking cell also worked backwards. When the courier was one of the four
 * we know, it rendered a link and dropped the copy button; when it was not, it
 * rendered the copy button and no link — so the case where you most need to
 * paste the number somewhere else was the one that offered no way to copy it.
 * Both are available now, always.
 */
export const ShipmentRecord = ({ open, setOpen }) => {
  const { user } = useSelector((state) => state.admin);
  const { notify, contextHolder } = useStatusNotification();
  const [search, setSearch] = useState("");

  const shipmentsQuery = useQuery({
    queryKey: ["shipmentRecords", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post(`/db_shipment/search`, {
        company_id: user.sqlInfo.company_id,
      }),
    enabled: !!user.sqlInfo.company_id,
  });

  const shipments = useMemo(
    () => shipmentsQuery.data?.data?.shipments ?? [],
    [shipmentsQuery.data]
  );
  const rows = useMemo(() => filterShipments(shipments, search), [shipments, search]);

  const closeModal = () => setOpen(false);

  const copyTracking = async (trackingNumber) => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      notify("success", "Tracking number copied.");
    } catch {
      notify("error", "The tracking number could not be copied.");
    }
  };

  const columns = [
    {
      key: "destination",
      title: "Destination",
      dataIndex: "destination",
      render: (value) => value || "—",
    },
    {
      key: "courier",
      title: "Courier",
      dataIndex: "courier",
      render: (value) => value || "—",
    },
    {
      key: "tracking",
      title: "Tracking",
      dataIndex: "tracking_number",
      render: (trackingNumber, record) => {
        if (!trackingNumber) return "—";
        const url = trackingUrl(record.courier, trackingNumber);

        return (
          <div className="action-form__row" style={{ alignItems: "center", gap: 8 }}>
            <span className="action-form__serial">{trackingNumber}</span>
            <TextLink onClick={() => copyTracking(trackingNumber)}>Copy</TextLink>
            {url && (
              <TextLink
                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
              >
                Track
              </TextLink>
            )}
          </div>
        );
      },
    },
    {
      key: "recipient",
      title: "Received by",
      dataIndex: "recipient_name",
      responsive: ["lg"],
      render: (value) => value || "—",
    },
    {
      key: "authorizer",
      title: "Authorised by",
      dataIndex: "authorizer_name",
      responsive: ["lg"],
      render: (value) => value || "—",
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (value) => {
        // Never shown before, though every record is created with one.
        const status = describeShippingStatus(value);
        return <StatusChip label={status.label} tone={status.tone} pip />;
      },
    },
  ];

  const body = (
    <div className="action-form">
      {contextHolder}

      {shipmentsQuery.isError ? (
        <ProfileErrorState
          title="Couldn't load the shipment records"
          description="The service didn't respond. Nothing was changed."
        />
      ) : shipmentsQuery.isLoading ? (
        <ProfileSkeleton lines={4} />
      ) : shipments.length === 0 ? (
        <EmptyState
          icon="tabler:truck-off"
          title="No shipments yet"
          description="Shipments appear here once inventory has been sent out to an event."
        />
      ) : (
        <>
          <div className="action-form__field">
            <Label>Search</Label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Destination, courier, tracking number or name"
            />
          </div>

          <p className="action-form__count">
            <strong>{rows.length}</strong> shipment{rows.length === 1 ? "" : "s"}
            {rows.length !== shipments.length && ` of ${shipments.length}`}
          </p>

          <div className="action-form__scroll">
            <BaseTable
              className="profile-table"
              columns={columns}
              dataSource={rows}
              rowKey={(record) => record.shipment_id}
              enablePagination={rows.length > 10}
              pageSize={10}
              size="small"
              locale={{ emptyText: "Nothing matches that search" }}
              expandable={{
                expandedRowRender: (record) => (
                  <ExpandedShipmentView
                    package_list={record.package_list}
                    record={record}
                  />
                ),
                rowExpandable: (record) =>
                  Array.isArray(record.package_list) && record.package_list.length > 0,
                expandIcon: ({ expanded, onExpand, record }) => (
                  <button
                    type="button"
                    style={expandIconStyle}
                    aria-label={expanded ? "Hide the package list" : "Show the package list"}
                    onClick={(event) => onExpand(record, event)}
                  >
                    {expanded ? <DownNarrow /> : <RightChevronIcon />}
                  </button>
                ),
              }}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <ModalUX
      title={renderingTitle("Shipment records")}
      openDialog={open}
      closeModal={closeModal}
      footer={null}
      width={960}
      body={body}
    />
  );
};

ShipmentRecord.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func.isRequired,
};

export default ShipmentRecord;
