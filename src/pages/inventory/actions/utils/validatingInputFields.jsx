const validatingInputFields = ({
  data,
  openNotificationWithIcon,
  returningDate,
}) => {
  if (data.item_group === "")
    return openNotificationWithIcon("A group of item must be provided.");
  if (data.category_name === "")
    return openNotificationWithIcon("A category of item must be provided.");
  if (data.brand === "")
    return openNotificationWithIcon("A brand of item must be provided.");
  if (data.container === "")
    return openNotificationWithIcon(
      "A container value of item must be provided."
    );
  if (data.tax_location === "")
    return openNotificationWithIcon("A taxable location must be provided.");
  if (data.ownership === "")
    return openNotificationWithIcon("Ownership status must be provided.");
  if (String(data.ownership).toLowerCase() === "rent" && !returningDate) {
    return openNotificationWithIcon(
      "As ownership was set as 'Rent', returning date must be provided."
    );
  }
  if (String(data.enableAssignFeature).toLowerCase() === "") {
    return openNotificationWithIcon(
      "Must provide if item is assignable to staff or events."
    );
  }
};

export default validatingInputFields;
