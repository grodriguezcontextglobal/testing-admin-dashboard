import { Grid } from "@mui/material";
import { Popconfirm } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import { ButtonGroup, ButtonGroupItem } from "../../../components/UX/buttons/groupButtons/ReusableUntitledUIReactComponent";
const Header = () => {
  const navigate = useNavigate();
  const titleStyle = {
    color: "var(--gray-900)", //#101828
    fontFamily: "Inter",
    fontSize: "30px",
    fontStyle: "normal",
    fontWeight: 600,
    lineHeight: "38px" /* 126.667% */,
  };
  const location = useLocation();

  const handleDeleteArticle = async () => {
    try {
      const response = await devitrakApi.delete(
        `/post/post-delete/${location.state.id}`,
        {
          _id: location.state.id,
        }
      );
      if (response.data.ok) {
        alert(`Delete article: ${location.state.id}`);
        return navigate(`/posts`);
      }
    } catch (error) {
      return alert(error);
    }
  };

  const groupStyle = {
    backgroundColor: "transparent",
    margin: "0 -1rem",
    cursor: "none",
  }
  return (
    <Grid container spacing={2}>
      <Grid
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
        item
        xs={12}
        sm={6}
        md={6}
        lg={6}
      >
        <h1 style={{ ...titleStyle, textAlign: "left", width: "50%" }}>
          {location.pathname.includes("/posts/post") ? "Post" : "Posts"}
        </h1>
      </Grid>
      <Grid sx={{ justifyContent: { xs: "flex-start", sm: "flex-end", md: "flex-end", lg: "flex-end" } }} item xs={12} sm={6} md={6} lg={6}>
        {location.pathname.includes("/posts/post") && (
          <ButtonGroup key="header-button-group" id="header-button-group" style={{ cursor: "none",display: "flex", justifyContent: "flex-end" }}>
            <ButtonGroupItem style={groupStyle}>
              <BlueButtonComponent title={"Back"} func={() => navigate(`/posts`)} />
            </ButtonGroupItem>
            <ButtonGroupItem style={groupStyle}>
              <GrayButtonComponent title={"Edit this article"} func={() => navigate(`/posts/post-edit/${location.state.id}`, {
                state: { id: location.state.id },
              })} />
            </ButtonGroupItem>
            <Popconfirm
              title="Are you sure to delete this article?"
              onConfirm={handleDeleteArticle}
            >
              <ButtonGroupItem style={groupStyle}>
                <GrayButtonComponent title={"Delete this article"} />
              </ButtonGroupItem>
            </Popconfirm>
            <ButtonGroupItem style={groupStyle}>
              <BlueButtonComponent title={"Add new post"} func={() => navigate("/posts/new-post")} />

            </ButtonGroupItem>
          </ButtonGroup>
        )}
      </Grid>
    </Grid>
  );
};

export default Header;
// import Edit from "../../../components/icons/edit-05.svg";
// import ReturnIcon from "../../../components/icons/reverse-right.svg";
// import TrashIcon from "../../../components/icons/trash-01.svg";
// import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
// import { BlueButton } from "../../../styles/global/BlueButton";
// import { BlueButtonText } from "../../../styles/global/BlueButtonText";
// import { DangerButton } from "../../../styles/global/DangerButton";
// import { GrayButton } from "../../../styles/global/GrayButton";
// import GrayButtonText from "../../../styles/global/GrayButtonText";

{/* <Grid
        sx={{
          justifyContent: {
            xs: "flex-start",
            sm: "flex-end",
            md: "flex-end",
            lg: "flex-end",
          },
          gap: "10px",
          display: "flex",
          alignItems: "center",
          flexDirection: {
            xs: "column",
            sm: "row",
            md: "row",
            lg: "row",
          },
        }}
        item
        xs={12}
        sm={6}
        md={6}
        lg={6}
      >
        <Button
          onClick={() => navigate(`/posts`)}
          style={{
            ...BlueButton,
            display: location.pathname.includes("/posts/post")
              ? "flex"
              : "none",
          }}
        >
          <p style={BlueButtonText}>
            <img src={ReturnIcon} alt="return" width="20px" height="20px" />{" "}
            Back
          </p>
        </Button>
        <Button
          onClick={() =>
            navigate(`/posts/post-edit/${location.state.id}`, {
              state: { id: location.state.id },
            })
          }
          style={{
            ...GrayButton,
            display: location.pathname.includes("/posts/post")
              ? "flex"
              : "none",
          }}
        >
          <p style={GrayButtonText}>
            <img src={Edit} alt="edit" width="20px" height="20px" />{" "}
            Edit this article
          </p>
        </Button>
        <Popconfirm
          title="Are you sure to delete this article?"
          onConfirm={handleDeleteArticle}
        >
          <Button
            style={{
              ...GrayButton,
              display: location.pathname.includes("/posts/post")
                ? "flex"
                : "none",
              border: DangerButton.border,
            }}
          >
            <p
              style={{
                ...GrayButtonText,
                color: DangerButton.backgroundColor,
              }}
            >
              <img src={TrashIcon} alt="trash" width="20px" height="20px" />{" "}Delete this article
            </p>
          </Button>
        </Popconfirm>
        <BlueButtonComponent title={"Add new post"} func={() => navigate("/posts/new-post")} />
      </Grid> */}
