import { Grid } from "@mui/material";
import { Button, Popconfirm } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import Edit from "../../../components/icons/edit-05.svg";
import ReturnIcon from "../../../components/icons/reverse-right.svg";
import TrashIcon from "../../../components/icons/trash-01.svg";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { DangerButton } from "../../../styles/global/DangerButton";
import { GrayButton } from "../../../styles/global/GrayButton";
import GrayButtonText from "../../../styles/global/GrayButtonText";
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

  return (
    <Grid container>
      <Grid
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        item
        xs={12}
        sm={12}
        md={12}
        lg={12}
      >
        <h1 style={{ ...titleStyle, textAlign: "left", width: "50%" }}>
          {location.pathname.includes("/posts/post") ? "Post" : "Posts"}
        </h1>
        <div
          style={{
            ...CenteringGrid,
            justifyContent: "flex-end",
            gap: "10px",
            width: "50%",
          }}
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
              <img src={ReturnIcon} alt="return" width="20px" height="20px" />
              &nbsp;Back
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
              <img src={Edit} alt="edit" width="20px" height="20px" />
              &nbsp;Edit this article
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
                <img src={TrashIcon} alt="trash" width="20px" height="20px" />
                &nbsp; Delete this article
              </p>
            </Button>
          </Popconfirm>
          <Button
            onClick={() => navigate("/posts/new-post")}
            style={BlueButton}
          >
            <p style={BlueButtonText}>
              <WhiteCirclePlusIcon />
              &nbsp;Add new post
            </p>
          </Button>
        </div>
      </Grid>
    </Grid>
  );
};

export default Header;
