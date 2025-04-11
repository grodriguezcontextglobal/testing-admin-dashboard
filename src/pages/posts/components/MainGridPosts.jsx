import { Grid } from "@mui/material";
import { Card, message, Space, Switch } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
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

  return (
    <div style={{ padding: "1rem 0" }}>
      <Space size={[8, 16]} wrap>
        {data.map((article) => (
          <Grid item xs={12} key={article.id}>
            <Card
              onClick={() =>
                navigate(`/posts/post/${article.id}`, {
                  state: { id: article.id },
                })
              }
              style={{ padding: "24px", cursor: "pointer" }}
              styles={{
                actions: {
                  border: "none",
                  padding: "0",
                },
              }}
              cover={
                <img
                  src={article.media.cover}
                  alt={article.media.cover}
                  width={"100%"}
                  height={"100%"}
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
      </Space>
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
