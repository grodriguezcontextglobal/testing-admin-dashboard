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
import "../../../styles/global/ant-table.css";
import useMemberAssignedDevices from "../hooks/useMemberAssignedDevices";
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
  const queryClient = useQueryClient();

  // Same hook (and therefore the same cache entry) the stat tiles read, so the
  // header and the table can never disagree about what this member is holding.
  const devicesQuery = useMemberAssignedDevices(
    memberId,
    user?.sqlInfo?.company_id
  );
  const rows = devicesQuery.rows;

  const bodyModal = (
    <ReturnOptions
      storedRecord={storedRecord}
      setStoredRecord={setStoredRecord}
      modalHandler={setChecked}
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
    </>
  );
};

export default DetailMemberInfo;
