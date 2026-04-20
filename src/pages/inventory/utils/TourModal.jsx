import { Button, Space, Tooltip, Typography } from "antd";
import { useRef } from "react";
import TourModals from "../../../components/UX/tours/TourModals";
import { DownloadOutlined } from "@ant-design/icons";
import { utils, writeFile } from "xlsx";

const { Text } = Typography;

const TourModal = ({ open, setOpen }) => {
  // Refs for individual column headers
  const categoryRef = useRef(null);
  const itemGroupRef = useRef(null);
  const costRef = useRef(null);
  const brandRef = useRef(null);
  const descriptionRef = useRef(null);
  const ownershipRef = useRef(null);
  const mainWarehouseRef = useRef(null);
  const serialNumberRef = useRef(null);
  const warehouseRef = useRef(null);
  const companyRef = useRef(null);
  const locationRef = useRef(null);
  const extraInfoRef = useRef(null);
  const imageRef = useRef(null);
  const statusRef = useRef(null);
  const containerItemsRef = useRef(null);
  const returnedRentedInfoRef = useRef(null);
  const subLocationRef = useRef(null);
  const supplierInfoRef = useRef(null);

  // Helper to attach ref to the header cell
  const attachRef = (ref) => () => ({ ref });
  const columns = [
    {
      title: <Text type="danger">Category*</Text>,
      dataIndex: "category_name",
      key: "category_name",
      width: 150,
      onHeaderCell: attachRef(categoryRef),
    },
    {
      title: <Text type="danger">Device Name*</Text>,
      dataIndex: "item_group",
      key: "item_group",
      width: 180,
      onHeaderCell: attachRef(itemGroupRef),
    },
    {
      title: <Text type="danger">Cost*</Text>,
      dataIndex: "cost",
      key: "cost",
      width: 100,
      onHeaderCell: attachRef(costRef),
    },
    {
      title: <Text type="danger">Brand*</Text>,
      dataIndex: "brand",
      key: "brand",
      width: 120,
      onHeaderCell: attachRef(brandRef),
    },
    {
      title: <Text type="danger">Description*</Text>,
      dataIndex: "descript_item",
      key: "descript_item",
      width: 200,
      onHeaderCell: attachRef(descriptionRef),
    },
    {
      title: <Text type="danger">Ownership*</Text>,
      dataIndex: "ownership",
      key: "ownership",
      width: 120,
      onHeaderCell: attachRef(ownershipRef),
    },
    {
      title: <Text type="danger">Main Warehouse*</Text>,
      dataIndex: "main_warehouse",
      key: "main_warehouse",
      width: 160,
      onHeaderCell: attachRef(mainWarehouseRef),
    },
    {
      title: <Text type="danger">Serial Number*</Text>,
      dataIndex: "serial_number",
      key: "serial_number",
      width: 150,
      onHeaderCell: attachRef(serialNumberRef),
    },
    {
      title: <Text type="danger">Warehouse*</Text>,
      dataIndex: "warehouse",
      key: "warehouse",
      width: 150,
      onHeaderCell: attachRef(warehouseRef),
    },
    {
      title: <Text type="danger">Company*</Text>,
      dataIndex: "company",
      key: "company",
      width: 150,
      onHeaderCell: attachRef(companyRef),
    },
    {
      title: <Text type="danger">Location*</Text>,
      dataIndex: "location",
      key: "location",
      width: 150,
      onHeaderCell: attachRef(locationRef),
    },
    {
      title: <Text type="danger">Extra Info*</Text>,
      dataIndex: "extra_serial_number",
      key: "extra_serial_number",
      width: 180,
      onHeaderCell: attachRef(extraInfoRef),
    },
    {
      title: <Text type="danger">Image*</Text>,
      dataIndex: "image_url",
      key: "image_url",
      width: 150,
      onHeaderCell: attachRef(imageRef),
    },
    {
      title: <Text type="danger">Status*</Text>,
      dataIndex: "status",
      key: "status",
      width: 120,
      onHeaderCell: attachRef(statusRef),
    },
    {
      title: <Text type="danger">Return Date*</Text>,
      dataIndex: "returnedRentedInfo",
      key: "returnedRentedInfo",
      width: 150,
      onHeaderCell: attachRef(returnedRentedInfoRef),
    },
    {
      title: <Text type="danger">Sub Locations*</Text>,
      dataIndex: "sub_location",
      key: "sub_location",
      width: 150,
      onHeaderCell: attachRef(subLocationRef),
    },
    {
      title: <Text type="danger">Supplier Info*</Text>,
      dataIndex: "supplier_info",
      key: "supplier_info",
      width: 150,
      onHeaderCell: attachRef(supplierInfoRef),
    },
  ];

  const dataSource = [
    {
      key: "1",
      category_name: "Electronics",
      item_group: "Intel i750",
      cost: "750.00",
      brand: "Samsung",
      descript_item: "High perf processor",
      ownership: "Owned",
      main_warehouse: "Washington, DC",
      serial_number: "SN123456",
      warehouse: "Washington, DCYes",
      company: "MyCompany",
      location: "Warehouse",
      extra_serial_number: "Material: Silicon",
      image_url: "http://example.com/img.png",
      status: "Operational",
      returnedRentedInfo: "null",
      sub_location: "[]",
      supplier_info: "TechCorp",
    },
  ];

  const steps = [
    {
      title: "Category",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
        </Space>
      ),
      target: () => categoryRef.current,
    },
    {
      title: "Device Name",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>A descriptive name for the item, e.g., &apos;iPhone 13 Pro&apos;.</Text>
        </Space>
      ),
      target: () => itemGroupRef.current,
    },
    {
      title: "Cost",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>The cost of the item. Should be a number, e.g., 750.00.</Text>
          <Text type="secondary">Default: 0</Text>
        </Space>
      ),
      target: () => costRef.current,
    },
    {
      title: "Brand",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>The brand of the item, e.g., &apos;Apple&apos;, &apos;Samsung&apos;.</Text>
        </Space>
      ),
      target: () => brandRef.current,
    },
    {
      title: "Description",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>A detailed description of the item.</Text>
        </Space>
      ),
      target: () => descriptionRef.current,
    },
    {
      title: "Ownership",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>e.g., &apos;Owned&apos;, &apos;Rent&apos;.</Text>
          <Text type="secondary">Values: &ldquo;Owned&ldquo;, &ldquo;Rent&ldquo;</Text>
        </Space>
      ),
      target: () => ownershipRef.current,
    },
    {
      title: "Main Warehouse",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>
            Location where item will be deductable for taxes, e.g., &apos;New York,.
          </Text>
        </Space>
      ),
      target: () => mainWarehouseRef.current,
    },
    {
      title: "Serial Number",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>The unique serial number of the item.</Text>
        </Space>
      ),
      target: () => serialNumberRef.current,
    },
    {
      title: "Warehouse",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>
            Indicates if the item is currently in a warehouse. e.g. &apos;Yes&apos; or
            &apos;No&apos;.
          </Text>
        </Space>
      ),
      target: () => warehouseRef.current,
    },
    {
      title: "Company",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>The company that owns the item.</Text>
        </Space>
      ),
      target: () => companyRef.current,
    },
    {
      title: "Location",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>
            The specific location within the warehouse, e.g., &apos;New York,.
          </Text>
        </Space>
      ),
      target: () => locationRef.current,
    },
    {
      title: "Extra Info",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>Any additional information about the item.</Text>
          <Text>
            Possible names: extra information, extra info, more details, extra
            details, details
          </Text>
        </Space>
      ),
      target: () => extraInfoRef.current,
    },
    {
      title: "Image",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>A URL to an image of the item.</Text>
        </Space>
      ),
      target: () => imageRef.current,
    },
    {
      title: "Status",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>
            The current status of the item, e.g., &apos;Operational&apos;, &apos;In Repair&apos;.
          </Text>
          <Text type="secondary">Default: &ldquo;Operational&ldquo;</Text>
        </Space>
      ),
      target: () => statusRef.current,
    },
    {
      title: "Container Items",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>

          <Text type="secondary">Default: []</Text>
        </Space>
      ),
      target: () => containerItemsRef.current,
    },
    {
      title: "Return Date",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>The date the item is expected to be returned (if rented).</Text>
          <Text>
            Possible names: return date, date returning, expected return,
            expected returning date
          </Text>
          <Text type="secondary">Default: null</Text>
        </Space>
      ),
      target: () => returnedRentedInfoRef.current,
    },
    {
      title: "Sub Locations",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>Any sub-locations where the item might be stored.</Text>
          <Text type="secondary">Default: []</Text>
        </Space>
      ),
      target: () => subLocationRef.current,
    },
    {
      title: "Supplier Info",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>
            Information about the supplier if the item is rented.
          </Text>
          <Text>
            Possible names: supplier information, supplier, rental company
            information
          </Text>
          <Text type="secondary">Default: null</Text>
        </Space>
      ),
      target: () => supplierInfoRef.current,
    },
  ];
  const tourData = [
    {
      "Category": "Audio",
      "Device Name": "Audio Device 1",
      "Cost": "45.5",
      "Brand": "Sony",
      "Description": "Audio Device 1 used for events and rentals",
      "Ownership": "Rent",
      "Main Warehouse": "Miami, FL",
      "Serial Number": "100001",
      "Warehouse": true,
      "Company": "ABC Interpreting",
      "Location": "Miami, FL",
      "Extra Info": "",
      "Image": "",
      "Status": "Operational",
      "Return Date": "2026-05-01 12:00:00",
      "Sub Locations": "Section A, Locker A105",
      "Supplier Info": "Rental Equipment LLC"
    },
    {
      "Category": "Interpretation",
      "Device Name": "PL6 RF Receiver",
      "Cost": "99.0",
      "Brand": "Congress Audio",
      "Description": "Receiver used for interpretation events 70-75 MHz",
      "Ownership": "Permanent",
      "Main Warehouse": "Fort Lauderdale, FL",
      "Serial Number": "100002",
      "Warehouse": false,
      "Company": "ABC Interpreting",
      "Location": "Orlando, FL",
      "Extra Info": "",
      "Image": "",
      "Status": "Operational",
      "Return Date": "2026-05-10 15:30:00",
      "Sub Locations": "Section B, Locker B203",
      "Supplier Info": ""
    },
    {
      "Category": "Fitness",
      "Device Name": "C4 Pre Workout",
      "Cost": "25.75",
      "Brand": "Cellucor",
      "Description": "Pre workout supplement for fitness events",
      "Ownership": "Rent",
      "Main Warehouse": "Miami, FL",
      "Serial Number": "100003",
      "Warehouse": true,
      "Company": "ABC Interpreting",
      "Location": "Miami, FL",
      "Extra Info": "",
      "Image": "",
      "Status": "Operational",
      "Return Date": "2026-05-15 10:00:00",
      "Sub Locations": "",
      "Supplier Info": "Rental Equipment LLC"
    }
  ];

  const handleDownloadTemplate = () => {
    // eslint-disable-next-line no-unused-vars
    const dataToExport = tourData.map(({ key, ...rest }) => rest);
    const ws = utils.json_to_sheet(dataToExport);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Template");
    writeFile(wb, "Inventory_Template.xlsx");
  };

  return (
    <TourModals
      open={open}
      setOpen={setOpen}
      title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>Inventory Import Template Guide</span>
        <Tooltip title="Download Template">
          <Button
            type="primary"
            shape="circle"
            icon={<DownloadOutlined />}
            onClick={handleDownloadTemplate}
            size="small"
          />
        </Tooltip>
      </div>}
      description={
        <>
          This tour guides you through the expected structure of your Excel
          (.xlsx) file.
          <Text type="danger"> Red headers</Text> indicate mandatory fields.
          Follow the tour for details on accepted column names (aliases).
        </>
      }
      columns={columns}
      dataSource={dataSource}
      steps={steps}
      width={3000}
    />
  );
};

export default TourModal;
