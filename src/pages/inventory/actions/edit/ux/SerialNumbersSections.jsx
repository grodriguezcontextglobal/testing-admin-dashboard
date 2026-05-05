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
import { uniqueId } from "lodash";

const options = [{ value: "Serial number", label: "Serial number" }];

const SerialNumberAndMoreInfoComponentForm = ({
  style,
  scannedSerialNumbers,
  setScannedSerialNumbers,
  moreInfo,
  setMoreInfo,
  generalInfoForSelection,
  updateAll,
}) => {
  console.log(generalInfoForSelection);
  const { user } = useBulkActionLogic();
  const [mainDeviceFound, setMainDeviceFound] = useState(null);
  const [searchDevice, setSearchDevice] = useState("");
  const [identifiers, setIdentifiers] = useState([]);
  const [devices, setDevices] = useState([]);

  const checkAndRetrieveExistingInformationItem = async () => {
    if (!searchDevice) return alert("Please enter a serial number to search.");
    const bodyTempl = {
      company_id: user.sqlInfo.company_id,
      serial_number: searchDevice,
      category_name: generalInfoForSelection.category_name,
      item_group: generalInfoForSelection.item_group,
      brand: generalInfoForSelection.brand,
    };
    const respo = await devitrakApi.post(
      "/db_item/consulting-item",
      bodyTempl
    );
    if (respo?.data?.ok && respo?.data?.items?.length > 0) {
      const item = respo.data.items[0];
      setMainDeviceFound(item);
      const fetchedIdentifiers = item.extra_serial_number.map((item) => ({
        id: uniqueId("identifier-"),
        type: item.keyObject,
        value: item.valueObject,
      }));
      setIdentifiers(fetchedIdentifiers);
    } else {
      setMainDeviceFound(null);
      setIdentifiers([]);
      alert(
        "No item found with that serial number in this category and group information. Please check the category and group and try again."
      );
    }
  };

  const handleIdentifierChange = (id, field, newValue) => {
    setIdentifiers(
      identifiers.map((identifier) =>
        identifier.id === id
          ? { ...identifier, [field]: newValue }
          : identifier
      )
    );
  };

  const addIdentifier = () => {
    setIdentifiers((prev) => [
      ...prev,
      { id: uniqueId("identifier-"), type: "", value: "" },
    ]);
  };

  const handleAddDevice = (e) => {
    e.preventDefault();
    const isInvalid = identifiers.some(
      (identifier) => !identifier.type?.trim() || !identifier.value?.trim()
    );
    if (isInvalid) {
      return alert(
        "Please ensure all identifier types and values are filled out."
      );
    }

    const markedIndex = checkedIndex.length > 0 ? checkedIndex[0] : 0;
    const primaryKey = identifiers[markedIndex]?.value;
    if (!primaryKey?.trim()) {
      return alert(
        "The value of the first identifier is required and will be used as the main device identifier."
      );
    }

    const innerObject = identifiers.reduce((acc, { type, value }) => {
      if (type?.trim()) {
        acc.push({ keyObject: type.trim(), valueObject: value });
      }
      return acc;
    }, []);
    innerObject.push({ keyObject: "item_id", valueObject: mainDeviceFound?.item_id });

    const serialNumber = {
      [primaryKey]: innerObject,
    };
    const newMoreInfo = [...moreInfo, { [primaryKey]: innerObject }];

    setDevices([...devices, { id: Date.now(), data: serialNumber }]);
    setMoreInfo(newMoreInfo);
    setScannedSerialNumbers([...scannedSerialNumbers, primaryKey]);

    setSearchDevice("");
    setIdentifiers([]);
    setMainDeviceFound(null);
    setCheckedIndex([]);
  };

  const removeField = (id) => {
    if (identifiers.length === 1) return;
    setIdentifiers(identifiers.filter((item) => item.id !== id));
  };

  const handleRemoveDevice = (deviceId) => {
    const deviceToRemove = devices.find((d) => d.id === deviceId);
    if (!deviceToRemove) return;

    const primaryKey = Object.keys(deviceToRemove.data)[0];
    const newDevices = devices.filter((d) => d.id !== deviceId);
    setDevices(newDevices);

    // eslint-disable-next-line no-prototype-builtins
    const newMoreInfo = moreInfo.filter((info) => !info.hasOwnProperty(primaryKey));
    setMoreInfo(newMoreInfo);
    setScannedSerialNumbers(
      scannedSerialNumbers.filter((serial) => serial !== primaryKey)
    );
  };

  const [checkedIndex, setCheckedIndex] = useState([]);
  const checkedPriorityKey = (index) => {
    setCheckedIndex((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [index]
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      checkAndRetrieveExistingInformationItem();
    }
  };

  return (
    <Grid container spacing={1}>
      <div style={{ margin: "1rem 0", gap: 0 }} className="form">
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

        <Grid container spacing={1} alignItems="center">
          <Grid item xs={10}>
            <Input
              placeholder="Enter serial number to search and retrieve item information"
              value={searchDevice}
              onChange={(e) => setSearchDevice(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={updateAll}
            />
          </Grid>
          <Grid item xs={2}>
            <BlueButtonComponent
              title="Search"
              func={checkAndRetrieveExistingInformationItem}
              disabled={updateAll}
            />
          </Grid>
        </Grid>

        {mainDeviceFound && (
          <div style={{ width: "100%", marginTop: "1rem" }}>
            <Grid container>
              <Grid margin={0} item xs={12} sm={3} md={1} lg={1}>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ fontWeight: "600" }}
                >
                  Primary key *
                </Typography>
              </Grid>
              <Grid margin={0} item xs={12} sm={4} md={4} lg={4}>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{ fontWeight: "600" }}
                >
                  Identifier *
                </Typography>
              </Grid>
              <Grid margin={0} item xs={12} sm={4} md={4} lg={4}>
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
                sx={{ margin: "0.5rem 0", alignItems: "center" }}
              >
                <Grid padding={0} margin={0} item xs={12} sm={3} md={1} lg={1}>
                  <Checkbox
                    checked={checkedIndex.includes(index)}
                    onChange={() => checkedPriorityKey(index)}
                  />
                </Grid>
                <Grid margin={0} item xs={12} sm={4} md={4} lg={4}>
                  <AutoComplete
                    style={{ ...style, width: "95%" }}
                    options={options}
                    value={identifier.type}
                    onChange={(newValue) =>
                      handleIdentifierChange(identifier.id, "type", newValue)
                    }
                    placeholder="Select type"
                  />
                </Grid>
                <Grid item xs={12} sm={4} md={4} lg={4} display={"flex"} gap={0.5}>
                  <Input
                    placeholder="e.g. 3241684981556474651"
                    value={identifier.value}
                    onChange={(e) =>
                      handleIdentifierChange(
                        identifier.id,
                        "value",
                        e.target.value
                      )
                    }
                    style={{ width: "100%" }}
                    allowClear
                  />
                </Grid>
                <Grid padding={0} margin={0} item xs={12} sm={3} md={1} lg={1}>

                  <DangerButtonComponent
                    title={"Remove"}
                    func={() => removeField(identifier.id)}
                  />
                </Grid>
              </Grid>
            ))}
            <Grid container spacing={1} justifyContent="flex-end">
              <Grid item>
                <BlueButtonComponent
                  title={<WhiteCirclePlusIcon />}
                  func={addIdentifier}
                />
              </Grid>
            </Grid>
          </div>
        )}

        <div style={{ marginTop: '1rem', width: '100%' }}>
          <GrayButtonComponent
            func={handleAddDevice}
            title="Add this device"
            disabled={!mainDeviceFound}
          />
        </div>
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