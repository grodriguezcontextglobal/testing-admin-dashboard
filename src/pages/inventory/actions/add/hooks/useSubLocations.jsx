import { useState, useMemo } from "react";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../../components/UX/buttons/DangerButton";
import { retrieveExistingSubLocationsForCompanyInventory } from "../../utils/SubLocationRenderer";

const useSubLocations = ({ watch, setValue, itemsInInventoryQuery, openNotificationWithIcon }) => {
  const [displaySublocationFields, setDisplaySublocationFields] = useState(false);
  const [subLocationsSubmitted, setSubLocationsSubmitted] = useState([]);

  const subLocationsOptions = useMemo(
    () =>
      retrieveExistingSubLocationsForCompanyInventory(
        itemsInInventoryQuery?.data?.data?.items,
        watch("location")
      ),
    [watch("location"), itemsInInventoryQuery?.data?.data?.items]
  );

  const addingSubLocation = (props) => {
    if (String(props).trim().length < 1) {
        if(openNotificationWithIcon) openNotificationWithIcon("Sub-location cannot be empty.");
        return;
    }
    const result = [...subLocationsSubmitted, props];
    setValue("sub_location", "");
    return setSubLocationsSubmitted(result);
  };

  const renderingOptionsForSubLocations = (item) => {
    if (typeof displaySublocationFields !== "boolean")
      return {
        addSubLocation: null,
        addEndingSerialNumberSequence: null,
        removeAllSubLocations: null,
      };
    const addSublocationButton = () => {
      if (item === "Main location" && !displaySublocationFields) {
        return (
          <BlueButtonComponent
            func={() => setDisplaySublocationFields(true)}
            title="Add sub location"
            styles={{
              width: "100%",
            }}
          />
        );
      }
      return null;
    };

    const removeAllSubLocationsButton = () => {
      if (item === "Main location" && displaySublocationFields) {
        return (
          <DangerButtonComponent
            func={() => {
              setDisplaySublocationFields(false);
              setSubLocationsSubmitted([]);
            }}
            title="Remove all sub location"
            styles={{
              width: "100%",
            }}
          />
        );
      }
      return null;
    };

    return {
      addSubLocation: addSublocationButton(),
      addEndingSerialNumberSequence: null,
      removeAllSubLocations: removeAllSubLocationsButton(),
    };
  };

  return {
    displaySublocationFields,
    setDisplaySublocationFields,
    subLocationsSubmitted,
    setSubLocationsSubmitted,
    subLocationsOptions,
    addingSubLocation,
    renderingOptionsForSubLocations,
  };
};

export default useSubLocations;
