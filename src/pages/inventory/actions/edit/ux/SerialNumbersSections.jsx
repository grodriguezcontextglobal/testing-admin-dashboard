import { Grid, Typography } from "@mui/material";
import { AutoComplete, Checkbox, Divider } from "antd";
import { useState } from "react";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { WhiteCirclePlusIcon } from "../../../../../components/icons/WhiteCirclePlusIcon";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import Input from "../../../../../components/UX/inputs/Input";
import useBulkActionLogic from "../../add/useBulkActionLogic";
import RenderingItemsAddedForStore from "../../utils/uxForm/RenderingItemsAddedForStore";

const options = [{ value: "Serial number", label: "Serial number" }];

const SerialNumberAndMoreInfoComponentForm = ({
  style,
  scannedSerialNumbers,
  setScannedSerialNumbers,
  moreInfo,
  setMoreInfo,
}) => {
  const { generalInfoForSelection, user } = useBulkActionLogic()
  // State for the dynamic input fields for a single device
  const [nextId, setNextId] = useState(2);
  const [identifiers, setIdentifiers] = useState([
    { id: 1, type: "Serial number", value: "" },
  ]);
  // State for the list of devices added
  const [devices, setDevices] = useState([]);

  const handleIdentifierChange = (id, field, newValue) => {
    setIdentifiers(
      identifiers.map((identifier) =>
        identifier.id === id
          ? { ...identifier, [field]: newValue }
          : identifier,
      ),
    );
  };
  const [itemInfoFound, setItemInfoFound] = useState(null)
  const checkAndRetrieveExistingInformationItem = async () => {
    const bodyTempl = {
      company_id: user.sqlInfo.company_id,
      serial_number: identifiers[0].value,
    }
    if (generalInfoForSelection) {
      bodyTempl.category_name = generalInfoForSelection.category_name
      bodyTempl.item_group = generalInfoForSelection.item_group
    }
    const respo = await devitrakApi.post("/db_item/consulting-item", bodyTempl)
    if (respo?.data?.ok && respo?.data?.items?.length > 0) {
      setItemInfoFound(respo.data.items[0])
      const templ = []
      respo.data.items[0].extra_serial_number.forEach((item, index) => {
        templ.push({
          id: index, type: item.keyObject, value: item.valueObject
        })
      })
      if (templ.length > 0) {
        setNextId(templ.length + 1)
        return setIdentifiers([
          ...templ,
          { id: (templ.length + 1), type: "Serial number", value: "" }
        ])
      }
      setIdentifiers([
        ...identifiers,
        { id: (nextId + 1), type: "Serial number", value: "" }
      ])
      return setNextId(nextId + 1)
    }
  }
  const addIdentifier = () => {
    checkAndRetrieveExistingInformationItem()
    setIdentifiers([
      ...identifiers,
      { id: nextId, type: "Serial number", value: "" },
    ])
    setNextId(identifiers.length + 1)
  };

  const handleAddDevice = (e) => {
    e.preventDefault();

    // Input Validation
    const isInvalid = identifiers.some(
      (identifier) => !identifier.type?.trim() || !identifier.value?.trim(),
    );

    if (isInvalid) {
      alert("Please ensure all identifier types and values are filled out.");
      return;
    }

    const markedIndex = checkedIndex.length > 0 ? checkedIndex[0] : 0;
    // The value of the first identifier will be the key. It must exist.
    const primaryKey = identifiers[markedIndex].value;
    if (!primaryKey?.trim()) {
      alert(
        "The value of the first identifier is required and will be used as the main device identifier.",
      );
      return;
    }

    // Data Structure Transformation
    const innerObject = identifiers.reduce((acc, { type, value }) => {
      // Ensure type is a valid string to be used as a key
      if (type?.trim()) {
        acc.push({ keyObject: type.trim(), valueObject: value });
      }
      return acc;
    }, []);
    innerObject.push({ keyObject: "item_id", valueObject: itemInfoFound?.item_id })
    const serialNumber = {
      [primaryKey]: innerObject,
    };
    const newMoreInfo = [...moreInfo, { [primaryKey]: innerObject }];
    // Integration
    setDevices([...devices, { id: Date.now(), data: serialNumber }]);
    setMoreInfo(newMoreInfo);
    const newScannedSerialNumbers = [...scannedSerialNumbers, primaryKey];
    setScannedSerialNumbers(newScannedSerialNumbers);
    // Reset the form for the next entry
    setNextId(2);
    setIdentifiers([{ id: 1, type: "Serial number", value: "" }]);
    setCheckedIndex([]);
  };

  const removeField = (id) => {
    if (identifiers.length === 1) return;
    setIdentifiers(identifiers.filter((item) => item.id !== id));
  };

  const handleRemoveDevice = (deviceId) => {
    // Find the device to get its primary key before removing it
    const deviceToRemove = devices.find((d) => d.id === deviceId);
    if (!deviceToRemove) return;

    const primaryKey = Object.keys(deviceToRemove.data)[0];

    // Filter the devices list
    const newDevices = devices.filter((d) => d.id !== deviceId);
    setDevices(newDevices);

    // Filter the moreInfo list to remove the corresponding entry
    // eslint-disable-next-line no-prototype-builtins
    const newMoreInfo = moreInfo.filter(
      // eslint-disable-next-line no-prototype-builtins
      (info) => !info.hasOwnProperty(primaryKey),
    );
    setMoreInfo(newMoreInfo);
    setScannedSerialNumbers(
      scannedSerialNumbers.filter((serial) => serial !== primaryKey),
    );
  };

  const [checkedIndex, setCheckedIndex] = useState([]);
  const checkedPriorityKey = (index) => {
    if (checkedIndex.includes(index)) {
      return setCheckedIndex(checkedIndex.filter((_, i) => i !== index));
    } else {
      return setCheckedIndex([index]);
    }
  };

  return (
    <Grid container spacing={1}>
      <div
        // onSubmit={(e)=>handleAddDevice(e)}
        style={{ margin: "1rem 0", gap: 0 }}
        className="form"
      >
        <Typography
          variant="h5"
          sx={{ width: "100%", textAlign: "left", mb: 0.5, fontWeight: "bold" }}
        >
          Serial numbers and identifiers
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ width: "100%", textAlign: "left", mb: 3 }}
        >
          Users can select an identifier to designate it as the primary key for
          the submitted devices. If no identifier is explicitly selected, the
          system will automatically use the first available identifier as the
          primary key by default.
        </Typography>

        <Grid container>
          <Grid margin={0} item xs={12} sm={3} md={2.5} lg={1.5}>
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
              sx={{ fontWeight: "600" }}
            >
              Identifier *
            </Typography>
          </Grid>
          <Grid item xs={12} sm md lg display={"flex"} gap={0.5}>
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
              sx={{ fontWeight: "600" }}
            >
              Number *
            </Typography>
          </Grid>
        </Grid>
        {identifiers.map((identifier, index) => (
          <Grid
            container
            spacing={1}
            key={identifier.id}
            sx={{ margin: 0, alignItems: "center" }}
          >
            <Grid
              display={"flex"}
              margin={0}
              item
              xs={12}
              sm={3}
              md={2.5}
              lg={1.5}
            >
              <Checkbox
                checked={checkedIndex.includes(index)}
                onChange={() => checkedPriorityKey(index)}
              />
              <AutoComplete
                style={{ ...style, margin: "0 0 0 0.2rem" }}
                options={options.map((item) => ({
                  label: item.label,
                  value: item.label,
                }))}
                value={identifier.type}
                onChange={(newValue) => {
                  handleIdentifierChange(identifier.id, "type", newValue);
                }}
                placeholder="Select type"
              />
            </Grid>
            <Grid item xs={12} sm md lg display={"flex"} gap={0.5}>
              <Input
                placeholder="e.g. 3241684981556474651"
                value={identifier.value}
                onChange={(e) =>
                  handleIdentifierChange(identifier.id, "value", e.target.value)
                }
                style={{ width: "100%", margin: 0 }}
                allowClear
              />
              <BlueButtonComponent
                title={<WhiteCirclePlusIcon />}
                buttonType="button"
                func={addIdentifier}
              />
              {identifiers.length > 1 && (
                <DangerButtonComponent
                  title="Remove"
                  func={() => removeField(identifier.id)}
                />
              )}
            </Grid>
          </Grid>
        ))}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: -3, mb: 2 }}
        >
          You can use a scanner to input the number. You can also add more
          identifiers.
        </Typography>
        <GrayButtonComponent
          func={(e) => handleAddDevice(e)}
          title="Add this device"
        />
      </div>
      <Divider />
      <RenderingItemsAddedForStore
        devices={devices}
        handleRemoveDevice={handleRemoveDevice}
      />
    </Grid>
  );
};

export default SerialNumberAndMoreInfoComponentForm;
