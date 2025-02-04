import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onAddTransactionInfo } from "../../../../store/slices/customerSlice";

const AuthorizedDeposit = () => {
  const { transaction } = useSelector((state) => state.customer);
  const [payment_intent] = useState(
    new URLSearchParams(window.location.search).get("payment_intent")
  );
  const [client_secret] = useState(
    new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    )
  );
  const dispatch = useDispatch();
  const transactionCountingRef = useRef(0);
  const navigate = useNavigate();
  const reference = useRef(null);
  const queryClient = useQueryClient();

  const newTransaction = async () => {
    try {
      const eventInfo =
        typeof transaction.event === "string"
          ? JSON.parse(transaction.event)
          : transaction.event;
      const deviceInventoryEventQuery = await devitrakApi.post(
        "/receiver/receiver-pool-list",
        {
          eventSelected: eventInfo.eventInfoDetail.eventName,
          company: transaction.staff.companyData.id,
          type: transaction.deviceInfo.group,
          activity: false,
        }
      );
      if (deviceInventoryEventQuery.data) {
        const listOfAvailableDevices =
          deviceInventoryEventQuery.data.receiversInventory;
        const totalDeviceAssigned = transaction.quantity;
        const transactionGenerated = payment_intent;
        reference.current = transactionGenerated;
        let deviceInfToStoreParsed =
          typeof deviceInfo === "string"
            ? JSON.parse(transaction.deviceInfo)
            : transaction.deviceInfo;
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
          clientSecret: client_secret ?? "unknown",
          device: deviceSelectedOption,
          consumerInfo: {
            ...transaction.customer.data,
            ...transaction.customer,
            id: transaction.customer.uid,
          },
          provider: eventInfo.company,
          eventSelected: eventInfo.eventInfoDetail.eventName,
          event_id: eventInfo.id,
          date: `${new Date()}`,
          company: transaction.staff.companyData.id,
        };
        const copiedDeviceData = [...listOfAvailableDevices];
        const deviceFound = copiedDeviceData.findIndex(
          (element) => element.device === transaction.serialNumber
        );
        if (Number(deviceFound) > -1) {
          const dataToPass = copiedDeviceData.slice(
            deviceFound,
            deviceFound + Number(transaction.quantity)
          );
          const createTransactionTemplate = {
            serialNumbers: JSON.stringify(dataToPass),
            deviceType: copiedDeviceData[0].type,
            status: true,
            paymentIntent: reference.current,
            company: transaction.staff.companyData.id,
            user: transaction.customer.email,
            eventSelected: eventInfo.eventInfoDetail.eventName,
            provider: transaction.staff.company,
            event_id: eventInfo.id,
            timestamp: new Date().toISOString(),
            qty: transaction.quantity,
            startingNumber: transaction.serialNumber,
          };
          const templateBulkItemUpdate = {
            device: copiedDeviceData.slice(
              deviceFound,
              deviceFound + Number(transaction.quantity)
            ),
            company: transaction.staff.companyData.id,
            activity: true,
            eventSelected: eventInfo.eventInfoDetail.eventName,
          };

          await devitrakApi.patch(
            "/receiver/update-bulk-items-in-pool",
            templateBulkItemUpdate
          );
          await devitrakApi.post(
            "/receiver/create-bulk-item-transaction-in-user",
            createTransactionTemplate
          );
          transactionCountingRef.current = 1;
        }

        await devitrakApi.post("/stripe/save-transaction", transactionProfile);
        dispatch(onAddTransactionInfo(null));

        await queryClient.refetchQueries({
          queryKey: [
            "transactionsPerCustomer",
            transaction.customer.uid ?? transaction.customer.id,
          ],
          exact: true,
        });

        return navigate(`/consumers/${transaction?.customer?.uid}`);
      }
    } catch (error) {
      return alert(error);
    }
  };

  useMemo(async () => {
    return await newTransaction();
  }, []);
};

export default AuthorizedDeposit;
