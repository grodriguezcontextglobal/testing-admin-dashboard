const RenderingEventInventorySection = ({
  Space,
  ReusableCardWithHeaderAndFooter,
  DangerButtonConfirmationComponent,
  handleRemoveItemFromInventoryEvent,
  event=[]
}) => {
  return (
    <Space key={event.id} id={`event-inventory-section-${event.id}`} style={{ width: "100%" }} size={[8, 16]} wrap>
      {event?.deviceSetup.map((item) => {
        return (
          <ReusableCardWithHeaderAndFooter
            title={item.group}
            key={item.id}
            actions={[
              <div
                key={item.id}
                style={{
                  width: "100%",
                  justifyContent: "flex-end",
                  padding: "0 24px",
                }}
              >
                <DangerButtonConfirmationComponent
                  title={"Remove"}
                  confirmationTitle="Are you sure you want to remove this item from event?"
                  func={() => handleRemoveItemFromInventoryEvent(item)}
                />{" "}
              </div>,
            ]}
          >
            <p>
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
