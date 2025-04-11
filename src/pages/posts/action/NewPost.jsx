import { Grid, OutlinedInput, styled } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, message, Select } from "antd";
import { createContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { DangerButton } from "../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../styles/global/DangerButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import ImageUploaderUX from "../components/image/ImageUploaderUX";
import "../style/rooter.css";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import { useNavigate } from "react-router-dom";
import ImageUploaderFormat from "../../../classes/imageCloudinaryFormat";
import { TextFontSize30LineHeight38 } from "../../../styles/global/TextFontSize30LineHeight38";

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
  const [isLoadingState, setIsLoadingState] = useState(false);
  const { user } = useSelector((state) => state.admin);
  const imageUploadedRef = useRef(null);
  const eventsCompanyList = useQuery({
    queryKey: ["eventsCompanyList"],
    queryFn: () =>
      devitrakApi.post(`/event/event-list`, {
        company_id: user.companyData.id,
      }),
    refetchOnMount: false,
  });
  const navigate = useNavigate();

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

  const onSubmit = async (data) => {
    try {
      setIsLoadingState(true);
      if (assignedEvent.length < 1) {
        setIsLoadingState(false);
        return alert("Please select at least one event");
      }
      if (
        imageUploadedRef.current !== null &&
        imageUploadedRef.current.length > 0 &&
        imageUploadedRef.current[0].size > 3145728
      ) {
        setIsLoadingState(false);
        return alert(
          "Image is bigger than allow. Please resize the image or select a new one."
        );
      }
      imageUploadedRef.current = imageUploadedValue;
      const template = {
        title: data.title,
        subtitle: data.subtitle,
        description: value,
        displayed_in: [...assignedEvent],
        media: {
          cover: "",
          content: [],
        },
        company_id: user.companyData.id,
        published: true,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_for: user.id,
        updated_for: user.id,
      };
      const response = await devitrakApi.post("/post/new-post", template);
      if (response.data) {
        if (imageUploadedRef.current !== null && imageUploadedRef.current?.length > 0) {
          const mediaUrl = await convertToBase64(imageUploadedRef.current[0]);
          const savedPostID = response.data.post.id;
          const mediaUploader = new ImageUploaderFormat(
            mediaUrl,
            user.companyData.id,
            "",
            "",
            "",
            "",
            "",
            "",
            savedPostID
          );
          const coverMediaArticleCompany = await devitrakApi.post(
            "/cloudinary/upload-image",
            mediaUploader.article_media_uploader()
          );

          const template = {
            ...response.data.post,
            media: {
              cover: coverMediaArticleCompany.data.imageUploaded.secure_url,
              content: [...response.data.post.media.content],
            },
          };
          await devitrakApi.patch(`/post/post-update/${savedPostID}`, template);
          setIsLoadingState(false);
          return navigate("/posts");
        }
        setIsLoadingState(false);
        return navigate("/posts");
      }
    } catch (error) {
      setIsLoadingState(false);
      return message.error(error);
    }
  };

  const onChange = (value) => {
    if (value.some((item) => item === 0)) {
      return setAssignedEvent([...eventList.map((item) => item.id)]);
    }
    return setAssignedEvent(value);
  };

  return (
    <Grid container>
      {/* Header */}
      <Grid
        item
        xs={12}
        sm={12}
        md={6}
        lg={6}
        padding={0}
        sx={{ display: "flex", justifyContent: "flex-start", mb: 2, padding: 0 }}
      >
        <h1 style={TextFontSize30LineHeight38}>New article</h1>
      </Grid>

      {/* Image uploader */}
      {/* <ImageUploaderContext.Provider value={{setImageUploadedValue}}> */}
        <ImageUploaderUX CSS={stylingLabel} setImageUploadedValue={setImageUploadedValue}/>
      {/* </ImageUploaderContext.Provider> */}
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
              required
              type="text"
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
              required
              type="text"
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
              className="custom-autocomplete-selector"
              showSearch
              mode="multiple"
              allowClear
              optionFilterProp="children"
              style={{ width: "100%" }}
              onChange={onChange}
              options={[
                {
                  value: 0,
                  label: (
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                      }}
                    >
                      <p
                        style={{
                          color: "#000",
                          fontSize: "14px",
                          fontWeight: "500",
                          lineHeight: "20px",
                          marginBottom: "0px",
                        }}
                      >
                        All events
                      </p>
                    </div>
                  ),
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
          <Button
            style={DangerButton}
            htmlType="reset"
            onClick={() => navigate("/posts")}
          >
            <p style={DangerButtonText}>Cancel</p>
          </Button>
          <Button loading={isLoadingState} htmlType="submit" style={BlueButton}>
            <p style={BlueButtonText}>Submit</p>
          </Button>
        </div>
      </form>
    </Grid>
  );
};

export default NewPost;
