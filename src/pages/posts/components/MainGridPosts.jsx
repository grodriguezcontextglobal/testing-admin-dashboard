import { Grid } from "@mui/material";
import { Card, message, Switch } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { useMediaQuery } from "@uidotdev/usehooks";
const { Meta } = Card;

const MainGridPosts = ({ data, refetch }) => {
  const navigate = useNavigate();
  // const [page, setPage] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState(null);
  // const handleChange = (_, value) => {
  //   setPage(value);
  // };

  const handleSwitchChange = async (props) => {
    try {
      setLoadingStatus(props.id);
      const response = await devitrakApi.patch(
        `/post/post-update/${props.id}`,
        {
          ...props.article,
          published: props.published,
        }
      );
      if (response.data.ok) {
        refetch();
        return setLoadingStatus(null);
      }
      return setLoadingStatus(null);
    } catch (error) {
      message.error(error.message);
      return setLoadingStatus(null);
    }
  };

  const isSmallDevice = useMediaQuery("only screen and (max-width : 768px)");
  const isMediumDevice = useMediaQuery(
    "only screen and (min-width : 769px) and (max-width : 992px)"
  );
  const isLargeDevice = useMediaQuery(
    "only screen and (min-width : 993px) and (max-width : 1200px)"
  );
  const isExtraLargeDevice = useMediaQuery(
    "only screen and (min-width : 1201px)"
  );

  const [width, setWidth] = useState(300);
  useEffect(() => {
    const controller = new AbortController();
    if (isSmallDevice || isMediumDevice) {
      setWidth(300);
    }
    if (isLargeDevice || isExtraLargeDevice) {
      setWidth(400);
    }
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div style={{ padding: "1rem 0" }}>
      <Grid container spacing={3}>
        {/* <Space size={[8, 16]} wrap> */}
        {data.map((article) => (
          <Grid item xs={12} sm={12} md={4} lg={4} key={article.id}>
            <Card
              style={{ padding: "24px", width: width }}
              styles={{
                actions: {
                  border: "none",
                  padding: "0",
                },
                cover: {
                  cursor: "pointer",
                },
              }}
              cover={
                <img
                  src={article.media.cover}
                  alt={article.media.cover}
                  width={"100%"}
                  height={"100%"}
                  onClick={() =>
                    navigate(`/posts/post/${article.id}`, {
                      state: { id: article.id },
                    })
                  }
                />
              }
              actions={[
                <Switch
                  key={`switch-${article.id}`}
                  checkedChildren="Published"
                  uncheckedChildren="No published"
                  defaultChecked={article.published}
                  loading={loadingStatus === article.id}
                  onChange={(e) =>
                    handleSwitchChange({
                      id: article.id,
                      published: e,
                      article: article,
                    })
                  }
                  style={{}}
                />,
              ]}
            >
              <Meta title={article.title} description={article.subtitle} />
            </Card>{" "}
          </Grid>
        ))}
        {/* </Space> */}
      </Grid>
      {/* <Grid container>
        <Grid
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
          key="posts-footer-pagination"
        >
          <Pagination
            count={data.length}
            page={page}
            onChange={handleChange}
            renderItem={(item) => <PaginationItem {...item} />}
            size="large"
            sx={{
              width: "100%",
              mt: "1rem",
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
            }}
          />{" "}
        </Grid>
      </Grid> */}
    </div>
  );
};

export default MainGridPosts;

// const articles = [
//   {
//     id: 1,
//     title: "Worem ipsum dolor sit amet",
//     description: "Consectetur adipiscing elit.",
//     image:
//       "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
//   },
//   {
//     id: 2,
//     title: "Horem ipsum dolor sit amet",
//     description: "Consectetur adipiscing elit.",
//     image:
//       "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
//   },
//   {
//     id: 3,
//     title: "Korem ipsum dolor sit amet",
//     description: "Consectetur adipiscing elit.",
//     image:
//       "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
//   },
//   {
//     id: 4,
//     title: "Another article heading",
//     description: "Consectetur adipiscing elit.",
//     image:
//       "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
//   },
//   {
//     id: 5,
//     title: "Yet another heading",
//     description: "Consectetur adipiscing elit.",
//     image:
//       "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
//   },
//   {
//     id: 6,
//     title: "Sample article heading",
//     description: "Consectetur adipiscing elit.",
//     image:
//       "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
//   },
//   {
//     id: 7,
//     title: "Lorem ipsum title",
//     description: "Consectetur adipiscing elit.",
//     image:
//       "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
//   },
//   {
//     id: 8,
//     title: "Short title here",
//     description: "Consectetur adipiscing elit.",
//     image:
//       "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
//   },
//   {
//     id: 9,
//     title: "Last example article",
//     description: "Consectetur adipiscing elit.",
//     image:
//       "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
//   },
// ];
