export const renderFields = ({
  OutlinedInputStyle,
  retrieveItemOptions,
  options,
  renderLocationOptions,
  displayContainerSplotLimitField,
  subLocationsOptions,
}) => {
  const fields = [
    {
      name: "item_group",
      placeholder: "Type the name of the device",
      label: "Device name",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("item_group"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
      displayField: true,
    },
    {
      name: "category_name",
      placeholder: "e.g. Electronic",
      label: "Category",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("category_name"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
      displayField: true,
    },
    {
      name: "brand",
      placeholder: "e.g. Apple",
      label: "Brand",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("brand"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
      displayField: true,
    },
    {
      name: "cost",
      placeholder: "e.g. 12000.54 | 95.44 | 4585",
      label: "Replacement cost",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("cost"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
      displayField: true,
    },
    {
      name: "tax_location",
      placeholder: "e.g. 12000.54 | 95.44 | 4585",
      label: "Taxable location",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: renderLocationOptions(),
      htmlOption: 2,
      tooltip: true,
      tooltipMessage:
        "Address where tax deduction for equipment will be applied.",
      displayField: true,
    },
    {
      name: "container",
      placeholder: "e.g. Permanent",
      label: "Is it a container?",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: [
        {
          value: "No - It is not a container",
        },
        {
          value: "Yes - It is a container",
        },
      ],
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "This item will contain other items inside.",
      displayField: true,
    },
    {
      name: "containerSpotLimit",
      placeholder: "e.g. Permanent",
      label: "Container Spot Limit",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: [],
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "How many items can be stored inside the container.",
      displayedButton: false,
      displayField: displayContainerSplotLimitField,
    },
    {
      name: "location",
      placeholder: "Select a location",
      label: "Main location",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: renderLocationOptions(),
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "Where the item is location physically.",
      displayField: true,
    },
    {
      name: "sub_location",
      placeholder: "Select a location",
      label: "Sub location",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: subLocationsOptions[0],
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "Where the item is location physically.",
      displayField: true,
    },
    {
      name: "sub_location_2",
      placeholder: "Select a location",
      label: "Sub location 2",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: subLocationsOptions[1],
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "Where the item is location physically.",
      displayField: true,
    },
    {
      name: "sub_location_3",
      placeholder: "Select a location",
      label: "Sub location 3",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: subLocationsOptions[2],
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "Where the item is location physically.",
      displayField: true,
    },
    {
      name: "min_serial_number",
      placeholder: "e.g. 300",
      label: "Starting Serial number",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("serial_number"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
      displayField: true,
    },
    {
      name: "max_serial_number",
      placeholder: "e.g. 300",
      label: "Ending Serial number",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: retrieveItemOptions("serial_number"),
      htmlOption: 0,
      tooltip: false,
      tooltipMessage: null,
      displayField: true,
    },
    {
      name: "quantity",
      placeholder: "e.g. 300",
      label: "Quantity",
      htmlElement: "Quantity",
      style: OutlinedInputStyle,
      required: true,
      options: [],
      htmlOption: 0,
      tooltip: false,
      tooltipMessage:
        "This is the quantity from starting serial number and ending serial number.",
      displayField: true,
    },
    {
      name: "ownership",
      placeholder: "e.g. Permanent",
      label: "Ownership status of item",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: options,
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "Date when the leased equipment will be returned.",
      displayField: true,
    },
    {
      name: "",
      placeholder: "",
      label: "Returning date",
      htmlElement: "Day",
      style: OutlinedInputStyle,
      required: true,
      options: options,
      htmlOption: 2,
      tooltip: true,
      tooltipMessage: "Date when the leased equipment will be returned.",
      displayField: true,
    },
    {
      name: "enableAssignFeature",
      placeholder: "",
      label: "Is it assignable to staff/events?",
      htmlElement: "",
      style: OutlinedInputStyle,
      required: true,
      options: ["Enabled", "Disabled"],
      htmlOption: 0,
      tooltip: true,
      tooltipMessage: "Select if the device is assignable to staff or events.",
      displayField: true,
    },
    {
      name: "image_uploader",
      placeholder: "",
      label: "Image uploader",
      htmlElement: "Day",
      style: OutlinedInputStyle,
      required: true,
      options: [],
      htmlOption: 6,
      tooltip: false,
      tooltipMessage: null,
      displayField: true,
    },
    {
      name: "descript_item",
      placeholder:
        "Please provide a brief description of the new device to be added.",
      label: "Description of the device",
      htmlElement: "TextArea",
      style: OutlinedInputStyle,
      required: true,
      options: options,
      htmlOption: 4,
      tooltip: true,
      tooltipMessage: "Date when the leased equipment will be returned.",
      displayField: true,
    },
  ];

  return fields;
};
