import { Grid } from "@mui/material";
import Header from "./components/Header";
import { useEffect, useState } from "react";
import BannerMsg from "../../components/utils/BannerMsg";
import { BlueButton } from "../../styles/global/BlueButton";
import { BlueButtonText } from "../../styles/global/BlueButtonText";
import MainGridPosts from "./components/MainGridPosts";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../api/devitrakApi";
const MainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const [posts, setPosts] = useState([]);
  const postsCompanyData = useQuery({
    queryKey: ["postsCompanyData"],
    queryFn: () =>
      devitrakApi.post(`/post/posts`, {
        company_id: user.companyData.id,
      }),
    refetchOnMount: false,
  });
  useEffect(() => {
    //fetch logic
    const controller = new AbortController();
    postsCompanyData.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (postsCompanyData.data) {
      setPosts(postsCompanyData.data.data.companyPosts);
    }
    return () => {
      controller.abort();
    };
  }, [postsCompanyData.data]);

  const refetching = () => {
    return postsCompanyData.refetch();
  };
  
  return (
    <Grid container>
      <Header />
      {posts?.length > 0 ? (
        <MainGridPosts data={posts} refetch={refetching} />
      ) : (
        <BannerMsg
          props={{
            title: "Add your first post",
            message:
              "Posts in this section will show in the consumer side of the app. These posts can be tutorials for how to use devices, how to return them, or any other information you’d like to communicate to your consumer.",
            link: "/posts/new-post",
            button: BlueButton,
            paragraphStyle: BlueButtonText,
            paragraphText: "Add new post",
          }}
        />
      )}
    </Grid>
  );
};

export default MainPage;
