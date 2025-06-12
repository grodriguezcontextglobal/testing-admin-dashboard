import { devitrakApi } from "../../api/devitrakApi";

const clearCacheMemory = async (key) => {
  return await devitrakApi.post("/cache_update/remove-cache", key);
};

export default clearCacheMemory;

// export const useInvalidateQueries = (key) => {
//   const queryClient = useQueryClient();
//   return queryClient.invalidateQueries({
//     queryKey: [key],
//     exact: true,
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
//   });
// };
