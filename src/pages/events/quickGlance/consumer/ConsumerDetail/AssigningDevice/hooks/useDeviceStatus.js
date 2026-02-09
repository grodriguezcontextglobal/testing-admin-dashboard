import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import {
  devitrakApi,
  devitrakApiAdmin,
} from "../../../../../../../api/devitrakApi";

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
    queryKey: [
      "poolInfoQuery",
      event?.eventInfoDetail?.eventName,
      user?.companyData?.id,
    ],
    queryFn: async () => {
      if (!event?.eventInfoDetail?.eventName || !user?.companyData?.id)
        return { data: { receiversInventory: [] } };
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
      const assignmentRes = await devitrakApiAdmin.post(
        "/receiver-assignation",
        template,
      );

      if (!assignmentRes.data.ok) {
        throw new Error("Failed to assign device.");
      }

      // 2. Update device status in pool
      await devitrakApi.patch(
        `/receiver/receivers-pool-update/${deviceIdToUpdate}`,
        {
          status: "Operational",
          activity: true,
          comment: "No comment",
        },
      );

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

  // 3. Mutation to Unassign/Remove Device
  const unassignDeviceMutation = useMutation({
    mutationFn: async (payload) => {
      const { assignmentId, serialNumber, deviceType } = payload;

      // 1. Remove transaction/assignment
      const response = await devitrakApi.delete(
        `/receiver/remove-transaction/${assignmentId}`,
      );

      if (!response.data.ok) {
        throw new Error("Failed to remove device assignment.");
      }

      // 2. Find device in pool to get its ID
      // We need to enable the device in the pool again (activity: false)
      const deviceInPoolRes = await devitrakApi.post(
        "/receiver/receiver-pool-list",
        {
          activity: true, // It was active/assigned
          eventSelected: event.eventInfoDetail.eventName,
          company: user.companyData.id,
          device: serialNumber,
          type: deviceType,
        },
      );

      const poolItems = deviceInPoolRes?.data?.receiversInventory;
      // We need to find the specific item. The original code uses `checkArray` which likely returns the first item or checks for existence.
      // Assuming checkArray behavior or just taking the first one if multiple exist (which shouldn't happen for unique serials in same event/company theoretically, but let's be safe).
      // The original code: checkArray(deviceInPool.data.receiversInventory).id

      const targetDevice = Array.isArray(poolItems) ? poolItems[0] : poolItems;

      if (targetDevice?.id) {
        // 3. Update pool status to available (activity: false)
        await devitrakApi.patch(
          `/receiver/receivers-pool-update/${targetDevice.id}`,
          {
            activity: false,
          },
        );
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poolInfoQuery"] });
      queryClient.invalidateQueries({ queryKey: ["listOfDevicesAssigned"] });
      queryClient.invalidateQueries({ queryKey: ["assignedDeviceListQuery"] });
      queryClient.invalidateQueries({
        queryKey: ["assignedDeviceInPaymentIntent"],
      }); // Specific to search bar modal
      queryClient.invalidateQueries({
        queryKey: ["transactionPerConsumerListQuery"],
      }); // Update transactions
    },
    onError: (error) => {
      notification.error({
        message: "Error",
        description: error.message || "Failed to remove device.",
      });
    },
  });

  // 4. Helper: Check if device is available/assigned
  const getDeviceStatus = (serialNumber) => {
    if (!devicesInPool || devicesInPool.length === 0) return "unavailable";

    const deviceRecords = devicesInPool.filter(
      (d) => d.device === serialNumber,
    );
    if (deviceRecords.length === 0) return "not_found";

    // Check if any record for this serial number is active/assigned
    const isAssigned = deviceRecords.some(
      (d) => d.activity || String(d.status).toLowerCase() === "lost",
    );

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
    unassignDevice: unassignDeviceMutation.mutateAsync,
    isUnassigning: unassignDeviceMutation.isPending,
    getDeviceStatus,
  };
};
