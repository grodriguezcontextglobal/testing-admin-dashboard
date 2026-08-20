/**
 * What the event already holds, with a way to send each group back to stock.
 *
 * The default used to be `event = []`, which then read `event?.deviceSetup.map`
 * — the optional chain guarded the wrong link, so the default itself would have
 * thrown. An event with no inventory yet now renders a line instead.
 */
const RenderingEventInventorySection = ({
  Space,
  ReusableCardWithHeaderAndFooter,
  DangerButtonConfirmationComponent,
  handleRemoveItemFromInventoryEvent,
  event = {},
}) => {
  const deviceSetup = Array.isArray(event?.deviceSetup) ? event.deviceSetup : [];

  if (deviceSetup.length === 0) {
    return (
      <p
        style={{
          margin: 0,
          padding: "20px 24px",
          borderRadius: "8px",
          border: "1px dashed var(--gray-300, #D0D5DD)",
          background: "var(--gray-50, #F9FAFB)",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          lineHeight: "20px",
          color: "var(--gray-500, #667085)",
          textAlign: "center",
        }}
      >
        Nothing has been added to this event yet.
      </p>
    );
  }

  return (
    <Space
      key={event.id}
      id={`event-inventory-section-${event.id}`}
      style={{ width: "100%" }}
      size={[8, 16]}
      wrap
    >
      {deviceSetup.map((item) => {
        const key = `${item.category ?? ""}||${item.group ?? ""}`;
        return (
          <ReusableCardWithHeaderAndFooter
            title={item.group}
            key={key}
            actions={[
              <div
                key={key}
                style={{
                  width: "100%",
                  justifyContent: "flex-end",
                  padding: "0 24px",
                }}
              >
                <DangerButtonConfirmationComponent
                  title={"Remove"}
                  confirmationTitle={`Send all ${item.quantity ?? 0} ${item.group} back to stock?`}
                  func={() => handleRemoveItemFromInventoryEvent(item)}
                />{" "}
              </div>,
            ]}
          >
            <p style={{ margin: 0 }}>
              Qty: {item.quantity} | Serial number range:{" "}
              <strong>
                {item.startingNumber ?? ""} - {item.endingNumber ?? ""}
              </strong>
            </p>
          </ReusableCardWithHeaderAndFooter>
        );
      })}
    </Space>
  );
};

export default RenderingEventInventorySection;
