import { Button } from "antd";
import { DangerButton } from "../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../styles/global/DangerButtonText";
import { GrayButton } from "../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../styles/global/GrayButtonText";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../../api/devitrakApi";
import { useEffect, useState } from "react";
import { groupBy } from "lodash";

const ExpandedLostButton = ({
  record,
  handleFoundSingleDevice,
  handleLostSingleDevice,
  Lost,
  refetchingQueries,
}) => {
  const [cashReportList, setCashReportList] = useState([]);
  const propsUpdateSingleDevice = {
    ...record,
    new_status: true,
  };
  const checkChargedLostFee = useQuery({
    queryKey: [
      "chargedLostFee",
      `${record.key}-${record.serial_number}-${record.type}`,
    ],
    queryFn: () =>
      devitrakApi.post(`/cash-report/cash-reports`, {
        event: record.entireData.event_id,
        company: record.entireData.company,
        "deviceLost.label": record.serial_number,
        "deviceLost.deviceType": record.type,
        attendee: record.entireData.user,
      }),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    const groupingData = groupBy(
      checkChargedLostFee?.data?.data?.report,
      "deviceLost[0].label"
    );
    setCashReportList(groupingData);
    return () => {
      controller.abort();
    };
  }, [checkChargedLostFee.data]);

  const handleRefund = async (record) => {
    try {
      for (let data of cashReportList[record.serial_number]) {
        console.log(data)
        if(data.paymentIntent_charge_transaction.length > 15 && !data.paymentIntent_charge_transaction.includes("cash")){
        await devitrakApi.post(`/stripe/refund`, {
          paymentIntent: data.paymentIntent_charge_transaction,
        });
      }
      await devitrakApi.post(`/cash-report/remove-cash-report/${data.id}`);
    }
      return refetchingQueries();
    } catch (error) {
      return null;
    }
  };

  return (
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px" }}>
        <Button
          disabled={cashReportList[record.serial_number]?.length > 0}
          onClick={() => handleLostSingleDevice(record)}
          style={{
            ...DangerButton,
            alignItems: "center",
          }}
        >
          <img src={Lost} alt="Lost" />
          <p
            style={{
              ...DangerButtonText,
              alignSelf: "center",
            }}
          >
            {cashReportList[record.serial_number]?.length > 0
              ? "Charged"
              : "Charge customer"}
          </p>
        </Button>
        <Button
          onClick={() =>
            cashReportList[record.serial_number]?.length > 0
              ? handleRefund(record)
              : handleFoundSingleDevice(propsUpdateSingleDevice)
          }
          style={{
            ...GrayButton,
          }}
        >
          <p
            style={{
              ...GrayButtonText,
              color: `${
                record.status
                  ? GrayButtonText.color
                  : "var(--disabled0gray-button-text)"
              }`,
            }}
          >
            {cashReportList[record.serial_number]?.length > 0
              ? "Refund"
              : "Mark as found"}
          </p>
        </Button>
      </div>
  );
};

export default ExpandedLostButton;
