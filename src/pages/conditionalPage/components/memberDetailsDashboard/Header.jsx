import { Grid, Typography } from "@mui/material";
import { Avatar, Divider } from "antd";
import { Link } from "react-router-dom";
import Loading from "../../../../components/animation/Loading";
import Breadcrumb from "../../../../components/UX/breadcrumbs/Breadcrumb";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import TextFontsize18LineHeight28 from "../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize30LineHeight38 } from "../../../../styles/global/TextFontSize30LineHeight38";
import { useSelector } from "react-redux";
import { WhiteCirclePlusIcon } from "../../../../components/icons/WhiteCirclePlusIcon";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
// import { data } from "../../mock/mockData";

const MemberInfoHeader = ({ pageTitle, memberInfo, groupName }) => {
  const detailMemberInfo = memberInfo?.at(-1);
  const { user } = useSelector((state) => state.admin);
  const c = {
    isLoading: false,
    data: [],
    isFetched: false,
    isRefetching: false,
  };
  if (c.isLoading)
    return (
      <div style={CenteringGrid}>
        <Loading />
      </div>
    );
  if (c.data || c.isFetched || c.isRefetching) {
    const breadcrumbItems = [
      {
        title: (
          <Link to="/members" state={{ referencing: groupName }}>
            <button
              style={{
                backgroundColor: "transparent",
                outline: "none",
                margin: 0,
                padding: 0,
              }}
              //   onClick={() => dispatch(onResetStaffProfile())}
            >
              {" "}
              <p
                style={{
                  ...TextFontsize18LineHeight28,
                  textAlign: "left",
                  color: "var(--blue-dark-600)",
                }}
              >
                All {groupName}
              </p>
            </button>
          </Link>
        ),
      },
      {
        title: (
          <p
            style={{
              ...TextFontsize18LineHeight28,
              textAlign: "left",
              color: "var(--gray-900)",
            }}
          >
            {detailMemberInfo?.first_name}, {detailMemberInfo?.last_name}
          </p>
        ),
      },
    ];

    const styleGrid = {
      display: "flex",
      flexDirection: "column",
      justifyContent: {
        xs: "center",
        sm: "center",
        md: "flex-start",
        lg: "flex-start",
      },
      alignItems: "flex-start",
    };
    const renderingOptions = (id) => {
      switch (id) {
        case 0:
          return {
            ...TextFontsize18LineHeight28,
            textAlign: "left",
            textTransform: "capitalize",
            width: "100%",
          };
        case 1:
          return {
            ...TextFontSize30LineHeight38,
            textAlign: "left",
            textTransform: "capitalize",
            width: "100%",
          };
        case 2:
          return {
            ...TextFontsize18LineHeight28,
            textTransform: "capitalize",
            color: "var(--gray-900)",
            textAlign: "left",
            fontWeight: 400,
            width: "100%",
          };
        default:
          return null;
      }
    };

    return (
      <>
        <Grid
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          container
        >
          <Grid container flexDirection={"column"}>
            <Grid
              sx={{
                justifyContent: {
                  xs: "flex-start",
                  sm: "flex-start",
                  md: "space-between",
                  lg: "space-between",
                },
                display: "flex",
                flexDirection: {
                  xs: "column",
                  sm: "column",
                  md: "row",
                  lg: "row",
                },
              }}
              item
              xs={12}
              sm={12}
              md={12}
              lg={12}
            >
              <Typography
                style={{ ...TextFontSize30LineHeight38, textAlign: "left" }}
              >
                {pageTitle}
              </Typography>
              <Grid
                sx={{
                  justifyContent: {
                    xs: "flex-start",
                    sm: "flex-start",
                    md: "flex-end",
                    lg: "flex-end",
                  },
                  display: Number(user.role) < 2 ? "flex" : "none",
                  gap: 1,
                  alignItems: "center",
                }}
                item
                xs={12}
                sm={12}
                md={6}
                lg={6}
              >
                <BlueButtonComponent
                  title={"Add new member"}
                  //   func={() => setModalState(true)}
                  icon={<WhiteCirclePlusIcon />}
                />
              </Grid>
            </Grid>
            <Breadcrumb path={breadcrumbItems} />
          </Grid>
          <Divider style={{ margin: "0 0 15px" }} />
          <Grid
            sx={{
              display: "flex",
              flexDirection: {
                xs: "column",
                sm: "column",
                md: "row",
                lg: "row",
              },
            }}
            alignSelf={"flex-start"}
            item
            xs={12}
            sm={12}
            md={4}
            lg={4}
          >
            <Grid
              sx={{
                ...styleGrid,
                flexDirection: "row",
              }}
              item
              xs={12}
              sm={12}
              md={3}
              lg={3}
            >
              {" "}
              <Avatar
                src={detailMemberInfo?.image_url}
                style={{ width: "5rem", height: "5rem" }}
              >
                {!detailMemberInfo?.image_url &&
                  `${detailMemberInfo?.first_name?.at(
                    0
                  )} ${detailMemberInfo?.last_name?.at(0)}`}
              </Avatar>
            </Grid>
            <Grid sx={styleGrid} item xs={12} sm={12} md={9} lg={9}>
              {[
                { title: "name", id: 0 },
                {
                  title: `${detailMemberInfo?.first_name} ${
                    detailMemberInfo?.last_name ?? ""
                  }`,
                  id: 1,
                },
                detailMemberInfo?.external_id && {
                  title: `External ID: ${detailMemberInfo.external_id}`,
                  id: 2,
                },
              ]
                .filter(Boolean)
                .map((item) => (
                  <Typography
                    key={item.id}
                    sx={{
                      ...renderingOptions(item.id),
                      textAlign: {
                        xs: "center",
                        sm: "center",
                        md: "left",
                        lg: "left",
                      },
                      width: "100%",
                      margin: item.id === 2 ? "0 auto 20px" : "auto",
                    }}
                  >
                    {item.title}
                  </Typography>
                ))}
            </Grid>
          </Grid>
          <Grid
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: {
                xs: "center",
                sm: "center",
                md: "flex-start",
                lg: "flex-start",
              },
              alignSelf: "flex-start",
            }}
            item
            xs={12}
            sm={12}
            md={4}
            lg={4}
          >
            <Typography
              sx={{
                ...TextFontsize18LineHeight28,
                textAlign: {
                  xs: "center",
                  sm: "center",
                  md: "left",
                  lg: "left",
                },
                color: "var(--gray-900)",
                width: "100%",
              }}
            >
              Contact
            </Typography>
            <Typography
              sx={{
                ...TextFontSize30LineHeight38,
                width: "100%",
                textAlign: {
                  xs: "center",
                  sm: "center",
                  md: "left",
                  lg: "left",
                },
                paddingTop: "8px",
              }}
            >
              {detailMemberInfo?.phone_number
                ? detailMemberInfo?.phone_number
                : "+1-000-000-0000"}
            </Typography>
            <Typography
              sx={{
                ...TextFontsize18LineHeight28,
                textAlign: {
                  xs: "center",
                  sm: "center",
                  md: "left",
                  lg: "left",
                },
                color: "var(--gray-900)",
                width: "100%",
                textTransform: "none",
              }}
            >
              {detailMemberInfo?.email}
            </Typography>
          </Grid>
        </Grid>{" "}
      </>
    );
  }
};

export default MemberInfoHeader;
