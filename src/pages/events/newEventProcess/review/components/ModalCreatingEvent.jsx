import { Modal } from "antd";
import Loading from "../../../../../components/animation/Loading";
import { DevitrakLogo } from "../../../../../components/icons/DevitrakLogo";
import { DevitrakName } from "../../../../../components/icons/DevitrakName";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import { Subtitle } from "../../../../../styles/global/Subtitle";
const ModalCreatingEventInProgress = ({ openEndingEventModal }) => {
  const innerHeight = window.innerHeight;
  const innerWidth = window.innerHeight;

  return (
    <Modal
      open={openEndingEventModal}
      onCancel={() => null}
      closable={false}
      footer={[]}
      width={innerWidth - 200}
      centered
      maskClosable={false}
      style={{
        top: "5dvh",
        backgroundColor: "var(--basewhite)",
        borderRadius: "8px",
        padding: "24px",
        height: innerHeight - 450,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          margin: "auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: innerHeight - 550,
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            backgroundColor: "var(--blue700)",
            borderRadius: "8px 8px 0 0",
            padding: "1rem",
          }}
        >
          <DevitrakLogo />
          <DevitrakName />
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            margin: "0 0 1rem",
          }}
        >
          <Loading />
          <div style={{ width: "100%", textAlign: "left" }}>
            <h4 style={{ ...TextFontSize20LineHeight30, width: "100%" }}>
              Creating event...
            </h4>
            <p style={{ ...Subtitle, width: "100%" }}>
              This event is being created. Please wait until progress is completed.
            </p>
          </div>
        </div>
        <div
          style={{
            width: "100%",
            backgroundColor: "var(--blue700)",
            borderRadius: "0 0 8px 8px",
            padding: "1rem",
          }}
        ></div>
      </div>
    </Modal>
  );
};

export default ModalCreatingEventInProgress;
