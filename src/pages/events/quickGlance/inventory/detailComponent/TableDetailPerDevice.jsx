import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import TextLink from "../../../../../components/UX/buttons/TextLink";
import EmptyState from "../../../../../components/UX/emptyState/EmptyState";
import { StatusChip } from "../../../../../components/UX/profile";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import { onAddCustomerInfo } from "../../../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../../../store/slices/stripeSlice";
import "../../../../../styles/global/ant-table.css";

/**
 * Who has held this device at this event.
 *
 * Assignments only. The previous version concatenated the reported-fault records
 * into the same table, and those are *pool* records where `device` is the serial
 * string rather than a device object — so the status column's
 * `record.device.status` was `undefined`, which its ternary rendered as
 * "Returned". A device written off as lost appeared in this table as returned.
 * Faults have their own table now, with their own columns.
 *
 * The fetching moved up to the page: this component had two `useCallback`s with
 * empty dependency arrays that appended to the state they closed over, driven by
 * an effect keyed on `[assignedDeviceList.length, defectedDevicesList.length]` —
 * so it fetched, set state, re-ran the effect off the new length, and fetched
 * everything a second time on every mount.
 */
const TableDetailPerDevice = ({ rows, isLoading }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const openConsumer = async (email) => {
    const response = await devitrakApi.post("/auth/users", { email });
    const consumer = response.data?.users?.at(-1);
    if (!consumer) return;

    const profile = {
      uid: consumer.id ?? consumer.uid,
      name: consumer.name,
      lastName: consumer.lastName,
      email: consumer.email,
      phoneNumber: consumer.phoneNumber,
    };
    dispatch(onAddCustomerInfo(profile));
    dispatch(onAddCustomer(profile));
    navigate(`/events/event-attendees/${profile.uid}/transactions-details`);
  };

  const columns = [
    {
      title: "Consumer",
      dataIndex: "user",
      key: "user",
      sorter: (a, b) => String(a.user).localeCompare(b.user),
      render: (user) =>
        user ? (
          <TextLink onClick={() => openConsumer(user)}>{user}</TextLink>
        ) : (
          <span style={{ color: "var(--gray-500, #777b73)" }}>Unassigned</span>
        ),
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      width: "18%",
      sorter: (a, b) => a.state.label.localeCompare(b.state.label),
      render: (state) => <StatusChip tone={state.tone} pip label={state.label} />,
    },
    {
      title: "Transaction",
      dataIndex: "paymentIntent",
      key: "paymentIntent",
      width: "28%",
      responsive: ["lg"],
      render: (paymentIntent) => (
        <span className="profile-serial">{paymentIntent || "—"}</span>
      ),
    },
  ];

  if (!isLoading && rows.length === 0) {
    return (
      <EmptyState
        compact
        icon="tabler:user-off"
        title="Never handed out at this event"
        description="Once this device is assigned to a consumer, the handover shows up here."
      />
    );
  }

  return (
    <BaseTable
      className="profile-table"
      columns={columns}
      dataSource={rows}
      loading={isLoading}
      enablePagination={rows.length > 10}
      pageSize={10}
    />
  );
};

TableDetailPerDevice.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      user: PropTypes.string,
      paymentIntent: PropTypes.string,
      state: PropTypes.shape({ tone: PropTypes.string, label: PropTypes.string }),
    })
  ).isRequired,
  isLoading: PropTypes.bool,
};

TableDetailPerDevice.defaultProps = {
  isLoading: false,
};

export default TableDetailPerDevice;
