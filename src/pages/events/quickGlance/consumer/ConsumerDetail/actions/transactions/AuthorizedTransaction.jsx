import { Box, Typography } from "@mui/material";
import { Divider, Modal } from "antd";
import { useState } from "react";
import { TextFontSize30LineHeight38 } from "../../../../../../../styles/global/TextFontSize30LineHeight38";
import BlueButtonComponent from "../../../../../../../components/UX/buttons/BlueButton";
import LightBlueButtonComponent from "../../../../../../../components/UX/buttons/LigthBlueButton";
import MultipleDevices from "./auth_transaction_options/MultipleDevices";
import SingleDevice from "./auth_transaction_options/SingleDevice";
const AuthorizedTransaction = ({
  createTransactionPaid,
  setCreateTransactionPaid,
}) => {
  const [optionToRender, setOptionToRender] = useState(0);

  function closeModal() {
    setCreateTransactionPaid(false);
  }

  const handleOptionChange = (option) => {
    setOptionToRender(option);
  };

  const renderTitle = () => {
    return (
      <Typography
        textTransform={"none"}
        marginY={2}
        style={{
          ...TextFontSize30LineHeight38,
          textWrap: "balance",
        }}
      >
        New transaction with authorized deposit for devices
      </Typography>
    );
  };
  return (
    <Modal
      title={renderTitle()}
      open={createTransactionPaid}
      onOk={() => closeModal()}
      onCancel={() => closeModal()}
      maskClosable={false}
      centered
      footer={[]}
      width={1000}
      style={{
        top: "5dvh",
        zIndex:30
      }}
    >
      <div
        style={{
          minWidth: "fit-content",
          backgroundColor: "#ffffff",
          padding: "20px",
        }}
      >
        <Typography
          textTransform={"none"}
          color={"var(--gray-900, #101828)"}
          lineHeight={"26px"}
          textAlign={"left"}
          fontWeight={400}
          fontFamily={"Inter"}
          fontSize={"18px"}
          marginY={2}
        >
          Please scan device for an authorized transaction:
        </Typography>
        <Divider />
        <Box
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "5px",
          }}
        >
          {optionToRender === 0 ? (
            <BlueButtonComponent
              title="Single Device"
              func={() => handleOptionChange(0)}
              styles={{ 
                width: "100%",
                textTransform: "uppercase",
                textDecoration: "underline"
              }}
            />
          ) : (
            <LightBlueButtonComponent
              title="Single Device"
              func={() => handleOptionChange(0)}
              styles={{ width: "100%" }}
            />
          )}
          
          {optionToRender === 1 ? (
            <BlueButtonComponent
              title="Multiple Devices"
              func={() => handleOptionChange(1)}
              styles={{ 
                width: "100%",
                textTransform: "uppercase",
                textDecoration: "underline"
              }}
            />
          ) : (
            <LightBlueButtonComponent
              title="Multiple Devices"
              func={() => handleOptionChange(1)}
              styles={{ width: "100%" }}
            />
          )}
        </Box>
        <Divider />
        <Typography>
          {optionToRender === 0 ? "Single device" : "Multiple devices"}
        </Typography>
        {optionToRender === 0 ? (
          <SingleDevice setCreateTransactionPaid={setCreateTransactionPaid} />
        ) : (
          <MultipleDevices
            setCreateTransactionPaid={setCreateTransactionPaid}
          />
        )}
      </div>
    </Modal>
  );
};

export default AuthorizedTransaction;

// const { register, handleSubmit, setValue } = useForm()
// const { customer } = useSelector((state) => state.customer);
// const { event } = useSelector((state) => state.event);
// const [listOfDevices, setListOfDevices] = useState([])
// const [clientSecret, setClientSecret] = useState("");
// const dispatch = useDispatch()
// const receiversSelection = listOfDevices.length
// const [deviceSelection, setDeviceSelection] = useState(null);
// const totalRef = useRef(0)

// const deviceTrackInPoolQuery = useQuery({
//     queryKey: ['devicesInPoolListPerEvent'],
//     queryFn: () => devitrakApi.post('/receiver/receiver-pool-list', {
//         eventSelected: event.eventInfoDetail.eventName,
//         provider: event.company
//     }),
//     refetchOnMount: false,
//     staleTime: Infinity
// })
// const checkDeviceInUseInOtherCustomerInTheSameEventQuery = deviceTrackInPoolQuery?.data?.data?.receiversInventory //*device in pool
// console.log("🚀 ~ checkDeviceInUseInOtherCustomerInTheSameEventQuery:", checkDeviceInUseInOtherCustomerInTheSameEventQuery)
// function closeModal() {
//     setCreateTransactionPaid(false);
//     setDeviceSelection(null)
//     setListOfDevices([])
// }
// const option = () => {
//     const option = new Set();
//     for (let data of event.deviceSetup) {
//         if (data.consumerUses) {
//             option.add(data);
//         }
//     }
//     return Array.from(option);
// };

