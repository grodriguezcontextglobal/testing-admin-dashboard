import { devitrakApi } from "../../../api/devitrakApi";
import { Grid } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DOMPurify from "dompurify";
import Header from "./Header";
import { useSelector } from "react-redux";

const DisplayArticle = () => {
  const location = useLocation();
  const [article, setArticle] = useState({});
  const [clean, setClean] = useState({});
  const { user } = useSelector((state) => state.admin)
  useEffect(() => {
    const controller = new AbortController();
    const first = async () => {
      const response = await devitrakApi.post(`/post/posts`, {
        _id: location.state.id,
        company_id:user.companyData.id
      });
      if (response.data) {
        setArticle(response.data.companyPosts[0]);
      }
    };
    first();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (article.description) {
      const sanitized = DOMPurify.sanitize(article.description);
      setClean(sanitized);
    }

    return () => {
      controller.abort();
    };
  }, [article.description && article.description.length > 0]);

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
