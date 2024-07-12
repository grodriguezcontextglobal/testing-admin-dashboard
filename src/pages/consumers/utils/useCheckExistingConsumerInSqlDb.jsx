import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";

const useCheckExistingConsumerInSqlDb = () => {
  const { customer } = useSelector((state) => state.customer);
  const checkConsumerInSqlDb = useQuery({
    queryKey: ["consumerInSqlDb"],
    queryFn: () =>
      devitrakApi.post("/db_consumer/consulting-consumer", {
        email: customer.email,
      }),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    checkConsumerInSqlDb.refetch();
    return () => {
      controller.abort();
    };
  }, []);
if(checkConsumerInSqlDb.data) return checkConsumerInSqlDb.data.data.consumer;
};

export default useCheckExistingConsumerInSqlDb;
