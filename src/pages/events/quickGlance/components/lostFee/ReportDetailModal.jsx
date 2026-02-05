import { Box } from "@mui/material";
import renderingTitle from "../../../../../components/general/renderingTitle";
import ReusableCard from "../../../../../components/UX/cards/ReusableCard";
import LabeledInfoDisplay from "../../../../../components/UX/display/LabeledInfoDisplay";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { Subtitle } from "../../../../../styles/global/Subtitle";

const ReportDetailModal = ({
  setOpenLostReportModal,
  openLostReportDetail,
  dataInfo,
}) => {
  const closeModal = () => {
    return setOpenLostReportModal(false);
  };

  const bodyModal = () => {
    return (
      <ReusableCard>
        <Box
          key={dataInfo?.id}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
            width: "100%",
          }}
        >
          <LabeledInfoDisplay label="Attendee">
            {dataInfo?.attendee}
          </LabeledInfoDisplay>

          <LabeledInfoDisplay label="Admin">
            {dataInfo?.admin}
          </LabeledInfoDisplay>

          <LabeledInfoDisplay label="Amount">
            ${dataInfo?.amount}
          </LabeledInfoDisplay>

          <LabeledInfoDisplay label="Type Collection">
            {dataInfo?.typeCollection}
          </LabeledInfoDisplay>

          <LabeledInfoDisplay label="ID">{dataInfo?.id}</LabeledInfoDisplay>

          {/* Device Lost list might take up more space or span multiple columns if needed, 
              but for now keeping it in the grid flow. 
              If the list is long, we might want to make it span full width.
          */}
          <Box sx={{ gridColumn: { xs: "1fr", md: "1 / -1" } }}>
            <LabeledInfoDisplay label="Device Lost">
              <Box
                component="ul"
                sx={{
                  margin: 0,
                  paddingLeft: 0,
                  listStyle: "none",
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, // Internal grid for devices
                }}
              >
                {dataInfo?.deviceLost?.map((device, deviceIndex) => (
                  <p
                    style={Subtitle}
                    key={deviceIndex}
                  >{`${device.label} - ${device.deviceType}`}</p>
                ))}
              </Box>
            </LabeledInfoDisplay>
          </Box>
        </Box>
      </ReusableCard>
    );
  };
  return (
    <ModalUX
      title={renderingTitle("Detail of lost fee collected")}
      openDialog={openLostReportDetail}
      closeModal={() => closeModal()}
      body={bodyModal()}
    />
  );
};

export default ReportDetailModal;
