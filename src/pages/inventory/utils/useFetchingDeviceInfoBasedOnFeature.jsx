import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { useEffect } from "react";
import Loading from "../../../components/animation/Loading";

const useFetchingDeviceInfoBasedOnFeature = (props) => {
  const { variableName, value } = props;
  const { user } = useSelector((state) => state.admin);
  const consultingDeviceInfoQuery = useQuery({
    queryKey: ["consulting_device_info"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company: user.company,
        item_id: value,
      }),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    consultingDeviceInfoQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [variableName, value]);

  if (consultingDeviceInfoQuery.isLoading)
    return (
      <div>
        <Loading />
      </div>
    );
  return consultingDeviceInfoQuery?.data?.data;
};

export default useFetchingDeviceInfoBasedOnFeature;
