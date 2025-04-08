import { Grid, OutlinedInput, styled } from "@mui/material";
import { Button, Select } from "antd";
import { createContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { DangerButton } from "../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../styles/global/DangerButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import ImageUploaderUX from "../components/image/ImageUploaderUX";
import "../style/rooter.css";
import { AntSelectorStyle } from "../../../styles/global/AntSelectorStyle";
import { devitrakApi } from "../../../api/devitrakApi";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";

export const ImageUploaderContext = createContext();

// Create a styled version of ReactQuill to customize its appearance
const CustomReactQuill = styled(ReactQuill)(({ theme }) => ({
  "& .ql-toolbar": {
    backgroundColor: "#f5f5f5",
    borderBottom: "1px solid #ccc",
    borderRadius: "12px 12px 0px 0px",
  },
  "& .ql-container": {
    border: "1px solid #ccc",
    // borderRadius: "4px",
    borderRadius: "0 0 12px 12px",
    // Add padding if desired
    padding: theme,
  },
  "& .ql-editor": {
    minHeight: "200px",
    fontSize: "1rem",
    fontFamily: "Roboto, sans-serif",
  },
}));

const NewPost = () => {
  const [imageUploadedValue, setImageUploadedValue] = useState(null);
  const { register, handleSubmit } = useForm();
  const [value, setValue] = useState("");
  const [eventList, setEventList] = useState([]);
  const [assignedEvent, setAssignedEvent] = useState([]);
  const { user } = useSelector((state) => state.admin);
  const eventsCompanyList = useQuery({
    queryKey: ["eventsCompanyList"],
    queryFn: () =>
      devitrakApi.post(`/event/event-list`, {
        company_id: user.companyData.id,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    eventsCompanyList.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (eventsCompanyList.data) {
      setEventList(eventsCompanyList.data.data.list);
    }
    return () => {
      controller.abort();
    };
  }, [eventsCompanyList.data]);

  const stylingLabel = {
    width: "100%",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    textAlign: "left",
    gap: "10px",
  };

  // Define the custom toolbar options
  const toolbarOptions = [
    ["bold", "italic", "underline", "strike"], // toggled buttons
    ["blockquote", "code-block"],
    ["link", "image", "video", "formula"],
    [{ header: 1 }, { header: 2 }], // custom button values
    [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
    [{ script: "sub" }, { script: "super" }], // superscript/subscript
    [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    [{ direction: "rtl" }], // text direction
    [{ size: ["small", false, "large", "huge"] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ color: [] }, { background: [] }], // dropdown with defaults
    [{ font: [] }],
    [{ align: [] }],
    ["clean"], // remove formatting button
  ];

  // Pass the toolbar options through modules prop of ReactQuill
  const modules = {
    toolbar: toolbarOptions,
  };

  const onSubmit = (data) => {
    console.log("data", {
      ...data,
      image: imageUploadedValue,
      description: value,
      displayed_in: [ ...assignedEvent],
    });
  };

  const onChange = (value) => {
    console.log("value", value);
    if (value.some((item) => item === 0)) {
      console.log("all events");
      return setAssignedEvent([ ...eventList.map((item) => item.id)]);
    }
    return setAssignedEvent(value);
  };

  console.log("assignedEvent", assignedEvent);
  return (
    <Grid container spacing={2}>
      {/* Header */}
      <Grid
        item
        xs={12}
        sm={12}
        md={6}
        lg={6}
      sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}
      >
        <h1>New article</h1>
      </Grid>

      {/* Image uploader */}
      <ImageUploaderContext.Provider value={setImageUploadedValue}>
        <ImageUploaderUX />
      </ImageUploaderContext.Provider>
      {/* <Grid paddingLeft={0} item xs={12} id="image-uploader">
      </Grid> */}

      {/* Form content */}
      <form
        style={{ width: "100%", margin: "2.5rem 0" }}
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Title */}
        <Grid
          item
          xs={12}
          sm={12}
          md={6}
          lg={6}
          key="section-title"
          sx={{ ...stylingLabel, my: 2, flexDirection: "column" }}
        >
          <h1 style={stylingLabel}>Title</h1>
          <div style={stylingLabel}>
            <OutlinedInput
              {...register("title")}
              style={{ ...OutlinedInputStyle, width: "100%" }}
            />
          </div>
        </Grid>

        {/* Subtitle */}
        <Grid
          item
          xs={12}
          sm={12}
          md={6}
          lg={6}
          key="section-subtitle"
          sx={{ ...stylingLabel, my: 2, flexDirection: "column" }}
        >
          <h1 style={stylingLabel}>Subtitle</h1>
          <div style={stylingLabel}>
            <OutlinedInput
              {...register("subtitle")}
              style={{ ...OutlinedInputStyle, width: "100%" }}
            />
          </div>
        </Grid>

        <Grid
          item
          xs={12}
          sm={12}
          md={6}
          lg={6}
          key="section-event"
          sx={{ ...stylingLabel, my: 2, flexDirection: "column" }}
        >
          <h1 style={stylingLabel}>Event where post will be published</h1>
          <div style={stylingLabel}>
            <Select
              className="custom-autocomplete"
              showSearch
              mode="multiple"
              allowClear
              placeholder="Select event where post will be published"
              optionFilterProp="children"
              style={{ ...AntSelectorStyle, width: "100%" }}
              onChange={onChange}
              options={[
                {
                  value: 0,
                  label: "All events",
                },
                ...eventList.map((item) => ({
                  value: item.id,
                  label: (
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                      }}
                    >
                      {item.eventInfoDetail.eventName}
                    </div>
                  ),
                })),
              ]}
            />
          </div>
        </Grid>

        <Grid
          item
          xs={12}
          sx={{ ...stylingLabel, my: 2, flexDirection: "column" }}
        >
          <h1 style={stylingLabel}>Description</h1>
          <div style={stylingLabel}>
            <CustomReactQuill
              value={value}
              onChange={setValue}
              modules={modules}
              theme="snow"
            />{" "}
          </div>
        </Grid>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            marginTop: "2.5rem",
            width: "100%",
            gap: "15px",
          }}
        >
          <Button style={DangerButton} htmlType="reset">
            <p style={DangerButtonText}>Cancel</p>
          </Button>
          <Button htmlType="submit" style={BlueButton}>
            <p style={BlueButtonText}>Submit</p>
          </Button>
        </div>
      </form>
    </Grid>
  );
};

export default NewPost;
