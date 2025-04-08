import { Grid, Pagination, PaginationItem } from "@mui/material";
import { Card } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
const { Meta } = Card;

const MainGridPosts = () => {
  const articles = [
    {
      id: 1,
      title: "Worem ipsum dolor sit amet",
      description: "Consectetur adipiscing elit.",
      image:
        "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
    },
    {
      id: 2,
      title: "Horem ipsum dolor sit amet",
      description: "Consectetur adipiscing elit.",
      image:
        "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
    },
    {
      id: 3,
      title: "Korem ipsum dolor sit amet",
      description: "Consectetur adipiscing elit.",
      image:
        "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
    },
    {
      id: 4,
      title: "Another article heading",
      description: "Consectetur adipiscing elit.",
      image:
        "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
    },
    {
      id: 5,
      title: "Yet another heading",
      description: "Consectetur adipiscing elit.",
      image:
        "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
    },
    {
      id: 6,
      title: "Sample article heading",
      description: "Consectetur adipiscing elit.",
      image:
        "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
    },
    {
      id: 7,
      title: "Lorem ipsum title",
      description: "Consectetur adipiscing elit.",
      image:
        "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
    },
    {
      id: 8,
      title: "Short title here",
      description: "Consectetur adipiscing elit.",
      image:
        "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
    },
    {
      id: 9,
      title: "Last example article",
      description: "Consectetur adipiscing elit.",
      image:
        "https://fastly.picsum.photos/id/602/600/600.jpg?hmac=bzg_XbKsV7t3KThEGI94sZK2Xh0p8L6Qo7U7Ms1i4wQ",
    },
  ];
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const handleChange = (event, value) => {
    setPage(value);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Grid container spacing={3}>
        {articles.map((article) => (
          <Grid item xs={12} sm={6} md={4} key={article.id}>
            <Card
              onClick={() => navigate(`/posts/post/${article.id}`)}
              style={{ width: 300, padding: "24px", cursor: "pointer" }}
              cover={
                <img
                  src={article.image}
                  alt={article.image}
                  width={"100%"}
                  height={"100%"}
                />
              }
              actions={[]}
            >
              <Meta title={article.title} description={article.description} />
            </Card>{" "}
          </Grid>
        ))}
      </Grid>
      <Grid container>
        <Grid item xs={12} sm={12} md={12} lg={12} key="posts-footer-pagination">
          <Pagination
            count={10}
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
      </Grid>
    </div>
  );
};

export default MainGridPosts;
