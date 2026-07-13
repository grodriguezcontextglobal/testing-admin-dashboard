import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onAddTransactionInfo } from "../../../../store/slices/customerSlice";

const LOG = (...args) => console.log("[AuthorizedDeposit]", ...args);
const ERR = (...args) => console.error("[AuthorizedDeposit]", ...args);

const AuthorizedDeposit = () => {
  const { transaction } = useSelector((state) => state.customer);
  const { event } = useSelector((state) => state.event);
  const [payment_intent] = useState(
    new URLSearchParams(window.location.search).get("payment_intent")
  );
  const [client_secret] = useState(
    new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    )
  );
  const [status, setStatus] = useState("processing");
  const dispatch = useDispatch();
  const transactionCountingRef = useRef(0);
  const navigate = useNavigate();
  const reference = useRef(null);
  const queryClient = useQueryClient();

  const handleLostFee = async () => {
    LOG("=== LOST-FEE FLOW ===");
    const amount = localStorage.getItem("total");
    LOG("amount from localStorage:", amount);

    const cashReportProfile = {
      attendee: transaction.customer.email,
      admin: transaction.staff.email,
      deviceLost: [
        {
          label: transaction.device.serialNumber,
          deviceType: transaction.device.deviceType,
        },
      ],
      amount,
      event: transaction.event.id,
      company: transaction.staff.companyData.id,
      paymentIntent_charge_transaction: payment_intent,
      typeCollection: "Credit Card",
    };
    LOG("cashReportProfile:", cashReportProfile);

    const respo = await devitrakApi.post(
      "/cash-report/create-cash-report",
      cashReportProfile
    );
    LOG("create-cash-report response:", respo?.data);

    if (respo.data) {
      const dateSplitting = new Date().toString().split(" ");
      await devitrakApi.post("/nodemailer/lost-device-fee-notification", {
        consumer: {
          name: `${transaction.customer.name} ${transaction.customer.lastName}`,
          email: transaction.customer.email,
        },
        device: {
          serialNumber: transaction.device.serialNumber,
          deviceType: transaction.device.deviceType,
        },
        amount,
        event: transaction.event.eventInfoDetail.eventName,
        company: transaction.event.company,
        date: dateSplitting.slice(0, 4),
        time: dateSplitting[4],
        transaction:
          transaction.receiversAssigned?.paymentIntent ?? payment_intent,
        link: `https://app.devitrak.net/authentication/${transaction.event.id}/${transaction.staff.companyData.id}/${transaction.customer.uid}`,
      });
      LOG("lost-device-fee-notification sent");
    }

    localStorage.removeItem("total");
    dispatch(onAddTransactionInfo(null));
    await queryClient.refetchQueries({
      queryKey: [
        "transactionsPerCustomer",
        transaction.customer?.uid ?? transaction.customer?.id,
      ],
      exact: true,
    });
    const destination = `/consumers/${transaction.customer.uid}`;
    LOG("=== LOST-FEE END: navigating to", destination, "===");
    navigate(destination);
  };

  const newTransaction = async () => {
    LOG("=== START ===");
    LOG("URL params → payment_intent:", payment_intent, "| client_secret:", client_secret ? "✓ present" : "✗ missing");
    LOG("Redux → transaction:", transaction);
    LOG("Redux → event:", event);

    try {
      // ── GUARD: transaction ────────────────────────────────────────────────
      if (!transaction) {
        ERR("EARLY EXIT: transaction is null/undefined in Redux store.");
        setStatus("no-transaction");
        return;
      }
      LOG("transaction ✓");

      // ── LOST-FEE BRANCH ───────────────────────────────────────────────────
      if (transaction.type === "lost-fee") {
        await handleLostFee();
        return;
      }

      // ── EVENT INFO ────────────────────────────────────────────────────────
      const eventInfo = event;
      LOG("eventInfo:", eventInfo);

      if (!eventInfo?.eventInfoDetail?.eventName) {
        ERR("EARLY EXIT: eventInfo.eventInfoDetail.eventName is missing.", eventInfo);
        setStatus("error");
        return;
      }
      LOG("eventInfo.eventInfoDetail.eventName:", eventInfo.eventInfoDetail.eventName);

      // ── FETCH 1: receiver-pool-list ───────────────────────────────────────
      const poolPayload = {
        eventSelected: eventInfo.eventInfoDetail.eventName,
        company: transaction.staff?.companyData?.id,
        type: transaction.deviceInfo?.group,
        activity: false,
      };
      LOG("FETCH 1 → /receiver/receiver-pool-list | payload:", poolPayload);

      const deviceInventoryEventQuery = await devitrakApi.post(
        "/receiver/receiver-pool-list",
        poolPayload
      );
      LOG("FETCH 1 response:", deviceInventoryEventQuery?.data);

      if (!deviceInventoryEventQuery.data) {
        ERR("EARLY EXIT: receiver-pool-list returned no data.");
        setStatus("error");
        return;
      }

      // ── DEVICE LIST ───────────────────────────────────────────────────────
      const listOfAvailableDevices = deviceInventoryEventQuery.data.receiversInventory;
      LOG("listOfAvailableDevices (length):", listOfAvailableDevices?.length, listOfAvailableDevices);

      const totalDeviceAssigned = transaction.quantity;
      const transactionGenerated = payment_intent;
      reference.current = transactionGenerated;

      let deviceInfToStoreParsed =
        typeof transaction.deviceInfo === "string"
          ? JSON.parse(transaction.deviceInfo)
          : transaction.deviceInfo;
      LOG("deviceInfToStoreParsed:", deviceInfToStoreParsed);

      let deviceSelectedOption = {
        deviceType: deviceInfToStoreParsed.group,
        deviceValue:
          deviceInfToStoreParsed.value?.length > 0
            ? Number(deviceInfToStoreParsed.value)
            : 0,
        deviceNeeded: totalDeviceAssigned,
      };
      LOG("deviceSelectedOption:", deviceSelectedOption);

      // ── TRANSACTION PROFILE ───────────────────────────────────────────────
      const transactionProfile = {
        paymentIntent: reference.current,
        clientSecret: client_secret ?? "unknown",
        device: deviceSelectedOption,
        consumerInfo: {
          ...transaction.customer?.data,
          ...transaction.customer,
          id: transaction.customer?.uid,
        },
        provider: eventInfo.company,
        eventSelected: eventInfo.eventInfoDetail.eventName,
        event_id: eventInfo.id,
        date: `${new Date()}`,
        company: transaction.staff?.companyData?.id,
      };
      LOG("transactionProfile:", transactionProfile);

      // ── DEVICE SEARCH IN POOL ─────────────────────────────────────────────
      const copiedDeviceData = [...(listOfAvailableDevices ?? [])];
      const deviceFound = copiedDeviceData.findIndex(
        (element) => element.device === transaction.serialNumber
      );
      LOG("transaction.serialNumber:", transaction.serialNumber);
      LOG("deviceFound index:", deviceFound, "(>-1 means device matched in pool)");

      if (Number(deviceFound) > -1) {
        const dataToPass = copiedDeviceData.slice(
          deviceFound,
          deviceFound + Number(transaction.quantity)
        );
        LOG("dataToPass (devices to assign):", dataToPass);

        const createTransactionTemplate = {
          serialNumbers: JSON.stringify(dataToPass),
          deviceType: copiedDeviceData[0].type,
          status: true,
          paymentIntent: reference.current,
          company: transaction.staff?.companyData?.id,
          user: transaction.customer?.email,
          eventSelected: eventInfo.eventInfoDetail.eventName,
          provider: transaction.staff?.company,
          event_id: eventInfo.id,
          timestamp: new Date().toISOString(),
          qty: transaction.quantity,
          startingNumber: transaction.serialNumber,
        };
        LOG("createTransactionTemplate:", createTransactionTemplate);

        const templateBulkItemUpdate = {
          device: copiedDeviceData.slice(
            deviceFound,
            deviceFound + Number(transaction.quantity)
          ),
          company: transaction.staff?.companyData?.id,
          activity: true,
          eventSelected: eventInfo.eventInfoDetail.eventName,
        };
        LOG("templateBulkItemUpdate:", templateBulkItemUpdate);

        // ── FETCH 2: update-bulk-items-in-pool ───────────────────────────────
        LOG("FETCH 2 → PATCH /receiver/update-bulk-items-in-pool");
        const bulkUpdateResp = await devitrakApi.patch(
          "/receiver/update-bulk-items-in-pool",
          templateBulkItemUpdate
        );
        LOG("FETCH 2 response:", bulkUpdateResp?.data);

        // ── FETCH 3: create-bulk-item-transaction-in-user ────────────────────
        LOG("FETCH 3 → POST /receiver/create-bulk-item-transaction-in-user");
        const createTransactionResp = await devitrakApi.post(
          "/receiver/create-bulk-item-transaction-in-user",
          createTransactionTemplate
        );
        LOG("FETCH 3 response:", createTransactionResp?.data);

        transactionCountingRef.current = 1;
        LOG("transactionCountingRef set to 1");
      } else {
        LOG("device NOT found in pool — skipping bulk update/create steps");
      }

      // ── FETCH 4: save-transaction ─────────────────────────────────────────
      LOG("FETCH 4 → POST /stripe/save-transaction");
      const saveTransactionResp = await devitrakApi.post(
        "/stripe/save-transaction",
        transactionProfile
      );
      LOG("FETCH 4 response:", saveTransactionResp?.data);

      // ── CLEAR REDUX + REFETCH ─────────────────────────────────────────────
      LOG("Dispatching onAddTransactionInfo(null) to clear transaction from Redux");
      dispatch(onAddTransactionInfo(null));

      LOG("Refetching transactionsPerCustomer query");
      await queryClient.refetchQueries({
        queryKey: [
          "transactionsPerCustomer",
          transaction.customer?.uid ?? transaction.customer?.id,
        ],
        exact: true,
      });

      // ── NAVIGATE ──────────────────────────────────────────────────────────
      const destination = `/consumers/${transaction?.customer?.uid}`;
      LOG("Navigating to:", destination);
      LOG("=== END: success ===");
      return navigate(destination);
    } catch (error) {
      ERR("=== CAUGHT ERROR ===", error);
      setStatus("error");
    }
  };

  useEffect(() => {
    newTransaction();
  }, []);

  // ── UI ────────────────────────────────────────────────────────────────────
  if (status === "no-transaction") {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", gap: "8px", fontFamily: "Inter" }}>
        <p style={{ fontSize: "16px", color: "#B42318", margin: 0 }}>
          No se encontró información de la transacción en sesión.
        </p>
        <p style={{ fontSize: "13px", color: "#667085", margin: 0 }}>
          Revisa la consola del navegador para más detalles.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", gap: "8px", fontFamily: "Inter" }}>
        <p style={{ fontSize: "16px", color: "#B42318", margin: 0 }}>
          Error procesando la transacción.
        </p>
        <p style={{ fontSize: "13px", color: "#667085", margin: 0 }}>
          payment_intent: {payment_intent} — Revisa la consola para detalles.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", gap: "12px", fontFamily: "Inter" }}>
      <p style={{ fontSize: "16px", color: "#475467", margin: 0 }}>
        Procesando transacción...
      </p>
      <p style={{ fontSize: "13px", color: "#98A2B3", margin: 0 }}>
        {payment_intent}
      </p>
    </div>
  );
};

export default AuthorizedDeposit;