// const checkIfDeviceIsInUsed = () => {
//     if (checkDeviceInUseInOtherCustomerInTheSameEventQuery?.length > 0) return checkDeviceInUseInOtherCustomerInTheSameEventQuery
//     return []
// }
// checkIfDeviceIsInUsed()

// const checkDeviceAssignedInListForNewTransaction = props => {
//     const fingingDeviceInList = listOfDevices.some(element => element.serialNumber === props.serialNumber && element.group === props.group)
//     if (fingingDeviceInList) return true

//     return false
// }
// const formattingSerialNumberLeadingZero = (num, totalLength) => {
//     return String(num).padStart(totalLength, "0")
// }
// const subtractRangePerGroupToDisplayItInScreen = useCallback(() => {
//     const devicesInPool = checkIfDeviceIsInUsed()
//     const deviceSelectionInfo = JSON.parse(deviceSelection)
//     const findingRange = new Set()
//     for (let i = 0; i < devicesInPool.length; i++) {
//         if (devicesInPool[i]?.type === deviceSelectionInfo?.group) {
//             if (`${devicesInPool[i]?.activity}`.toLocaleLowerCase() === "no")
//                 findingRange.add(Number(devicesInPool[i].device))
//         }
//     }
//     const result = Array.from(findingRange)
//     const max = Math.max(...result)
//     const min = Math.min(...result)
//     if (result.length > 0) {
//         return {
//             max: formattingSerialNumberLeadingZero(max, deviceSelectionInfo.startingNumber.length),
//             min: formattingSerialNumberLeadingZero(min, deviceSelectionInfo.startingNumber.length)
//         }
//     }
//     return {
//         max: 0,
//         min: 0
//     }
// }, [deviceSelection])
// subtractRangePerGroupToDisplayItInScreen()
// const handleAddSerialNumber = async (data) => {
//     const deviceSelectionInfo = await JSON.parse(deviceSelection)
//     if (String(data.serialNumber).length !== String(deviceSelectionInfo.startingNumber).length) return alert("Selected device is not valid due to length does not match.")

//     if (
//         (Number(deviceSelectionInfo.startingNumber) <= Number(data.serialNumber)) &&
//         (Number(deviceSelectionInfo.endingNumber) >= Number(data.serialNumber))
//     ) {
//         if (checkIfDeviceIsInUsed().some(element => element.device === data.serialNumber &&
//             element.activity === "YES" &&
//             element.type === deviceSelectionInfo.group)) {
//             return alert("Device is assigned to other consumer in this event! Please try another device.")
//         }

//         if (checkDeviceAssignedInListForNewTransaction({ serialNumber: data.serialNumber, group: deviceSelectionInfo.group })) return alert("Device was scanned already! Please try another device.")

//         setValue('serialNumber', '')
//         return setListOfDevices([...listOfDevices, { ...data, ...deviceSelectionInfo }])

//     }
//     return alert(`${data.serialNumber} is out of range for device selection.`)
// }

// const handleDeleteElementInList = (props) => {
//     const filter = listOfDevices.filter(element => element.serialNumber !== props.serialNumber)
//     return setListOfDevices(filter)
// }

// const generatePaymentIntent = async (data) => {
//     totalRef.current = data.amount;
//     const response = await devitrakApi.post(
//         "/stripe/create-payment-intent-customized",
//         {
//             customerEmail: customer?.email,
//             total: data.amount,
//         }
//     );
//     if (response) {
//         setClientSecret(response.data.paymentIntentCustomized.client_secret);
//         dispatch(onAddDevicesSelection(listOfDevices.length));
//         dispatch(
//             onAddDevicesSelectionPaidTransactions(listOfDevices)
//         );
//     }
// };

