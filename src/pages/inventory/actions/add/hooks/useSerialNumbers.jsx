import { useState, useCallback, useEffect } from "react";
import { message } from "antd";

const useSerialNumbers = ({ watch, setValue }) => {
  const [allSerialNumbersOptions, setAllSerialNumbersOptions] = useState([]);
  const [addSerialNumberField, setAddSerialNumberField] = useState(false);
  const [rangeFormat, setRangeFormat] = useState(false);
  const [scannedSerialNumbers, setScannedSerialNumbers] = useState([]);
  const [openScanningModal, setOpenScanningModal] = useState(false);
  const [openScannedItemView, setOpenScannedItemView] = useState(false);
  const [labeling, setLabeling] = useState("Scanning all serial numbers here");

  const qtyDiff = useCallback(() => {
    if (watch("format_range_serial_number") === "Custom format")
      return setValue("quantity", scannedSerialNumbers.length);
    if (watch("format_range_serial_number") === "Sequential number")
      return setValue(
        "quantity",
        Number(watch("max_serial_number")) -
          Number(watch("min_serial_number")) +
          1
      );
    return 0; // Alphanumeric
  }, [
    watch("max_serial_number"),
    watch("min_serial_number"),
    watch("format_range_serial_number"),
    scannedSerialNumbers.length,
    setValue,
  ]);

  const manuallyAddingSerialNumbers = () => {
    if (String(watch("serial_number_list")).length < 1) return;
    if (scannedSerialNumbers.includes(watch("serial_number_list")))
      return message.warning(
        "Serial number is already scanned or invalid for this transaction."
      );
    const result = [...scannedSerialNumbers, watch("serial_number_list")];
    setValue("serial_number_list", "");
    return setScannedSerialNumbers(result);
  };
  
  // Effects from the original file related to serial numbers
  useEffect(() => {
    qtyDiff();
  }, [
    watch("max_serial_number"),
    watch("min_serial_number"),
    watch("format_range_serial_number"),
    scannedSerialNumbers.length,
    qtyDiff,
  ]);
  
  useEffect(() => {
    if (watch("format_range_serial_number") === "Custom format") {
      setRangeFormat(true);
      setAddSerialNumberField(false);
    }
    if (watch("format_range_serial_number") === "Sequential number") {
      setRangeFormat(false);
      setAddSerialNumberField(true);
      setValue("feed_serial_number", "Typing");
    }
    if (watch("format_range_serial_number") === "") {
      setRangeFormat(false);
      setAddSerialNumberField(false);
      setValue("feed_serial_number", "");
    }
  }, [watch("format_range_serial_number")]);

  useEffect(() => {
    if (
      watch("format_range_serial_number") === "Custom format" &&
      watch("feed_serial_number") === "Typing"
    ) {
      setLabeling("All typed serial numbers are displayed here.");
    }
    if (
      watch("format_range_serial_number") === "Custom format" &&
      watch("feed_serial_number") === "Scanning"
    ) {
      setLabeling("All scanned serial numbers are displayed here.");
    }
  }, [watch("feed_serial_number")]);

  useEffect(() => {
    setValue("serial_number_list", "");
    setValue("min_serial_number", "");
    setValue("max_serial_number", "");
    setValue("quantity", 0);
    setScannedSerialNumbers([]);
  }, [watch("format_range_serial_number"), watch("feed_serial_number")]);
  
  useEffect(() => {
    setValue("serial_number_list", scannedSerialNumbers.join(", "));
  }, [scannedSerialNumbers.length]);


  return {
    allSerialNumbersOptions,
    setAllSerialNumbersOptions,
    addSerialNumberField,
    setAddSerialNumberField,
    rangeFormat,
    setRangeFormat,
    scannedSerialNumbers,
    setScannedSerialNumbers,
    openScanningModal,
    setOpenScanningModal,
    openScannedItemView,
    setOpenScannedItemView,
    labeling,
    setLabeling,
    qtyDiff,
    manuallyAddingSerialNumbers,
  };
};

export default useSerialNumbers;
