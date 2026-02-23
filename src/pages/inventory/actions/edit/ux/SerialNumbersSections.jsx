import { UploadOutlined } from "@ant-design/icons";
import { Grid } from "@mui/material";
import { Button, Col, Divider, message, Row, Tabs, Upload } from "antd";
import { useCallback, useState } from "react";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import Input from "../../../../../components/UX/inputs/Input";
import ReusableTextArea from "../../../../../components/UX/inputs/TextArea";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import { TextFontSize30LineHeight38 } from "../../../../../styles/global/TextFontSize30LineHeight38";
import RenderingItemsAddedForStore from "../../utils/uxForm/RenderingItemsAddedForStore";
import SerialNumberAndMoreInfoComponentForm from "../../utils/uxForm/SerialNumberAndMoreInfoComponentForm";
import useLogic from "../useLogic";

// --- Helper for Sequential Logic ---

const generateSequentialSerials = (start, end) => {
  const result = [];
  const startNum = parseInt(start, 10);
  const endNum = parseInt(end, 10);

  // Simple numeric range (e.g., "1001" to "1050")
  if (
    !isNaN(startNum) &&
    !isNaN(endNum) &&
    start.toString() === startNum.toString() &&
    end.toString() === endNum.toString()
  ) {
    if (startNum > endNum) {
      message.error("Start serial must be less than or equal to end serial.");
      return [];
    }
    for (let i = startNum; i <= endNum; i++) {
      result.push(i.toString());
    }
    return result;
  }

  // Alphanumeric range (e.g., "SN-001" to "SN-100")
  const startMatch = start.match(/^(.*?)(\d+)$/);
  const endMatch = end.match(/^(.*?)(\d+)$/);

  if (startMatch && endMatch && startMatch[1] === endMatch[1]) {
    const prefix = startMatch[1];
    let numStart = parseInt(startMatch[2], 10);
    let numEnd = parseInt(endMatch[2], 10);
    const startPadding = startMatch[2].length;

    if (numStart > numEnd) {
      message.error("Start serial must be less than or equal to end serial.");
      return [];
    }

    for (let i = numStart; i <= numEnd; i++) {
      result.push(prefix + i.toString().padStart(startPadding, "0"));
    }
    return result;
  }

  message.error(
    "Invalid or non-matching sequential format. Use a simple number range or a common prefix with a number suffix (e.g., ABC-1 to ABC-10).",
  );
  return [];
};

// --- Sub-components for each Tab ---

const ScanInputTab = ({ onSerialsChange, setScannedSerialNumbers }) => {
  const [scannedSerials, setScannedSerials] = useState("");

  const addSerialNumberInSequantial = () => {
    const result = scannedSerials.split("\n").filter((s) => s.trim() !== "");
    onSerialsChange(result);
    return setScannedSerialNumbers(result);
  };

  return (
    <div>
      <p>
        Enter each serial number on a new line. You can paste a list from your
        scanner or a document.
      </p>
      <ReusableTextArea
        rows={6}
        value={scannedSerials}
        onChange={(e) => setScannedSerials(e.target.value)}
        placeholder="SN001\nSN002\nSN003..."
        style={{ marginTop: "8px" }}
      />
      <BlueButtonComponent
        title="Add serial numbers"
        func={() => addSerialNumberInSequantial()}
        styles={{ marginTop: "0.5rem" }}
      />
    </div>
  );
};

const SequentialInputTab = ({ onSerialsChange, setScannedSerialNumbers }) => {
  const [startSerial, setStartSerial] = useState("");
  const [endSerial, setEndSerial] = useState("");

  const addSerialNumberInSequantial = () => {
    if (startSerial && endSerial) {
      const result = generateSequentialSerials(startSerial, endSerial);
      onSerialsChange(result);
      return setScannedSerialNumbers(result);
    } else {
      onSerialsChange([]);
      return setScannedSerialNumbers([]);
    }
  };
  return (
    <div>
      <p>Enter the starting and ending serial numbers of the range.</p>
      <Row gutter={16} style={{ marginTop: "8px" }}>
        <Col xs={24} sm={12}>
          <Input
            value={startSerial}
            onChange={(e) => setStartSerial(e.target.value)}
            placeholder="Start Serial (e.g., 1001 or SN-1001)"
          />
        </Col>
        <Col xs={24} sm={12}>
          <Input
            value={endSerial}
            onChange={(e) => setEndSerial(e.target.value)}
            placeholder="End Serial (e.g., 1050 or SN-1050)"
          />
        </Col>
        <Col sx={24} sm={12}>
          <BlueButtonComponent
            title="Add serial numbers"
            func={() => addSerialNumberInSequantial()}
            styles={{ marginTop: "0.5rem" }}
          />
        </Col>
      </Row>
    </div>
  );
};

