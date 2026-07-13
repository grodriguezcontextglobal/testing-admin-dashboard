import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Col, Row, Tree, Empty, message } from "antd";
import DevitrakLoading from "../../../components/animation/DevitrakLoading";
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
import MultiSelectComponent from "../../../components/UX/dropdown/MultiSelectComponent";
import Chip from "../../../components/UX/Chip/Chip";

// ─── Layout helpers ───────────────────────────────────────────────────────────

const SectionHeader = ({ step, title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
    <div
      style={{
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        background: "#155EEF",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {step}
    </div>
    <span style={{ fontSize: "14px", fontWeight: 600, color: "#101828" }}>{title}</span>
    <div style={{ flex: 1, height: "1px", background: "#EAECF0" }} />
  </div>
);

const PanelCard = ({ title, children }) => (
  <div style={{ border: "1px solid #EAECF0", borderRadius: "12px", overflow: "hidden" }}>
    <div
      style={{
        padding: "10px 16px",
        borderBottom: "1px solid #EAECF0",
        background: "#F9FAFB",
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: 600, color: "#344054" }}>{title}</span>
    </div>
    <div style={{ padding: "12px" }}>{children}</div>
  </div>
);

const ResultCard = ({ title, items, borderColor, bgColor, textColor, chipColor }) => (
  <div style={{ border: `1px solid ${borderColor}`, borderRadius: "12px", overflow: "hidden" }}>
    <div
      style={{
        padding: "10px 14px",
        background: bgColor,
        borderBottom: `1px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span style={{ fontSize: "13px", fontWeight: 600, color: textColor }}>{title}</span>
      <span
        style={{
          background: "white",
          color: textColor,
          border: `1px solid ${borderColor}`,
          borderRadius: "9999px",
          padding: "1px 10px",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        {items.length}
      </span>
    </div>
    <div
      style={{
        padding: "12px",
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        maxHeight: 160,
        overflow: "auto",
      }}
    >
      {items.length > 0 ? (
        items.map((item) => (
          <Chip key={item} label={item} color={chipColor} size="small" />
        ))
      ) : (
        <span style={{ color: "#98A2B3", fontSize: "13px" }}>None</span>
      )}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const CheckInDevicesFromEventsModal = ({ open, close }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedLocationObject, setSelectedLocationObject] = useState(null);
  const [selectedSubLocations, setSelectedSubLocations] = useState(new Set());
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

  const { data: locations = [], isLoading: isLoadingLocations } = useCompanyLocations();
  const { data: subLocations = [], isLoading: isLoadingSubLocations } =
    useSubLocations(selectedLocation);

  const {
    data: events = [],
    isLoading: isLoadingEvents,
    refetch: eventListRefetch,
  } = useQuery({
    queryKey: ["finishedEvents", user.companyData.id],
    queryFn: async () => {
      const respo = await devitrakApi.post(`/event/event-list`, {
        type: "event",
        company_id: user.companyData.id,
        logistic_inventory_status: "in-transit",
        active: false,
      });
      return respo.data.list.filter((event) => event.active === false);
    },
    enabled: !!user.companyData.id,
  });

  const queryClient = useQueryClient();

  const refetchInventory = async () => {
    await queryClient.invalidateQueries({ queryKey: ["finishedEvents", user.companyData.id], refetchActive: true });
    await queryClient.invalidateQueries({ queryKey: ["listOfItemsInStock"], refetchActive: true });
    await queryClient.invalidateQueries({ queryKey: ["imagePerItemList"], refetchActive: true });
    await queryClient.invalidateQueries({ queryKey: ["ItemsInInventoryCheckingQuery"], refetchActive: true });
    await queryClient.invalidateQueries({ queryKey: ["RefactoredListInventoryCompany"], refetchActive: true });
  };

  const checkingInItemsToWarehouseMutation = useMutation({
    mutationFn: async (template) =>
      await devitrakApi.post("/db_event/confirm-item-return", template),
    onSuccess: async () => {
      message.success("Devices checked in successfully!");
      await refetchInventory();
      close();
    },
  });

  const handleEventSelection = async (event) => {
    if (!event) {
      setEventInventory([]);
      setSelectedEvent(null);
      return;
    }
    setEventInventory([]);
    setScannedSerials([]);
    setComparisonResults({ matchedItems: [], missingItems: [], extraItems: [] });
    setSelectedEvent(event.eventInfoDetail.eventName);

    if (!event.deviceSetup) {
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
      const allInventory = responses.flatMap((resp) => resp.data.receiversInventory);
      setEventInventory(allInventory);
      if (allInventory.length === 0) {
        await devitrakApi.patch(`/event/edit-staff-event/${event.id}`, {
          logistic_inventory_status: "completed",
        });
        await eventListRefetch();
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
      if (!scannedSerials.some((item) => item.value === scannedSerialInput.trim())) {
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

  const handleRemoveSubLocation = (sub) => {
    const next = new Set(selectedSubLocations);
    next.delete(sub);
    setSelectedSubLocations(next);
  };

  const handleItemChange = (value) => {
    setSelectedSubLocations(value);
  };

  const handleCompare = () => {
    const inventorySerials = eventInventory.map((item) => item.device);
    const scanned = scannedSerials.map((item) => item.value);
    setComparisonResults({
      matchedItems: scanned.filter((s) => inventorySerials.includes(s)),
      missingItems: inventorySerials.filter((s) => !scanned.includes(s)),
      extraItems: scanned.filter((s) => !inventorySerials.includes(s)),
    });
  };

  const handleCheckIn = async () => {
    if (!selectedLocation) {
      message.error("Please select a check-in location.");
      return;
    }
    if (!selectedEvent) {
      message.error("Please select an event.");
      return;
    }
    try {
      setIsLoading(true);
      const template = {
        serial_numbers: comparisonResults.matchedItems,
        company_id: user.sqlInfo.company_id,
        location: selectedLocation,
        sub_location: Array.from(selectedSubLocations),
        noSqlCompanyId: user.companyData.id,
        noSqlEventName: selectedEvent,
        user_id: user.sqlMemberInfo.staff_id,
      };
      checkingInItemsToWarehouseMutation.mutateAsync(template);
    } catch (error) {
      console.error(error);
      message.error("Failed to check-in devices.");
    } finally {
      setIsLoading(false);
    }
  };

  const itemsToDisplay = useMemo(
    () =>
      Array.isArray(subLocations)
        ? subLocations.map((sub) => ({ label: sub, id: sub }))
        : [],
    [subLocations],
  );

  const hasComparisonResults =
    comparisonResults.matchedItems.length > 0 ||
    comparisonResults.missingItems.length > 0 ||
    comparisonResults.extraItems.length > 0;

  // ─── Modal body ─────────────────────────────────────────────────────────────

  const body = (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", paddingBottom: "4px" }}>

      {/* ── 1. Location & Event ────────────────────────────────────────────── */}
      <section>
        <SectionHeader step="1" title="Location & Event" />
        <Row gutter={[16, 16]} align="bottom">
          <Col span={8}>
            {isLoadingLocations ? (
              <DevitrakLoading />
            ) : (
              <SelectComponent
                label="Location"
                placeholder="Select a location"
                items={locations.map((loc) => ({ label: loc.location, id: loc.id }))}
                value={selectedLocationObject}
                onSelect={(option) => {
                  setSelectedLocation(option?.id || null);
                  setSelectedLocationObject(option);
                  setSelectedSubLocations(new Set());
                }}
              />
            )}
          </Col>

          <Col span={8}>
            {isLoadingSubLocations ? (
              <DevitrakLoading />
            ) : (
              itemsToDisplay.length > 0 && (
                <MultiSelectComponent
                  label="Sub-locations"
                  placeholder="Select sub-locations"
                  items={itemsToDisplay}
                  selectedKeys={selectedSubLocations}
                  onSelectionChange={handleItemChange}
                  disabled={!selectedLocation}
                  onReset={() => setSelectedSubLocations(new Set())}
                  onSelectAll={() =>
                    setSelectedSubLocations(new Set(itemsToDisplay.map((i) => i.id)))
                  }
                >
                  {(item) => (
                    <MultiSelectComponent.Item
                      id={item.id}
                      selectionIndicator="checkbox"
                      selectionIndicatorAlign="left"
                    >
                      {item.label}
                    </MultiSelectComponent.Item>
                  )}
                </MultiSelectComponent>
              )
            )}
          </Col>

          <Col span={8}>
            {isLoadingEvents ? (
              <DevitrakLoading />
            ) : (
              <SelectComponent
                label="Event"
                placeholder="Search closed events…"
                items={events.map((event) => ({
                  id: event.id,
                  label: event.eventInfoDetail.eventName,
                  original: event,
                }))}
                value={selectedEvent}
                onSelect={(option) => {
                  setSelectedEvent(option?.label || null);
                  handleEventSelection(option?.original || null);
                }}
              />
            )}
          </Col>
        </Row>

        {selectedSubLocations.size > 0 && (
          <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {Array.from(selectedSubLocations).map((sub) => (
              <Chip
                key={sub}
                label={sub}
                color="success"
                variant="outlined"
                size="small"
                onDelete={() => handleRemoveSubLocation(sub)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 2. Inventory & Scan ────────────────────────────────────────────── */}
      <section>
        <SectionHeader step="2" title="Inventory & Scan" />
        <Row gutter={[16, 0]}>
          <Col span={12}>
            <PanelCard title={`Event Inventory (${eventInventory.length})`}>
              {isLoading ? (
                <div
                  style={{
                    height: 280,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <DevitrakLoading />
                </div>
              ) : treeData?.length > 0 ? (
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
                  <Empty description="No inventory for this event." />
                </div>
              )}
            </PanelCard>
          </Col>

          <Col span={12}>
            <PanelCard title={`Scanned Serials (${scannedSerials.length})`}>
              <Input
                placeholder="Scan or type and press Enter"
                value={scannedSerialInput}
                onChange={(e) => setScannedSerialInput(e.target.value)}
                onKeyDown={handleScanSerial}
              />
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  maxHeight: 220,
                  overflow: "auto",
                }}
              >
                {scannedSerials.length > 0 ? (
                  scannedSerials.map((item) => (
                    <Chip
                      key={item.id}
                      label={item.value}
                      color="indigo"
                      size="small"
                      onDelete={() => handleRemoveSerial(item.id)}
                    />
                  ))
                ) : (
                  <span style={{ color: "#98A2B3", fontSize: "13px" }}>
                    No serials scanned yet.
                  </span>
                )}
              </div>
            </PanelCard>
          </Col>
        </Row>

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
          <BlueButtonComponent
            title="Compare"
            func={handleCompare}
            disabled={scannedSerials.length === 0 || eventInventory.length === 0}
          />
        </div>
      </section>

      {/* ── 3. Comparison Results ──────────────────────────────────────────── */}
      {hasComparisonResults && (
        <section>
          <SectionHeader step="3" title="Comparison Results" />
          <Row gutter={[12, 12]}>
            <Col span={8}>
              <ResultCard
                title="Matched"
                items={comparisonResults.matchedItems}
                borderColor="#ABEFC6"
                bgColor="#ECFDF3"
                textColor="#067647"
                chipColor="success"
              />
            </Col>
            <Col span={8}>
              <ResultCard
                title="Missing"
                items={comparisonResults.missingItems}
                borderColor="#FECDCA"
                bgColor="#FEF3F2"
                textColor="#B42318"
                chipColor="error"
              />
            </Col>
            <Col span={8}>
              <ResultCard
                title="Not in Event"
                items={comparisonResults.extraItems}
                borderColor="#FEDF89"
                bgColor="#FFFAEB"
                textColor="#B54708"
                chipColor="warning"
              />
            </Col>
          </Row>
        </section>
      )}

      {/* ── Footer actions ─────────────────────────────────────────────────── */}
      {comparisonResults.matchedItems.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            paddingTop: "4px",
            borderTop: "1px solid #EAECF0",
          }}
        >
          <GrayButtonComponent title="Cancel" func={close} />
          <BlueButtonComponent
            title="Check-In"
            func={handleCheckIn}
            loadingState={isLoading}
          />
        </div>
      )}
    </div>
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
