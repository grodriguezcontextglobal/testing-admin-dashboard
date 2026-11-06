import { devitrakApi } from "../../../api/devitrakApi";
import { Grid } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import DOMPurify from "dompurify";
import Header from "./Header";
import { useSelector } from "react-redux";

const DisplayArticle = () => {
  const location = useLocation();
  const [article, setArticle] = useState({});
  const { user } = useSelector((state) => state.admin)
  const postId = location.state?.id;
  const companyId = user.companyData.id;
  useEffect(() => {
    let cancelled = false;
    const first = async () => {
      const response = await devitrakApi.post(`/post/posts`, {
        _id: postId,
        company_id: companyId,
      });
      if (!cancelled && response.data) {
        setArticle(response.data.companyPosts[0]);
      }
    };
    first().catch((error) => { console.error("Loading the post:", error); });
    return () => {
      cancelled = true;
    };
  }, [postId, companyId]);

  // The post body is HTML written in the editor: always sanitized before it
  // is rendered.
  const description = article?.description;
  const clean = useMemo(
    () => (description ? DOMPurify.sanitize(description) : ""),
    [description]
  );

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
