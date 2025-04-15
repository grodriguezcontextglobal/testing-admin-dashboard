import { Grid, TextField, Typography } from "@mui/material";
import { Avatar } from "antd";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { UploadIcon } from "../../icons/UploadIcon";

const ImageUploaderUX = ({ setImageUploadedValue }) => {
  const { register, watch } = useForm({
    defaultValues:{
      photo: null,
    }
  });
  const styling = {
    textTransform: "none",
    textAlign: "left",
    fontFamily: "Inter",
    fontSize: "14px",
    fontStyle: "normal",
    fontWeight: 500,
    lineHeight: "20px",
    color: "var(--gray-700, #344054)",
  };

  const formStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    borderRadius: "12px",
    border: "1px solid var(--gray-200, #EAECF0)",
    background: "var(--base-white, #FFF)",
  };

  useEffect(() => {
    const controller = new AbortController();
    const media = watch("photo");
    if (media !== null && media.length > 0) {
      setImageUploadedValue(media);
    }
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch("photo") !== null && watch("photo").length > 0]);

  return (
      <form style={formStyle}>
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          padding={0}
          item
          xs={12}
        >
          <Avatar
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              border: "6px solid var(--gray-50, #F9FAFB)",
              background: "6px solid var(--gray-50, #F9FAFB)",
              borderRadius: "28px",
            }}
          >
            {" "}
            <UploadIcon />
          </Avatar>
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          item
          xs={12}
        >
          <TextField
            {...register("photo")}
            type="file"
            className="photo_input"
            accept=".jpeg, .png, .jpg"
            style={{
              outline: "none",
              border: "transparent",
            }}
          />
        </Grid>
        <Grid
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          marginBottom={2}
          item
          xs={12}
        >
          <Typography
            color={"var(--gray-600, #475467)"}
            style={{ ...styling, fontWeight: 400 }}
          >
            SVG, PNG, JPG or GIF (max. 5MB)
          </Typography>
        </Grid>
      </form>
  );
};

export default ImageUploaderUX;
