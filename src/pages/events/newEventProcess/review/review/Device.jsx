import { Grid, InputLabel, Typography } from "@mui/material";
import { useSelector } from "react-redux";

const Device = () => {
  const { deviceSetup } = useSelector((state) => state.event);
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
        <Typography
          textTransform={"none"}
          textAlign={"left"}
          fontFamily={"Inter"}
          fontSize={"20px"}
          fontStyle={"normal"}
          fontWeight={600}
          lineHeight={"30px"}
          color={"var(--gray-600, #475467)"}
          alignSelf={"stretch"}
        >
          Devices added &nbsp;
        </Typography>
      </InputLabel>
      {deviceSetup.map((item) => {
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
      })}
    </Grid>
  );
};

export default Device;
