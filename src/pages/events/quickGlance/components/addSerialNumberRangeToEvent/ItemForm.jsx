import Sequential from "./addingItemsMethod/Sequential";
// import ImportingXlsx from "./addingItemsMethod/ImportingXlsx";

// const CustomizedSwitch = ({ state, handler }) => {
//   const tabOptions = [
//     {
//       label: "Scan serial number",
//       route: true,
//       permission: [0, 1, 2, 3, 4],
//     },
//     {
//       label: "Import file (.xlsx)",
//       route: false,
//       permission: [0, 1, 2, 3, 4],
//     },
//   ];
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

//   return (
//     <nav
//       style={{
//         display: "flex",
//         gap: isMobile ? "8px" : "16px",
//         minWidth: "min-content",
//         padding: isMobile ? "8px 0" : "0",
//       }}
//     >
//       {tabOptions.map((option) => {
//         return (
//           <NavLink
//             key={option.label}
//             style={({ state }) => ({
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               padding: isMobile ? "4px 8px" : "1px 4px 11px",
//               gap: "8px",
//               borderBottom:
//                 state === option.route
//                   ? "1px solid #004EEB"
//                   : "rgba(0, 0, 0, 0.88)",
//               whiteSpace: "nowrap",
//             })}
//           >
//             <button
//               onClick={() => handler(!state)}
//               style={{
//                 width: "100%",
//                 outline: "none",
//                 border: "none",
//                 backgroundColor: "transparent",
//               }}
//             >
//               <Typography
//                 sx={{
//                   color: () => (state === option.route ? "#004EEB" : "#667085"),
//                   fontFamily: "Inter",
//                   fontSize: { xs: "12px", sm: "14px" },
//                   fontWeight: 600,
//                   lineHeight: "20px",
//                 }}
//               >
//                 {option.label}
//               </Typography>
//             </button>
//           </NavLink>
//         );
//       })}
//     </nav>
//   );
// };

const ItemForm = ({
  addingDeviceFromLocations,
  AntSelectorStyle,
  blockingButton,
  BorderedCloseIcon,
  CheckIcon,
  checkIfSerialNumberExists,
  Chip,
  closeModal,
  deviceTitle,
  handleDevicesInEvent,
  handleSubmit,
  InputAdornment,
  InputLabel,
  itemQuery,
  listOfLocations,
  onChange,
  OutlinedInput,
  OutlinedInputStyle,
  QuestionIcon,
  RectangleBluePlusIcon,
  register,
  removeItem,
  Select,
  selectOptions,
  Space,
  Subtitle,
  Tooltip,
  Typography,
  valueItemSelected,
  watch,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <Sequential
          addingDeviceFromLocations={addingDeviceFromLocations}
          AntSelectorStyle={AntSelectorStyle}
          blockingButton={blockingButton}
          BorderedCloseIcon={BorderedCloseIcon}
          CheckIcon={CheckIcon}
          checkIfSerialNumberExists={checkIfSerialNumberExists}
          Chip={Chip}
          closeModal={closeModal}
          deviceTitle={deviceTitle}
          handleDevicesInEvent={handleDevicesInEvent}
          handleSubmit={handleSubmit}
          InputAdornment={InputAdornment}
          InputLabel={InputLabel}
          itemQuery={itemQuery}
          listOfLocations={listOfLocations}
          onChange={onChange}
          OutlinedInput={OutlinedInput}
          OutlinedInputStyle={OutlinedInputStyle}
          QuestionIcon={QuestionIcon}
          RectangleBluePlusIcon={RectangleBluePlusIcon}
          register={register}
          removeItem={removeItem}
          Select={Select}
          selectOptions={selectOptions}
          Space={Space}
          Subtitle={Subtitle}
          Tooltip={Tooltip}
          Typography={Typography}
          valueItemSelected={valueItemSelected}
          watch={watch}
        />
    </div>
  );
};

export default ItemForm;
