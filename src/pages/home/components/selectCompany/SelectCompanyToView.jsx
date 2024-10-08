import { Grid } from "@mui/material";
import { Modal, Space } from "antd";
import CompanyChoiceCard from "./CompanyChoiceCard";
// import renderingTitle from "../../../../components/general/renderingTitle"
import { useDispatch, useSelector } from "react-redux";
import { onSwitchingCompany } from "../../../../store/slices/helperSlice";
import { lazy, Suspense } from "react";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import Loading from "../../../../components/animation/Loading";
const renderingTitle = lazy(() =>
  import("../../../../components/general/renderingTitle")
);
const SelectCompanyToView = ({ data }) => {
  const { switchingCompanyInfo } = useSelector((state) => state.helper);
  const dispatch = useDispatch();
  const closeModal = () => {
    return dispatch(onSwitchingCompany(false));
  };
  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      <Modal
        title={renderingTitle(
          `Our record shows you are assigned to ${data.length} companies, please select which company you want to work with today.`
        )}
        open={switchingCompanyInfo}
        onCancel={() => closeModal()}
        footer={[]}
        centered
        width={1000}
        style={{ zIndex:30}}
      >
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          padding={"12px 20px"}
          container
        >
          <Space size={[8, 16]} wrap>
            {data.map((item) => {
              return (
                <CompanyChoiceCard key={item.companyInfo.id} props={item} />
              );
            })}
          </Space>
        </Grid>
      </Modal>
    </Suspense>
  );
};

export default SelectCompanyToView;
