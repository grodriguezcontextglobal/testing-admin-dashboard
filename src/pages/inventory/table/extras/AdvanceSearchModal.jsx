import { InputLabel, Typography } from "@mui/material";
import { Button, DatePicker, message, Modal, Select, Tooltip } from "antd";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onAddAdvanceSearch } from "../../../../store/slices/searchBarResultSlice";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize14LineHeight20 } from "../../../../styles/global/TextFontSize14LineHeight20";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import { AdvanceSearchContext } from "./RenderingFilters";
const { RangePicker } = DatePicker;

const AdvanceSearchModal = ({
  openAdvanceSearchModal,
  setOpenAdvanceSearchModal,
}) => {
  const values = useContext(AdvanceSearchContext);
  const [advanceSearchResultState, setAdvanceSearchResultState] =
    useState(null);
  const { user } = useSelector((state) => state.admin);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [displayMessage, setDisplayMessage] = useState(false);
  const { register, handleSubmit, setValue } = useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const renderTitle = () => {
    return (
      <Typography style={TextFontsize18LineHeight28}>Advance search</Typography>
    );
  };
  // console.log(displayMessage);
  // console.log(advanceSearchResultState);
  const closeModal = () => {
    return setOpenAdvanceSearchModal(false);
  };

  const handleSearchQuery = async (data) => {
    if (!data.date) {
      return message.error("Please select a date");
    }
    try {
      setIsLoadingState(true);
      const date_start = `${new Date(data.date[0].$d).getFullYear()}-${
        new Date(data.date[0].$d).getMonth() + 1
      }-${new Date(data.date[0].$d).getDate()}`;
      const date_end = `${new Date(data.date[1].$d).getFullYear()}-${
        new Date(data.date[1].$d).getMonth() + 1
      }-${new Date(data.date[1].$d).getDate()}`;
      const advanceSearchResponseQuery = await devitrakApi.get(
        `/search/advance_searching_query?category=${data.category}&group=${data.group}&brand=${data.brand}&location=${data.location}&date_start=${date_start}&date_end=${date_end}&company_id=${user.companyData.id}&company_sql_id=${user.sqlInfo.company_id}`
      );
      if (
        advanceSearchResponseQuery.data.ok &&
        advanceSearchResponseQuery.data.advanceSearchResult.length > 0
      ) {
        setAdvanceSearchResultState(
          advanceSearchResponseQuery.data //.advanceSearchResult
        );
        return setTimeout(() => {
          setDisplayMessage(false);
          setIsLoadingState(false);
          dispatch(
            onAddAdvanceSearch(
              advanceSearchResponseQuery.data //.advanceSearchResult
            )
          );
          return navigate("/inventory/advance_search_result");
        }, 2000);
      } else {
        setIsLoadingState(false);
        return setDisplayMessage(true);
      }
    } catch (error) {
      setIsLoadingState(false);
      setDisplayMessage(false);
      return null;
    }
  };

  return (
    <Modal
      title={renderTitle()}
      centered
      footer={[]}
      style={{ zIndex: 30 }}
      open={openAdvanceSearchModal}
      onCancel={() => closeModal()}
      onOk={() => closeModal()}
    >
      <form onSubmit={handleSubmit(handleSearchQuery)}>
        <div
          style={{
            width: "100%",
            textAlign: "left",
            marginBottom: "1rem",
            gap: "10px",
          }}
        >
          <Typography style={Subtitle} fontWeight={600}>
            Parameters for advance search query
          </Typography>
        </div>
        <div style={{ margin: "0.5rem 0 0.25rem" }}>
          {" "}
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <Typography
              style={{ ...TextFontSize14LineHeight20, fontWeight: 600 }}
            >
              Category
            </Typography>
          </InputLabel>
          <Select
            style={{ width: "100%" }}
            showSearch
            placeholder="Select a person"
            optionFilterProp="label"
            {...register("category")}
            onChange={(value) => setValue("category", value)}
            onSearch={(value) => setValue("category", value)}
            options={[
              ...values.category.map((item) => ({
                value: item.key,
                label: item.key,
              })),
            ]}
            allowClear
          />{" "}
        </div>
        <div style={{ margin: "0.5rem 0 0.25rem" }}>
          {" "}
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <Typography
              style={{ ...TextFontSize14LineHeight20, fontWeight: 600 }}
            >
              Group
            </Typography>
          </InputLabel>
          <Select
            style={{ width: "100%" }}
            showSearch
            placeholder="Select a person"
            optionFilterProp="label"
            {...register("group")}
            onChange={(value) => setValue("group", value)}
            onSearch={(value) => setValue("group", value)}
            options={[
              ...values.group.map((item) => ({
                value: item.key,
                label: item.key,
              })),
            ]}
            allowClear
          />{" "}
        </div>
        <div style={{ margin: "0.5rem 0 0.25rem" }}>
          {" "}
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <Typography
              style={{ ...TextFontSize14LineHeight20, fontWeight: 600 }}
            >
              Brand
            </Typography>
          </InputLabel>
          <Select
            style={{ width: "100%" }}
            showSearch
            placeholder="Select a person"
            optionFilterProp="label"
            {...register("brand")}
            onChange={(value) => setValue("brand", value)}
            onSearch={(value) => setValue("brand", value)}
            options={[
              ...values.brand.map((item) => ({
                value: item.key,
                label: item.key,
              })),
            ]}
            allowClear
          />{" "}
        </div>
        <div style={{ margin: "0.5rem 0 0.25rem" }}>
          {" "}
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <Typography
              style={{ ...TextFontSize14LineHeight20, fontWeight: 600 }}
            >
              Location
            </Typography>
          </InputLabel>
          <Select
            style={{ width: "100%" }}
            showSearch
            placeholder="Select a person"
            optionFilterProp="label"
            {...register("location")}
            onChange={(value) => setValue("location", value)}
            onSearch={(value) => setValue("location", value)}
            options={[
              ...values.location.map((item) => ({
                value: item.key,
                label: item.key,
              })),
            ]}
            allowClear
          />{" "}
        </div>
        <div style={{ margin: "0.5rem 0 0.25rem" }}>
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <Typography
              style={{ ...TextFontSize14LineHeight20, fontWeight: 600 }}
            >
              Period
            </Typography>
          </InputLabel>
          <RangePicker
            size="large"
            style={{ width: "100%", margin: "0rem 0 1rem" }}
            {...register("date")}
            onChange={(value) => setValue("date", value)}
          />
        </div>
        <Tooltip title="Still in construction">
          <Button
            // disabled
            htmlType="submit"
            loading={isLoadingState}
            style={{ ...BlueButton, ...CenteringGrid, width: "100%" }}
          >
            <Typography style={BlueButtonText}>Search</Typography>
          </Button>
        </Tooltip>
      </form>
      <div
        style={{
          display:
            displayMessage ? "flex" : "none",
          backgroundColor: "var(--danger-action)",
          margin: "0.5rem 0",
          borderRadius: "12px",
          padding: "0.5rem",
        }}
      >
        <p style={{ ...Subtitle, ...CenteringGrid, color: "var(--basewhite)" }}>
          There is not result based on parameters passed.
        </p>
      </div>
    </Modal>
  );
};

export default AdvanceSearchModal;
