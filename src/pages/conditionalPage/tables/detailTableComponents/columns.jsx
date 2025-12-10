import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";

export const columns = () => {
  return [
    {
      title: "Serial Number",
      dataIndex: "device_serial_number",
      key: "device_serial_number",
    },
    {
      title: "Device Type",
      dataIndex: "device_item_group",
      key: "device_item_group",
    },
    {
      title: "Device Name",
      dataIndex: "device_category_name",
      key: "device_category_name",
    },
    {
      title: "Assigned Date",
      dataIndex: "assigned_date",
      key: "assigned_date",
    },
    {
      title: "Expected Return Date",
      dataIndex: "expected_return_date",
      key: "expected_return_date",
      render: (value) => {
        if (!value) return "";
        const normalized =
          typeof value === "string" && value.includes(" ")
            ? value.replace(" ", "T")
            : value;
        const d = new Date(normalized);
        return isNaN(d) ? value : d.toLocaleDateString();
      },
    },
    {
      title: "",
      key: "actions",
      render: (value) => {
        return (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 3 }}>
            <GrayButtonComponent title={"Edit"} func={()=> alert(JSON.stringify(value))}/>
            <BlueButtonComponent title={"Return"} func={()=> alert(JSON.stringify(value))} />
          </div>
        );
      },
    },
  ];
};
