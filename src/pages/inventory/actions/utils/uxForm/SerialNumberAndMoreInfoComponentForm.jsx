import { Grid, Typography } from "@mui/material";
import { AutoComplete, Divider } from "antd";
import { useState } from "react";
import { WhiteCirclePlusIcon } from "../../../../../components/icons/WhiteCirclePlusIcon";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import Input from "../../../../../components/UX/inputs/Input";
import RenderingItemsAddedForStore from "./RenderingItemsAddedForStore";

const options = [{ value: "Serial", label: "Serial" }];

const SerialNumberAndMoreInfoComponentForm = ({
  style,
  scannedSerialNumbers,
  setScannedSerialNumbers,
  moreInfo,
  setMoreInfo,
}) => {
  // State for the dynamic input fields for a single device
  const [nextId, setNextId] = useState(2);
  const [identifiers, setIdentifiers] = useState([
    { id: 1, type: "Serial", value: "" },
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

  const addIdentifier = () => {
    setIdentifiers([...identifiers, { id: nextId, type: "Serial", value: "" }]);
    setNextId(nextId + 1);
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

    // The value of the first identifier will be the key. It must exist.
    const primaryKey = identifiers[0].value;
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

    const serialNumber = {
      [primaryKey]: innerObject,
    };

    // Integration
    setDevices([...devices, { id: Date.now(), data: serialNumber }]);
    setMoreInfo([...moreInfo, { [primaryKey]: innerObject }]);
    const newScannedSerialNumbers = [...scannedSerialNumbers, primaryKey];
    setScannedSerialNumbers(newScannedSerialNumbers);
    // Reset the form for the next entry
    setNextId(2);
    setIdentifiers([{ id: 1, type: "Serial", value: "" }]);
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
          You can enter all the details manually or use a scanner to enter the
          serial numbers.
        </Typography>

        <Grid container >
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

        {identifiers.map((identifier) => (
          <Grid
            container
            spacing={1}
            key={identifier.id}
            sx={{ margin: 0, alignItems: "center" }}
          >
            <Grid margin={0} item xs={12} sm={3} md={2.5} lg={1.5}>
              <AutoComplete
                style={{ ...style, margin: 0 }}
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
