import { devitrakApi } from "../../../api/devitrakApi";
import { Grid } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DOMPurify from "dompurify";
import Header from "./Header";

const DisplayArticle = () => {
  const location = useLocation();
  const [article, setArticle] = useState({});
  useEffect(() => {
    const controller = new AbortController();
    const first = async () => {
      const response = await devitrakApi.post(`/post/posts`, {
        _id: location.state.id,
      });
      if (response.data.ok) {
        console.log(response.data.companyPosts[0]);
        setArticle(response.data.companyPosts[0]);
      }
    };
    first();
    return () => {
      controller.abort();
    };
  }, []);

  const clean = DOMPurify.sanitize(article.description);
  return (
    <Grid container>
      <Header />
      <Grid
        style={{ margin: "2rem auto", padding: "1rem 0" }}
        item
        xs={12}
        sm={12}
        md={10}
        lg={10}
      >
        <div dangerouslySetInnerHTML={{ __html: clean }} />
      </Grid>
    </Grid>
  );
};

export default DisplayArticle;
