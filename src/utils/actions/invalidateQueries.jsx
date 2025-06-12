import { useQueryClient } from "@tanstack/react-query";

const InvalidateQueries = ({ name, props = null }) => {
  const queryClient = useQueryClient();
  const fullName = props ? [name, props] : [name];
  return queryClient.invalidateQueries({
    queryKey: fullName,
    exact: true,
    // refetchActive: true,
    // refetchInactive: true,
    // refetchInterval: false,
    // refetchIntervalInBackground: false,
    // refetchOnWindowFocus: false,
    // refetchOnMount: false,
    // refetchOnReconnect: false,
    // refetchOnFocus: false,
    // refetchOnReconnectError: false,
    // refetchOnError: false,
    // retry: false,
    // retryOnMount: false,
    // retryOnFocus: false,
    // retryOnReconnect: false,
    // retryDelay: 0,
    // retryOnError: false,
    // cacheTime: 0,
    // staleTime: 0,
    // networkMode: "always",
    // select: undefined,
    // suspense: false,
    // notifyOnChangeProps: [],
    // onSuccess: undefined,
    // onError: undefined,
    // onSettled: undefined,
    // onSettledTime: 0,
    // onSettledStatus: undefined,
    // enabled: true,
    // manual: false,
    // defaultOptions: undefined,

    // // Options
    // suspenseTime: 0,
    // ...props,
  });
};

export default InvalidateQueries;
