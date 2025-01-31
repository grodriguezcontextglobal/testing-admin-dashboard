import { nanoid } from "@reduxjs/toolkit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { devitrakApi } from "../../../../api/devitrakApi";
const CashDeposit = ({
  customer,
  quantity,
  staff,
  event,
  deviceInfo,
  serialNumber,
  loadingState,
  triggering,
  closeModal,
  amount,
}) => {
  const deviceInventoryEventQuery = useQuery({
    queryKey: ["devicesInPoolListPerEvent"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        company: staff.companyData.id,
        type: deviceInfo.group,
        activity: false,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    deviceInventoryEventQuery.refetch();
    triggering(0);
    loadingState(false);
  }, []);

  const reference = useRef(null);
  const queryClient = useQueryClient();

  const newTransaction = async () => {
    try {
      const listOfAvailableDevices =
        deviceInventoryEventQuery?.data?.data?.receiversInventory ?? [];
      const checkAvailableDevices = listOfAvailableDevices.filter(
        (item) => item.device === serialNumber
      );
      if (checkAvailableDevices.length === 0) {
        alert(`${serialNumber} - No device available in pool`);
        return;
      }
      const totalDeviceAssigned = quantity;
      const id = nanoid(12);
      const max = 918273645;
      const transactionGenerated =
        `pi_cash_amount:$${amount}_received_by:**${staff.email}**&` + id;
      reference.current = transactionGenerated;
      const stripeResponse = await devitrakApi.post(
        "/stripe/stripe-transaction-no-regular-user",
        {
          paymentIntent: transactionGenerated,
          clientSecret:
            totalDeviceAssigned + customer.uid ??
            customer.id + Math.floor(Math.random() * max),
          device: totalDeviceAssigned,
          user: customer.uid,
          eventSelected: event.eventInfoDetail.eventName,
          provider: staff.company,
          company: staff.companyData.id,
        }
      );
      if (stripeResponse.data) {
        let deviceInfToStoreParsed =
          typeof deviceInfo === "string" ? JSON.parse(deviceInfo) : deviceInfo;
        let deviceSelectedOption = {
          deviceType: deviceInfToStoreParsed.group,
          deviceValue:
            deviceInfToStoreParsed.value.length > 0
              ? deviceInfToStoreParsed.value
              : "0",
          deviceNeeded: totalDeviceAssigned,
        };
        const transactionProfile = {
          paymentIntent: reference.current,
          clientSecret:
            stripeResponse.data.stripeTransaction.clientSecret ?? "unknown",
          device: deviceSelectedOption,
          consumerInfo: { ...customer.data, ...customer, id: customer.uid },
          provider: event.company,
          eventSelected: event.eventInfoDetail.eventName,
          event_id: event.id,
          date: `${new Date()}`,
          company: staff.companyData.id,
        };
        const copiedDeviceData = [...listOfAvailableDevices];
        const deviceFound = copiedDeviceData.findIndex(
          (element) => element.device === serialNumber
        );
        if (Number(deviceFound) > -1) {
          const dataToPass = copiedDeviceData.slice(
            deviceFound,
            deviceFound + Number(quantity)
          );
          const createTransactionTemplate = {
            serialNumbers: JSON.stringify(dataToPass),
            deviceType: copiedDeviceData[0].type,
            status: true,
            paymentIntent: reference.current,
            company: staff.companyData.id,
            user: customer.email,
            eventSelected: event.eventInfoDetail.eventName,
            provider: staff.company,
            event_id: event.id,
            timestamp: new Date().toISOString(),
            qty: quantity,
            startingNumber: serialNumber,
          };
          const templateBulkItemUpdate = {
            device: copiedDeviceData.slice(
              deviceFound,
              deviceFound + Number(quantity)
            ),
            company: staff.companyData.id,
            activity: true,
            eventSelected: event.eventInfoDetail.eventName,
          };
          await devitrakApi.patch(
            "/receiver/update-bulk-items-in-pool",
            templateBulkItemUpdate
          );
          await devitrakApi.post(
            "/receiver/create-bulk-item-transaction-in-user",
            createTransactionTemplate
          );
          // await assignItemEmailNotification({
          //   paymentIntent: reference.current,
          //   device: [
          //     ...templateBulkItemUpdate.device.map((item) => ({
          //       deviceType: item.type,
          //       serialNumber: item.device,
          //       paymentIntent: reference.current,
          //     })),
          //   ],
          //   event_id: event.id,
          //   eventSelected: event.eventInfoDetail.eventName,
          //   event: event.eventInfoDetail.eventName,
          // });
        }
        await devitrakApi.post("/stripe/save-transaction", transactionProfile);

        await queryClient.refetchQueries({
          queryKey: ["transactionListQuery"],
          exact: true,
        });

        await queryClient.refetchQueries({
          queryKey: ["transactionsList"],
          exact: true,
        });

        await queryClient.refetchQueries({
          queryKey: ["listOfNoOperatingDevices"],
          exact: true,
        });

        await queryClient.refetchQueries({
          queryKey: ["assginedDeviceList"],
          exact: true,
        });

        await queryClient.refetchQueries({
          queryKey: ["listOfDevicesAssigned"],
          exact: true,
        });

        await queryClient.refetchQueries({
          queryKey: ["transactionsPerCustomer", customer.uid ?? customer.id],
          exact: true,
        });

        loadingState(false);
        triggering(0);
        alert("Devices assigned successfully");
        return closeModal();
      }
    } catch (error) {
      return alert(error);
    }
  };
  useMemo(() => {
    return newTransaction();
  }, []);
};

export default CashDeposit;

//          `pi_cash_amount:$${data.amount}_received_by:**${user.email}**&` + id;
