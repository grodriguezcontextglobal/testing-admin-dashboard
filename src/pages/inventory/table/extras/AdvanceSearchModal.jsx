import { InputLabel, Typography } from "@mui/material";
import { DatePicker, message, Select } from "antd";
import dayjs from "dayjs";
import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import {
  onAddAdvanceSearch,
  onAddSearchParameters,
} from "../../../../store/slices/searchBarResultSlice";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../../styles/global/Subtitle";
import { TextFontSize14LineHeight20 } from "../../../../styles/global/TextFontSize14LineHeight20";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import { AdvanceSearchContext } from "./RenderingFilters";
const { RangePicker } = DatePicker;

const AdvanceSearchModal = ({
  openAdvanceSearchModal,
  setOpenAdvanceSearchModal,
  existingParameters = null,
  periodUpdateOnly = false, // New prop to indicate period-only update
}) => {
  const values = useContext(AdvanceSearchContext);
  const { user } = useSelector((state) => state.admin);
  const { searchParameters } = useSelector((state) => state.searchResult);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [displayMessage, setDisplayMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const { register, handleSubmit, setValue, reset } = useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Pre-populate form with existing parameters
  useEffect(() => {
    const params = existingParameters || searchParameters;
    if (params && openAdvanceSearchModal) {
      setValue("category", params.category || "");
      setValue("group", params.group || "");
      setValue("brand", params.brand || "");
      setValue("location", params.location || "");

      if (params.date_start && params.date_end) {
        const dateRange = [dayjs(params.date_start), dayjs(params.date_end)];
        setValue("date", dateRange);
      }
    }
  }, [existingParameters, searchParameters, openAdvanceSearchModal, setValue]);

  const renderTitle = () => {
    return (
      <Typography style={TextFontsize18LineHeight28}>
        {periodUpdateOnly
          ? "Update Search Period"
          : existingParameters || searchParameters
          ? "Update Search Parameters"
          : "Forecast Inventory"}
      </Typography>
    );
  };

  const closeModal = () => {
    reset();
    return setOpenAdvanceSearchModal(false);
  };

  const handleSearchQuery = async (data) => {
    if (!data.date) {
      return message.error("Please select a date");
    }
    try {
      setErrorMessage(null);
      setIsLoadingState(true);
      const date_start = `${new Date(data.date[0].$d).getFullYear()}-${
        new Date(data.date[0].$d).getMonth() + 1
      }-${new Date(data.date[0].$d).getDate()}`;
      const date_end = `${new Date(data.date[1].$d).getFullYear()}-${
        new Date(data.date[1].$d).getMonth() + 1
      }-${new Date(data.date[1].$d).getDate()}`;

      // Store search parameters
      const searchParams = {
        category: data.category || "",
        group: data.group || "",
        brand: data.brand || "",
        location: data.location || "",
        date_start,
        date_end,
      };
      dispatch(onAddSearchParameters(searchParams));

      const advanceSearchResponseQuery = await devitrakApi.get(
        `/search/advance_searching_query?category=${data.category}&group=${data.group}&brand=${data.brand}&location=${data.location}&date_start=${date_start}&date_end=${date_end}&company_id=${user.companyData.id}&company_sql_id=${user.sqlInfo.company_id}`
      );
      // Handle the new API response structure
      if (advanceSearchResponseQuery.data.ok) {
        const responseData = advanceSearchResponseQuery.data;
        return setTimeout(() => {
          setDisplayMessage(false);
          setIsLoadingState(false);
          dispatch(
            onAddAdvanceSearch(
              responseData // Pass the entire response object with all new fields
            )
          );
          if (periodUpdateOnly) {
            return setOpenAdvanceSearchModal(false);
          }
          return navigate("/inventory/advance_search_result");
        }, 2000);
      } else {
        setIsLoadingState(false);
        setOpenAdvanceSearchModal(false);
        return setDisplayMessage(true);
      }
    } catch (error) {
      setIsLoadingState(false);
      if (error.response?.data?.msg) {
        setErrorMessage(
          error.response.data.msg ===
            "Cannot read properties of undefined (reading 'length')"
            ? "There is not available inventory for the period selected."
            : error.response.data.msg
        );
        return setDisplayMessage(true);
      }
      // Handle new API error structure if it includes a message field
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
        return setDisplayMessage(true);
      }
      setDisplayMessage(true);
      return null;
    }
  };

  const bodyModal = () => {
    return (
      <>
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
              {periodUpdateOnly
                ? "Update the period for your current search"
                : "Parameters for Forecast Inventory query"}
            </Typography>
          </div>

          {/* Category Field */}
          {!periodUpdateOnly && (
            <div style={{ margin: "0.5rem 0 0.25rem" }}>
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
                placeholder="Select a category"
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
                disabled={periodUpdateOnly} // Disable when period-only update
              />
            </div>
          )}

          {/* Device Field */}
          {!periodUpdateOnly && (
            <div style={{ margin: "0.5rem 0 0.25rem" }}>
              <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                <Typography
                  style={{ ...TextFontSize14LineHeight20, fontWeight: 600 }}
                >
                  Device name
                </Typography>
              </InputLabel>
              <Select
                style={{ width: "100%" }}
                showSearch
                placeholder="Select a device"
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
                disabled={periodUpdateOnly} // Disable when period-only update
              />
            </div>
          )}

          {/* Brand Field */}
          {!periodUpdateOnly && (
            <div style={{ margin: "0.5rem 0 0.25rem" }}>
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
                placeholder="Select a brand"
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
                disabled={periodUpdateOnly} // Disable when period-only update
              />
            </div>
          )}

          {/* Location Field */}
          {!periodUpdateOnly && (
            <div style={{ margin: "0.5rem 0 0.25rem" }}>
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
                placeholder="Select a location"
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
                disabled={periodUpdateOnly} // Disable when period-only update
              />
            </div>
          )}

          {/* Period Field - Always enabled */}
          <div style={{ margin: "0.5rem 0 0.25rem" }}>
            <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
              <Typography
                style={{ ...TextFontSize14LineHeight20, fontWeight: 600 }}
              >
                Period{" "}
                {/* {periodUpdateOnly && (
                <span style={{ color: "#1890ff" }}>
                  (Only this field can be changed)
                </span>
              )} */}
              </Typography>
            </InputLabel>
            <RangePicker
              size="large"
              style={{ width: "100%", margin: "0rem 0 1rem" }}
              {...register("date")}
              onChange={(value) => setValue("date", value)}
            />
          </div>

          <BlueButtonComponent
            title={
              periodUpdateOnly
                ? "Update Period"
                : existingParameters || searchParameters
                ? "Update Search"
                : "Search"
            }
            func={() => null}
            buttonType="submit"
            loadingState={isLoadingState}
            titleStyles={{
              textTransform: "none",
              with: "100%",
              gap: "2px",
            }}
          />
        </form>
        <div
          style={{
            display: displayMessage ? "flex" : "none",
            backgroundColor: "var(--danger-action)",
            margin: "0.5rem 0",
            borderRadius: "12px",
            padding: "0.5rem",
          }}
        >
          <p
            style={{ ...Subtitle, ...CenteringGrid, color: "var(--basewhite)" }}
          >
            {errorMessage
              ? errorMessage
              : "There is not result based on parameters passed."}
          </p>
        </div>
      </>
    );
  };
  return (
    <ModalUX
      title={renderTitle()}
      openDialog={openAdvanceSearchModal}
      closeModal={closeModal}
      body={bodyModal()}
    />
  );
};

export default AdvanceSearchModal;
