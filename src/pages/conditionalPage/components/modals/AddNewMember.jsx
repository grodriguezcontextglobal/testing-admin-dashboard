import { useMemo, useState, useRef } from "react";
import { Divider, Typography } from "antd";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import TourModals from "../../../../components/UX/tours/TourModals";
import MultipleFromXLSX from "./addNewMember/MultipleFromXLSX";
import Single from "./addNewMember/Single";

const { Text } = Typography;

const AddNewMember = ({ openModal, setOpenModal }) => {
  const [choose, setChoose] = useState(0);
  const [openTour, setOpenTour] = useState(false);

  // Refs for Tour targets
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const streetRef = useRef(null);
  const cityRef = useRef(null);
  const stateRef = useRef(null);
  const zipRef = useRef(null);

  // Tour Configuration
  const tourColumns = [
    {
      title: "First Name",
      onHeaderCell: () => ({ ref: firstNameRef }),
      dataIndex: "first_name",
      key: "first_name",
      width: 120,
    },
    {
      title: "Last Name",
      onHeaderCell: () => ({ ref: lastNameRef }),
      dataIndex: "last_name",
      key: "last_name",
      width: 120,
    },
    {
      title: "Email",
      onHeaderCell: () => ({ ref: emailRef }),
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Phone",
      onHeaderCell: () => ({ ref: phoneRef }),
      dataIndex: "phone",
      key: "phone",
      width: 150,
    },
    {
      title: "Street",
      onHeaderCell: () => ({ ref: streetRef }),
      dataIndex: "street",
      key: "street",
      width: 200,
    },
    {
      title: "City",
      onHeaderCell: () => ({ ref: cityRef }),
      dataIndex: "city",
      key: "city",
      width: 150,
    },
    {
      title: "State",
      onHeaderCell: () => ({ ref: stateRef }),
      dataIndex: "state",
      key: "state",
      width: 100,
    },
    {
      title: "Zip Code",
      onHeaderCell: () => ({ ref: zipRef }),
      dataIndex: "zip",
      key: "zip",
      width: 100,
    },
  ];

  const tourSteps = [
    {
      title: "First name",
      description: "Enter the member's first and last name.",
      target: () => firstNameRef.current,
    },
    {
      title: "Last name",
      description: "Enter the member's last name.",
      target: () => lastNameRef.current,
    },
    {
      title: "Email",
      description: "Enter the member's email address.",
      target: () => emailRef.current,
    },
    {
      title: "Phone Number",
      description: "Enter the member's phone number.",
      target: () => phoneRef.current,
    },
    {
      title: "Street",
      description: "Enter the member's street address.",
      target: () => streetRef.current,
    },
    {
      title: "City",
      description: "Enter the member's city.",
      target: () => cityRef.current,
    },
    {
      title: "State",
      description: "Enter the member's state.",
      target: () => stateRef.current,
    },
    {
      title: "Zip Code",
      description: "Enter the member's zip code.",
      target: () => zipRef.current,
    },
  ];

  const tourData = [
    {
      key: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      phone: "555-0123",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zip: "10001",
    },
  ];

  const bodyUX = useMemo(() => {
    return (
      <div>
        {choose === 0 ? (
          <Single closingModal={setOpenModal} />
        ) : (
          <MultipleFromXLSX closingModal={setOpenModal} />
        )}
      </div>
    );
  }, [choose, openTour]);
  const renderingTitleWithOptions = () => {
    return (
      <>
        <h2 style={{ marginBottom: 24 }}>Choose option to add new member(s)</h2>
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <BlueButtonComponent
            key="add"
            buttonType="submit"
            title={"Add new member"}
            styles={{ width: "50%" }}
            func={() => setChoose(0)}
          />
          <BlueButtonComponent
            key="import"
            title={"Import (.xlsx)"}
            styles={{ width: "50%" }}
            func={() => setChoose(1)}
          />
        </div>
        {choose === 1 && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <GrayButtonComponent
              title="View Template Guide"
              func={() => setOpenTour(true)}
              style={{ width: "fit-content" }}
            />
          </div>
        )}
        <Divider />
      </>
    );
  };

  return (
    <>
      {!openTour && (
        <ModalUX
          title={renderingTitleWithOptions()}
          openDialog={openModal}
          closeModal={setOpenModal}
          width={1000}
          footer={null}
          modalStyles={{}}
          body={bodyUX}
        />
      )}
      {choose === 1 && openTour && (
        <TourModals
          open={openTour}
          setOpen={setOpenTour}
          title="Member Import Template Guide"
          description={
            <>
              This guide shows the expected structure for your Excel (.xlsx)
              file.
              <br />
              <Text type="danger">Note:</Text> Headers are case-insensitive.
            </>
          }
          columns={tourColumns}
          dataSource={tourData}
          steps={tourSteps}
          width={3000}
        />
      )}
    </>
  );
};

export default AddNewMember;
