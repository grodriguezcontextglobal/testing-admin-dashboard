import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { devitrakApi, devitrakApiAdmin } from "../../../../../../../api/devitrakApi";

/**
 * Custom hook to manage device status in the pool.
 * It provides:
 * - Device pool data (fetching and caching)
 * - Mutation to assign a device (optimistic updates could be added here if needed)
 * - Helper functions to check device availability
 */
export const useDeviceStatus = (event, user) => {
  const queryClient = useQueryClient();

  // 1. Fetch Device Pool
  const deviceInPoolQuery = useQuery({
    queryKey: ["poolInfoQuery", event?.eventInfoDetail?.eventName, user?.companyData?.id],
    queryFn: async () => {
        if (!event?.eventInfoDetail?.eventName || !user?.companyData?.id) return { data: { receiversInventory: [] } };
      return await devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
        activity: false,
      });
    },
    enabled: !!event?.eventInfoDetail?.eventName && !!user?.companyData?.id,
    staleTime: 1000 * 60 * 1, // 1 minute stale time
    refetchOnWindowFocus: true,
  });

  const devicesInPool = deviceInPoolQuery?.data?.data?.receiversInventory || [];

  // 2. Mutation to Assign Device (Centralized logic)
  const assignDeviceMutation = useMutation({
    mutationFn: async (payload) => {
      // payload should contain: template, deviceIdToUpdate
      const { template, deviceIdToUpdate } = payload;
      
      // 1. Create assignment record
      const assignmentRes = await devitrakApiAdmin.post("/receiver-assignation", template);

      if (!assignmentRes.data.ok) {
        throw new Error("Failed to assign device.");
      }

      // 2. Update device status in pool
      await devitrakApi.patch(`/receiver/receivers-pool-update/${deviceIdToUpdate}`, {
        status: "Operational",
        activity: true,
        comment: "No comment",
      });

      return assignmentRes.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data across components
      queryClient.invalidateQueries({ queryKey: ["poolInfoQuery"] }); // Refresh pool
      queryClient.invalidateQueries({ queryKey: ["listOfDevicesAssigned"] });
      queryClient.invalidateQueries({ queryKey: ["assignedDeviceListQuery"] });
      queryClient.invalidateQueries({ queryKey: ["deviceInPoolQuery"] });
    },
    onError: (error) => {
      notification.error({
        message: "Error",
        description: error.message || "Something went wrong during assignment.",
      });
    },
  });

  // 3. Helper: Check if device is available/assigned
  const getDeviceStatus = (serialNumber) => {
    if (!devicesInPool || devicesInPool.length === 0) return "unavailable";

    const deviceRecords = devicesInPool.filter(d => d.device === serialNumber);
    if (deviceRecords.length === 0) return "not_found";

    // Check if any record for this serial number is active/assigned
    const isAssigned = deviceRecords.some(d => d.activity || String(d.status).toLowerCase() === "lost");
    
    if (isAssigned) return "assigned";
    
    // Return the specific device object if available
    return { status: "available", device: deviceRecords.at(-1) };
  };

  return {
    devicesInPool,
    isLoadingPool: deviceInPoolQuery.isLoading,
    refetchPool: deviceInPoolQuery.refetch,
    assignDevice: assignDeviceMutation.mutateAsync,
    isAssigning: assignDeviceMutation.isPending,
    getDeviceStatus,
  };
};
