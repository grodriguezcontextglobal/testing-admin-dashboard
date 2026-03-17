import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Col,
  Divider,
  List,
  Row,
  message,
  Typography,
  Spin,
  Tree,
  Empty,
} from "antd";
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { devitrakApi } from "../../../api/devitrakApi";
import { groupBy } from "lodash";
import useCompanyLocations from "../actions/utils/useCompanyLocations";
import useSubLocations from "../actions/utils/useSubLocations";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import Input from "../../../components/UX/inputs/Input";
import SelectComponent from "../../../components/UX/dropdown/SelectComponent";
import Loading from "../../../components/animation/Loading";
import MultiSelectComponent from "../../../components/UX/dropdown/MultiSelectComponent";
const { Title } = Typography;
const CheckInDevicesFromEventsModal = ({ open, close }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedLocationObject, setSelectedLocationObject] = useState(null);
  const [selectedSubLocations, setSelectedSubLocations] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventInventory, setEventInventory] = useState([]);
  const [scannedSerials, setScannedSerials] = useState([]);
  const [comparisonResults, setComparisonResults] = useState({
    matchedItems: [],
    missingItems: [],
    extraItems: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [scannedSerialInput, setScannedSerialInput] = useState("");

  const { user } = useSelector((state) => state.admin);

  const { data: locations = [], isLoading: isLoadingLocations } =
    useCompanyLocations();
  const { data: subLocations = [], isLoading: isLoadingSubLocations } =
    useSubLocations(selectedLocation);

  const { data: events = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ["finishedEvents", user.companyData.id],
    queryFn: async () => {
      const respo = await devitrakApi.post(`/event/event-list`, {
        type: "event",
        company_id: user.companyData.id,
        logistic_inventory_status: "in-transit",
      });
      return respo.data.list.filter((event) => event.active === false);
    },
    enabled: !!user.companyData.id,
  });

  const handleEventSelection = async (event) => {
    if (!event) {
      setEventInventory([]);
      setSelectedEvent(null);
      return;
    }
    // Clear previous state on new event selection
    setEventInventory([]);
    setScannedSerials([]);
    setComparisonResults({
      matchedItems: [],
      missingItems: [],
      extraItems: [],
    });

    setSelectedEvent(event);
    if (!event || !event.deviceSetup) {
      message.warning("Selected event has no device setup.");
      return;
    }

    setIsLoading(true);
    try {
      const inventoryPromises = event.deviceSetup.map((item) =>
        devitrakApi.post("/receiver/receiver-pool-list", {
          type: item.group,
          contract_type: "event",
          company: user.companyData.id,
          eventSelected: event.eventInfoDetail.eventName,
        }),
      );

      const responses = await Promise.all(inventoryPromises);
      const allInventory = responses.flatMap(
        (resp) => resp.data.receiversInventory,
      );
      setEventInventory(allInventory);
      if (allInventory.length === 0) {
        message.info("No inventory found for this event.");
      }
    } catch (error) {
      console.error("Failed to fetch event inventory:", error);
      message.error("An error occurred while fetching event inventory.");
      setEventInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const treeData = useMemo(() => {
    const grouped = groupBy(eventInventory, "type");
    return Object.entries(grouped).map(([type, items]) => ({
      title: `${type} (${items.length})`,
      key: type,
      children: items.map((item) => ({
        title: item.device,
        key: `${type}-${item.device}`,
        isLeaf: true,
      })),
    }));
  }, [eventInventory]);

  const handleScanSerial = (e) => {
    if (e.key === "Enter" && scannedSerialInput.trim() !== "") {
      if (
        !scannedSerials.some((item) => item.value === scannedSerialInput.trim())
      ) {
        setScannedSerials((prev) => [
          ...prev,
          { id: Date.now(), value: scannedSerialInput.trim() },
        ]);
      }
      setScannedSerialInput("");
    }
  };

  const handleRemoveSerial = (id) => {
    setScannedSerials((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCompare = () => {
    const inventorySerials = eventInventory.map((item) => item.device);
    const scanned = scannedSerials.map((item) => item.value);

    const matched = scanned.filter((s) => inventorySerials.includes(s));
    const missing = inventorySerials.filter((s) => !scanned.includes(s));
    const extra = scanned.filter((s) => !inventorySerials.includes(s));
    setComparisonResults({
      matchedItems: matched,
      missingItems: missing,
      extraItems: extra,
    });
  };

  const handleCheckIn = async () => {
    if (!selectedLocation) {
      message.error("Please select a check-in location.");
      return;
    }
    try {
      const template = {
        serial_numbers: [
          ...comparisonResults.matchedItems.map((serial) => serial),
        ],
        company_id: user.sqlInfo.company_id,
        location: selectedLocation,
        sub_location: selectedSubLocations,
        noSqlCompanyId: user.companyData.id,
        noSqlEventName: selectedEvent.eventInfoDetail.eventName,
        user_id: user.sqlMemberInfo.staff_id,
      };
      await devitrakApi.post("/db_event/confirm-item-return", template);
      message.success("Devices checked in successfully!");
      close();
    } catch (error) {
      console.error(error);
      message.error("Failed to check-in devices.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderComparisonList = (title, items, color) => (
    <>
      <Title level={5}>
        {title} ({items.length})
      </Title>
      <List
        bordered
        dataSource={items}
        renderItem={(item) => (
          <List.Item style={{ color: color }}>{item}</List.Item>
        )}
        style={{ maxHeight: 150, overflow: "auto" }}
      />
    </>
  );

  const body = (
    <>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          {isLoadingLocations ? (
            <Loading />
          ) : (
            <SelectComponent
              items={locations.map((loc) => ({
                label: loc.location,
                id: loc.id,
              }))}
              value={selectedLocationObject}
              onSelect={(option) => {
                setSelectedLocation(option?.id || null);
                setSelectedLocationObject(option);
                setSelectedSubLocations([]);
              }}
              placeholder="Select Location"
              disabled={!open}
              label={"Select Location"}
            />
          )}
        </Col>
        <Col span={8}>
          {isLoadingSubLocations ? (
            <Loading />
          ) : (
            <MultiSelectComponent
              onChange={setSelectedSubLocations}
              items={subLocations.map((sub) => ({ label: sub, value: sub }))}
              placeholder="Select or create sub-locations"
              disabled={!selectedLocation || !open}
              value={selectedSubLocations}
              label={"Select or create sub-locations"}
            />
          )}
        </Col>
        <Col span={8}>
          {isLoadingEvents ? (
            <Loading />
          ) : (
            <SelectComponent
              label="Select Event"
              items={events.map((event) => ({
                id: event.id,
                label: event.eventInfoDetail.eventName,
                // supportingText: `Starts: ${new Date(event.eventInfoDetail.startingDate).toLocaleDateString()}`,
                original: event,
              }))}
              value={selectedEvent}
              onSelect={(option) =>
                handleEventSelection(option?.original || null)
              }
              placeholder="Type to search for closed events"
              disabled={!open}
            />
          )}
        </Col>
      </Row>
      <Divider />
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Title level={5}>Event Inventory ({eventInventory.length})</Title>
          {isLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Spin />
            </div>
          ) : (
            <div
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: "12px",
                padding: "8px",
                maxHeight: 300,
              }}
            >
              {treeData?.length > 0 ? (
                <Tree treeData={treeData} height={280} defaultExpandAll />
              ) : (
                <div
                  style={{
                    height: 280,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Empty
                    style={{ borderRadius: "12px !important" }}
                    description="No inventory available for this event."
                  />
                </div>
              )}
            </div>
          )}
        </Col>
        <Col span={12}>
          <Title level={5}>Scan Serial Number</Title>
          <Input
            placeholder="Scan or type serial number and press Enter"
            value={scannedSerialInput}
            onChange={(e) => setScannedSerialInput(e.target.value)}
            onKeyDown={handleScanSerial}
          />
          <List
            bordered
            dataSource={scannedSerials}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key={item.id}
                    type="link"
                    danger
                    onClick={() => handleRemoveSerial(item.id)}
                  >
                    Remove
                  </Button>,
                ]}
              >
                {item.value}
              </List.Item>
            )}
            style={{ marginTop: 16, maxHeight: 220, overflow: "auto" }}
          />
        </Col>
      </Row>
      <Divider />
      <BlueButtonComponent
        title="Compare"
        func={handleCompare}
        disabled={scannedSerials.length === 0}
      />
      <Divider />
      {comparisonResults.matchedItems.length > 0 ||
      comparisonResults.missingItems.length > 0 ||
      comparisonResults.extraItems.length > 0 ? (
        <Row gutter={[16, 16]}>
          <Col span={8}>
            {renderComparisonList(
              "Matched Items",
              comparisonResults.matchedItems,
              "green",
            )}
          </Col>
          <Col span={8}>
            {renderComparisonList(
              "Missing Items",
              comparisonResults.missingItems,
              "red",
            )}
          </Col>
          <Col span={8}>
            {renderComparisonList(
              "Items do not belong to this event.",
              comparisonResults.extraItems,
              "orange",
            )}
          </Col>
        </Row>
      ) : null}
      {comparisonResults.matchedItems.length > 0 && (
        <>
          <Divider />
          <div style={{ width: "100%", display: "flex", gap: 5 }}>
            <GrayButtonComponent
              styles={{ width: "100%" }}
              title="Cancel"
              func={close}
            />
            <BlueButtonComponent
              styles={{ width: "100%" }}
              func={handleCheckIn}
              loadingState={isLoading}
              title="Check-In"
            />
          </div>
        </>
      )}
    </>
  );

  return (
    <ModalUX
      openDialog={open}
      closeModal={close}
      title="Check-In Devices from Event"
      body={body}
    />
  );
};

export default CheckInDevicesFromEventsModal;
