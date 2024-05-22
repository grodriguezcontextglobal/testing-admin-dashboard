import { Grid, InputLabel } from "@mui/material";
import { Table } from "antd";
import { useSelector } from "react-redux";
import TextFontsize18LineHeight28 from "../../../../../styles/global/TextFontSize18LineHeight28";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";

const Device = () => {
  const { deviceSetup } = useSelector((state) => state.event);

  const renderingStyle = {
    ...TextFontsize18LineHeight28, fontSize: "16px", lineHeight: "24px", color: "var(--gray-600, #475467)",
    alignSelf: "stretch", fontWeight: 400
  }
  const columns = [
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: text => <div style={renderingStyle}>{text}</div>,
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      render: text => <div style={renderingStyle}>{text}</div>,
    },
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category_name',
      render: text => <div style={renderingStyle}>{text}</div>,
    },
    {
      title: 'Group',
      dataIndex: 'item_group',
      key: 'item_group',
      render: text => <div style={renderingStyle}>{text}</div>,
    },
  ];

  const totalDevicesAssigned = () => {
    const initial = 0
    return deviceSetup.reduce((accu, { quantity }) => accu + quantity, initial)
  }
  return (
    <Grid
      display={"flex"}
      justifyContent={"flex-start"}
      alignItems={"center"}
      container
    >
      <InputLabel style={{
        marginBottom: "0.2rem", width: "100%", display: "flex",
        alignItems: "center", justifyContent: "flex-start"
      }}>
        <p
          style={{
            ...TextFontSize20LineHeight30,
            fontWeight: 600,
            color: "var(--gray-600, #475467)",
            alignSelf: "stretch",
          }}
        >
          Devices added&nbsp;<span style={{
            ...TextFontsize18LineHeight28,
            fontWeight: 400,
            color: "var(--gray-600, #475467)",
            alignSelf: "stretch",
          }}>({totalDevicesAssigned()} {totalDevicesAssigned() > 1 ? "units" : "unit"})</span>
        </p>
      </InputLabel>

      <Table dataSource={deviceSetup} style={{ width: "100%", border: "none", backgroundColor: "transparent" }} columns={columns} pagination={false} bordered={false} showHeader={false} />
    </Grid>
  );
};

export default Device;

  // const { user } = useSelector((state) => state.admin);
  // const [saveInventoryState, setSaveInventoryState] = useState(false)
  // const [loadingState, setLoadingState] = useState(false)
  // const saveInventoryStoredAsDefault = async () => {
  //   setLoadingState(true)
  //   try {
  //     const inventoryTemplateToStore = {
  //       batch: nanoid(6),
  //       company: user.company,
  //       event: eventInfoDetail.eventName,
  //       saveDefaultFormat: true,
  //       items: deviceSetup
  //     }
  //     const respo = await devitrakApi.post(
  //       `/inventory/create-inventory`, inventoryTemplateToStore
  //     );
  //     if (respo.data.ok) {
  //       setSaveInventoryState(true)
  //       setLoadingState(false)
  //     }
  //   } catch (error) {
  //     console.log(
  //       "🚀 ~ file: ButtonSections.jsx:67 ~ saveInventoryStoredAsDefault ~ error:",
  //       error
  //     );
  //     setLoadingState(false)
  //   }
  // };

{/* {deviceSetup.map((item) => {
        return (
          <InputLabel
            key={item._id}
            style={{ marginBottom: "0.2rem", width: "100%" }}
          >
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              fontFamily={"Inter"}
              fontSize={"16px"}
              fontStyle={"normal"}
              fontWeight={400}
              lineHeight={"24px"}
              color={"var(--gray-600, #475467)"}
              margin={"0.3rem 0"}
            >
              {item?.category_name} {item?.item_group} {item?.quantity} {item?.quantity > 1 ? "units" : "unit"}
            </Typography>
          </InputLabel>
        );
      })} */}
