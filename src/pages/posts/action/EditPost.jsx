import { Grid, OutlinedInput, styled } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Select } from "antd";
import { createContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import ImageUploaderFormat from "../../../classes/imageCloudinaryFormat";
import { convertToBase64 } from "../../../components/utils/convertToBase64";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import { DangerButton } from "../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../styles/global/DangerButtonText";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import ImageUploaderUX from "../components/image/ImageUploaderUX";
import "../style/rooter.css";
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

const EditPost = () => {
  const [imageUploadedValue, setImageUploadedValue] = useState(null);
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      media: "",
      company_id: "",
    },
  });
  const [valueDescription, setValueDescription] = useState("");
  const [eventList, setEventList] = useState([]);
  const [assignedEvent, setAssignedEvent] = useState([]);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [article, setArticle] = useState({});
  const { user } = useSelector((state) => state.admin);
  const eventsCompanyList = useQuery({
    queryKey: ["eventsCompanyList"],
    queryFn: () =>
      devitrakApi.post(`/event/event-list`, {
        company_id: user.companyData.id,
      }),
    refetchOnMount: false,
  });
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    const controller = new AbortController();
    const gettingArticle = async () => {
      const response = await devitrakApi.post(`/post/posts`, {
        _id: location.state.id,
        company_id: user.companyData.id,
      });
      if (response.data.ok) {
        setArticle(response.data.companyPosts[0]);
        setValue("title", response.data.companyPosts[0].title);
        setValue("subtitle", response.data.companyPosts[0].subtitle);
        setValueDescription(response.data.companyPosts[0].description);
        setAssignedEvent(response.data.companyPosts[0].displayed_in);
        setValue("media", response.data.companyPosts[0].media);
      }
    };
    gettingArticle();

    return () => {
      controller.abort();
    };
  }, []);

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
      let newImage = article.media.cover;
      if (assignedEvent.length < 1) {
        setIsLoadingState(false);
        return alert("Please select at least one event");
      }
      if (valueDescription.length < 10) {
        setIsLoadingState(false);
        return alert("Please enter a description");
      }

      if (
        imageUploadedValue !== null &&
        imageUploadedValue.length > 0 &&
        imageUploadedValue[0].size > 5242880
      ) {
        setIsLoadingState(false);

        return alert(
          `Image is bigger than allow. Please resize the image or select a new one. Image size: ${imageUploadedValue[0].size} bytes`
        );
      }
      if (imageUploadedValue !== null && imageUploadedValue?.length > 0) {
        const mediaUrl = await convertToBase64(imageUploadedValue[0]);
        const savedPostID = article.id;
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
        newImage = coverMediaArticleCompany.data.imageUploaded.secure_url;
      }

      const template = {
        title: data.title,
        subtitle: data.subtitle,
        description: valueDescription,
        displayed_in: [...assignedEvent],
        media: {
          cover: newImage,
          content: [...article.media.content],
        },
        company_id: user.companyData.id,
        published: true,
        published_at: new Date().toISOString(),
        created_at: article.created_at,
        updated_at: new Date().toISOString(),
        created_for: article.created_for,
        updated_for: user.id,
      };
      const response = await devitrakApi.patch(
        `/post/post-update/${article.id}`,
        template
      );
      if (response.data) {
        setIsLoadingState(false);
        return navigate("/posts");
      }
    } catch (error) {
      setIsLoadingState(false);
      return alert(error);
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
        sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}
      >
        <h1 style={TextFontSize30LineHeight38}>Edit article</h1>
      </Grid>

      {/* Image uploader */}
      {/* <ImageUploaderContext.Provider value={setImageUploadedValue}> */}
      <ImageUploaderUX
        CSS={stylingLabel}
        setImageUploadedValue={setImageUploadedValue}
      />
      {/* </ImageUploaderContext.Provider> */}

      {/* Form content */}
      <form
        style={{ width: "100%", margin: "2.5rem 0" }}
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* cove */}
        <Grid
          item
          xs={12}
          sm={12}
          md={6}
          lg={6}
          key="section-title"
          sx={{
            ...stylingLabel,
            display: article?.media?.cover ? "flex" : "none",
            my: 2,
            flexDirection: "column",
          }}
        >
          <h1 style={stylingLabel}>Current cover (image/video)</h1>
          <div style={stylingLabel}>
            <img src={article?.media?.cover} alt={article?.media?.cover} />{" "}
          </div>
        </Grid>

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
              style={{ width: "100%", overflow: "auto" }}
              value={assignedEvent}
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
              value={valueDescription}
              onChange={setValueDescription}
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
            onClick={() =>
              navigate(`/posts/post/${location.state.id}`, {
                state: { id: location.state.id },
              })
            }
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

export default EditPost;
