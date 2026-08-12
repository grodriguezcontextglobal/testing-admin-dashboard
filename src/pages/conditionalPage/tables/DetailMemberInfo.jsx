import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import ModalUX from "../../../components/UX/modal/ModalUX";
import {
  ProfileErrorState,
  ProfileSection,
  ProfileSkeleton,
} from "../../../components/UX/profile";
import BaseTable from "../../../components/UX/tables/BaseTable";
import { FEATURE_MEMBER_FEES } from "../../../config/featureFlags";
import { hasPermission, resolveRoleType } from "../../../config/roles";
import "../../../styles/global/ant-table.css";
import useMemberAssignedDevices from "../hooks/useMemberAssignedDevices";
import ReceiptModal from "../../payment/components/ReceiptModal";
import ChargeMemberDeviceFee from "./detailTableComponents/acions/fee/ChargeMemberDeviceFee";
import ReturnOptions from "./detailTableComponents/acions/ReturnOptions";
import { columns } from "./detailTableComponents/columns";

const PAGE_SIZE = 10;

const DetailMemberInfo = () => {
  const { user } = useSelector((state) => state.admin);
  const { id: memberId } = useParams();
  const [editing, setEditing] = useState([]);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [checked, setChecked] = useState(false);
  const [storedRecord, setStoredRecord] = useState(null);
  const [chargingFee, setChargingFee] = useState(false);
  const [prefilledFeeLines, setPrefilledFeeLines] = useState([]);
  const [pendingFeeLine, setPendingFeeLine] = useState(null);
  const [declarationReceipt, setDeclarationReceipt] = useState(null);
  const queryClient = useQueryClient();

  // Taking money is gated twice on purpose: by the same flag that gates the
  // rest of B1 (so nothing changes in production until fees are turned on
  // deliberately), and by a permission, so an assistant who can see the roster
  // cannot bill a family.
  //
  // The permission used to be "transaction:stripe_create". That is an F-01
  // placeholder whose role list is EMPTY until F-04 assigns it, so the gate was
  // false for everyone — root_admin included. The symptom was not an error but
  // an absence: the return flow recorded the fee, printed the declaration, and
  // then silently swallowed the collection, because handleFeePending below bails
  // when this is false. "member:charge_fee" is a real member-domain key.
  const canChargeFee =
    FEATURE_MEMBER_FEES &&
    hasPermission("member:charge_fee", resolveRoleType(user));

  // Same hook (and therefore the same cache entry) the stat tiles read, so the
  // header and the table can never disagree about what this member is holding.
  const devicesQuery = useMemberAssignedDevices(
    memberId,
    user?.sqlInfo?.company_id
  );
  const rows = devicesQuery.rows;

  // Closing a lease can produce two follow-ups: a constancia to print, and a fee
  // to collect. They are chained rather than stacked — the receipt opens first,
  // and the charge modal opens when it closes. Two modals on screen at once made
  // it unclear which one the Close button belonged to.
  const handleFeePending = (feeLine) => {
    if (!canChargeFee) return;
    setPendingFeeLine(feeLine);
  };

  const handleDeclarationRecorded = (receipt) => {
    setDeclarationReceipt(receipt);
  };

  const handleDeclarationClosed = () => {
    setDeclarationReceipt(null);
    if (pendingFeeLine) {
      setPrefilledFeeLines([pendingFeeLine]);
      setPendingFeeLine(null);
      setChargingFee(true);
    }
  };

  const bodyModal = (
    <ReturnOptions
      storedRecord={storedRecord}
      setStoredRecord={setStoredRecord}
      modalHandler={setChecked}
      onFeePending={handleFeePending}
      onDeclarationRecorded={handleDeclarationRecorded}
    />
  );

  const renderBody = () => {
    if (devicesQuery.isLoading) {
      return (
        <div style={{ padding: "20px" }}>
          <ProfileSkeleton lines={4} />
        </div>
      );
    }

    if (devicesQuery.isError) {
      return (
        <ProfileErrorState
          title="Couldn't load assigned devices"
          description="The inventory service didn't respond. Nothing was changed."
          action={
            <GrayButtonComponent
              title={"Try again"}
              func={() => devicesQuery.refetch()}
            />
          }
        />
      );
    }

    return (
      <BaseTable
        key={memberId}
        id={memberId}
        className="table-ant-customized profile-table"
        sticky
        size="large"
        rowKey="device_id"
        columns={columns({
          editing,
          setEditing,
          updateInfo,
          setUpdateInfo,
          refetch: devicesQuery.refetch,
          queryClient,
          checked,
          setChecked,
          storedRecord,
          setStoredRecord,
        })}
        style={{ width: "100%" }}
        dataSource={rows}
        // A pager under a single page is noise; it only appears once there is
        // somewhere to page to.
        enablePagination={rows.length > PAGE_SIZE}
        pageSize={PAGE_SIZE}
        locale={{
          emptyText: (
            <EmptyState
              compact
              icon="tabler:device-laptop-off"
              title="No devices assigned"
              description="This member isn't holding anything right now. Use “Assign devices” to check something out to them."
            />
          ),
        }}
      />
    );
  };

  return (
    <>
      <ProfileSection
        title="Assigned devices"
        count={devicesQuery.isLoading ? undefined : rows.length}
        description={rows.length > 0 ? "Overdue first, then by due date" : null}
        testId="member-devices-section"
        actions={
          canChargeFee ? (
            <GrayButtonComponent
              title={"Charge device fee"}
              func={() => {
                setPrefilledFeeLines([]);
                setChargingFee(true);
              }}
            />
          ) : null
        }
      >
        {renderBody()}
      </ProfileSection>
      {checked && (
        <ModalUX
          openDialog={checked}
          closeModal={() => setChecked(false)}
          body={bodyModal}
        />
      )}
      {/* No QR: same reason as the handover slip — the lookup behind it would
          need enumerable member/company ids on a document naming a student. */}
      {declarationReceipt && (
        <ReceiptModal
          openModal={Boolean(declarationReceipt)}
          setOpenModal={() => setDeclarationReceipt(null)}
          receipt={declarationReceipt}
          title={"Print this record?"}
          onClose={handleDeclarationClosed}
        />
      )}
      {chargingFee && (
        <ChargeMemberDeviceFee
          openModal={chargingFee}
          setOpenModal={setChargingFee}
          devices={rows}
          prefillLines={prefilledFeeLines}
        />
      )}
    </>
  );
};

export default DetailMemberInfo;