const FileUploadTab = ({ onSerialsChange, setScannedSerialNumbers }) => {
  const handleFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const serials = text
        .replace(/,/g, "\n")
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s);
      onSerialsChange(serials);
      setScannedSerialNumbers(serials);
      message.success(
        `${file.name} loaded successfully. Found ${serials.length} serials.`,
      );
    };
    reader.onerror = () => {
      message.error("Error reading file.");
      onSerialsChange([]);
      setScannedSerialNumbers([]);
    };
    reader.readAsText(file);
    return false; // Prevent antd's default upload action
  };

  return (
    <div>
      <p>
        Upload a .txt or .csv file with serial numbers. Serials can be separated
        by new lines or commas.
      </p>
      <Upload beforeUpload={handleFile} maxCount={1} accept=".txt,.csv">
        <Button icon={<UploadOutlined />} style={{ marginTop: "8px" }}>
          Select File
        </Button>
      </Upload>
    </div>
  );
};

// --- Main Component ---

const SerialNumbersSections = ({ style }) => {
  const {
    scannedSerialNumbers,
    setScannedSerialNumbers,
    moreInfo,
    setMoreInfo,
  } = useLogic();
  const [finalSerials, setFinalSerials] = useState([]);
console.log(moreInfo)
console.log(setMoreInfo)
console.log(scannedSerialNumbers)
console.log(setScannedSerialNumbers)
  const handleSerialsChange = useCallback((serials) => {
    const formattedSerials = serials.map((serial) => ({
      id: serial, // Use serial as the unique ID
      data: { [serial]: {} }, // The structure expected by the child component
    }));
    setFinalSerials(formattedSerials);
  }, []);

  const handleRemoveDevice = useCallback((idToRemove) => {
    setFinalSerials((currentSerials) =>
      currentSerials.filter((device) => device.id !== idToRemove),
    );
  }, []);

  const items = [
    {
      key: "1",
      label: "Scan / Paste",
      children: (
        <ScanInputTab
          onSerialsChange={handleSerialsChange}
          setScannedSerialNumbers={setScannedSerialNumbers}
        />
      ),
    },
    {
      key: "2",
      label: "Sequential Range",
      children: (
        <SequentialInputTab
          onSerialsChange={handleSerialsChange}
          setScannedSerialNumbers={setScannedSerialNumbers}
        />
      ),
    },
    {
      key: "3",
      label: "File Upload",
      children: (
        <FileUploadTab
          onSerialsChange={handleSerialsChange}
          setScannedSerialNumbers={setScannedSerialNumbers}
        />
      ),
    },
  ];
  const upperOptions = [
    {
      key: "1",
      label: (
        <p style={Subtitle}>
          Update general information to a massive group of devices
        </p>
      ),
      children: (
        <Grid container spacing={1}>
          <div
            // onSubmit={(e)=>handleAddDevice(e)}
            style={{ margin: "1rem 0", gap: 0 }}
            className="form"
          >
            <p
              style={{
                ...TextFontSize30LineHeight38,
                color: Subtitle.color,
                width: "100%",
                textAlign: "left",
              }}
            >
              Serial numbers and identifiers
            </p>
            <p
              style={{
                ...TextFontSize20LineHeight30,
                color: Subtitle.color,
                width: "100%",
                textAlign: "left",
              }}
            >
              You can enter all the details manually or use a scanner to enter
              the serial numbers.
            </p>
            <div style={{ marginTop: "16px", width: "100%" }}>
              <Tabs defaultActiveKey="1" items={items} />
            </div>
          </div>
          <Divider />
          <RenderingItemsAddedForStore
            devices={finalSerials}
            handleRemoveDevice={handleRemoveDevice}
          />
        </Grid>
      ),
    },
    {
      key: "2",
      label: <p style={Subtitle}>Update specific information each devices</p>,
      children: (
        <SerialNumberAndMoreInfoComponentForm
          style={style}
          scannedSerialNumbers={scannedSerialNumbers}
          setScannedSerialNumbers={setScannedSerialNumbers}
          moreInfo={moreInfo}
          setMoreInfo={setMoreInfo}
        />
      ),
    },
  ];

  return <Tabs defaultActiveKey="1" items={upperOptions} />;
};

export default SerialNumbersSections;