// const renderTitle = () => {
//     return (
//         <Typography
//             textTransform={"none"}
//             marginY={2}
//             style={{
//                 ...TextFontSize30LineHeight38,
//                 textWrap: "balance",
//             }}
//         >
//             New transaction with authorized deposit for devices
//         </Typography>
//     );
// };
// return (
//     <Modal
//         title={renderTitle()}
//         open={createTransactionPaid}
//         onOk={() => closeModal()}
//         onCancel={() => closeModal()}
//         maskClosable={false}
//         centered
//         footer={[]}
//         width={1000}
//     >
//         <div
//             style={{
//                 minWidth: "fit-content",
//                 backgroundColor: "#ffffff",
//                 padding: "20px",
//             }}
//         >
//             <Typography
//                 textTransform={"none"}
//                 color={"var(--gray-900, #101828)"}
//                 lineHeight={"26px"}
//                 textAlign={"left"}
//                 fontWeight={400}
//                 fontFamily={"Inter"}
//                 fontSize={"18px"}
//                 marginY={2}
//             >
//                 Please scan device for free transaction:
//             </Typography>
//             <form
//                 style={{ margin: " 0.5rem auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", alignSelf: "stretch", width: "100%" }}
//                 onSubmit={handleSubmit(generatePaymentIntent)}
//             >
//                 <Select
//                     showSearch
//                     style={{ ...AntSelectorStyle, width: '50%' }}
//                     placeholder="Search to Select"
//                     optionFilterProp="children"
//                     filterOption={(input, option) =>
//                         (option?.label ?? "").includes(input)
//                     }
//                     filterSort={(optionA, optionB) =>
//                         (optionA?.label ?? "")
//                             .toLowerCase()
//                             .localeCompare((optionB?.label ?? "").toLowerCase())
//                     }
//                     value={deviceSelection}
//                     onChange={(value) => {
//                         setDeviceSelection(value);
//                     }}
//                     options={option()?.map((item) => {
//                         return {
//                             label: item.group,
//                             value: JSON.stringify(item),
//                         };
//                     })}
//                 />
//                 <OutlinedInput style={{ ...OutlinedInputStyle, width: "30%" }} type="text" placeholder="Amount to authorize." {...register('amount', { required: true })} />
//                 <Tooltip title="Please submit CC info after assign all devices.">
//                     <Button
//                         disabled={receiversSelection < 1}
//                         style={BlueButton}
//                         type="submit"
//                     >
//                         <Typography
//                             textTransform={"none"}
//                             style={BlueButtonText}
//                         >
//                             Credit Card Info
//                         </Typography>
//                     </Button>
//                 </Tooltip>

//             </form>
//             <div style={{
//                 width: '50%',
//             }}>
//                 <Typography
//                     textTransform={"none"}
//                     color={"var(--gray-900, #101828)"}
//                     lineHeight={"26px"}
//                     textAlign={"left"}
//                     fontWeight={400}
//                     fontFamily={"Inter"}
//                     fontSize={"18px"}
//                     marginY={2}
//                 >
//                     Range of serial number for selected item: <br />{subtractRangePerGroupToDisplayItInScreen().min} - {subtractRangePerGroupToDisplayItInScreen().max}
//                 </Typography>
//             </div>
//             <form
//                 style={{ margin: " 0.5rem auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", alignSelf: "stretch", width: "100%" }}
//                 onSubmit={handleSubmit(handleAddSerialNumber)}
//             >
//                 <OutlinedInput disabled={deviceSelection === null} {...register("serialNumber")} autoFocus={true} style={{ ...OutlinedInputStyle, width: "50%" }} placeholder="Scan serial number here." />
//                 <Button
//                     style={BlueButton}
//                     type="submit"
//                 >
//                     <Typography
//                         textTransform={"none"}
//                         style={BlueButtonText}
//                     >
//                         Add serial number
//                     </Typography>
//                 </Button>
//             </form>
//             <div style={{ margin: '1rem 0 0 0' }}>
//                 <Card style={CardStyle} title="Scanned device">
//                     <Space size={[8, 16]} wrap>
//                         {listOfDevices.length > 0 && Array.from(listOfDevices).map(item => (
//                             <Chip onDelete={() => handleDeleteElementInList(item)} key={`${item.serialNumber}`} label={`${item.serialNumber} - ${item.group}`} style={{ margin: '0px 2px 0px 0px' }} />
//                         ))}
//                     </Space>
//                 </Card>
//             </div>
//         </div>
//         {clientSecret !== "" && (
//             <StripeCheckoutElement
//                 clientSecret={clientSecret}
//                 total={totalRef.current}
//             />
//         )}
//     </Modal>
// );
// };
