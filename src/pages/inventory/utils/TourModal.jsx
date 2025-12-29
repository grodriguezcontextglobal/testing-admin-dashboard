import { Space, Typography } from "antd";
import { useRef } from "react";
import TourModals from "../../../components/UX/tours/TourModals";

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
  const containerRef = useRef(null);
  const containerCapacityRef = useRef(null);
  const imageRef = useRef(null);
  const statusRef = useRef(null);
  const assignableRef = useRef(null);
  const containerItemsRef = useRef(null);
  const isStoredInContainerRef = useRef(null);
  const containerIdRef = useRef(null);
  const displayItemRef = useRef(null);
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
      title: <Text type="danger">Container*</Text>,
      dataIndex: "container",
      key: "container",
      width: 120,
      onHeaderCell: attachRef(containerRef),
    },
    {
      title: <Text type="danger">Container Capacity*</Text>,
      dataIndex: "containerSpotLimit",
      key: "containerSpotLimit",
      width: 160,
      onHeaderCell: attachRef(containerCapacityRef),
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
      title: <Text type="danger">Assignable*</Text>,
      dataIndex: "enableAssignFeature",
      key: "enableAssignFeature",
      width: 120,
      onHeaderCell: attachRef(assignableRef),
    },
    {
      title: <Text type="danger">Container Items*</Text>,
      dataIndex: "container_items",
      key: "container_items",
      width: 150,
      onHeaderCell: attachRef(containerItemsRef),
    },
    {
      title: <Text type="danger">Stored in Container?*</Text>,
      dataIndex: "isItInContainer",
      key: "isItInContainer",
      width: 150,
      onHeaderCell: attachRef(isStoredInContainerRef),
    },
    {
      title: <Text type="danger">Container ID*</Text>,
      dataIndex: "container_id",
      key: "container_id",
      width: 120,
      onHeaderCell: attachRef(containerIdRef),
    },
    {
      title: <Text type="danger">Display Item*</Text>,
      dataIndex: "display_item",
      key: "display_item",
      width: 120,
      onHeaderCell: attachRef(displayItemRef),
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
      warehouse: "Washington, DC",
      company: "MyCompany",
      location: "Shelf A",
      extra_serial_number: "Material: Silicon",
      container: "0",
      containerSpotLimit: "0",
      image_url: "http://example.com/img.png",
      status: "Operational",
      enableAssignFeature: "1",
      container_items: "[]",
      isItInContainer: "0",
      container_id: "null",
      display_item: "1",
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
          
        </Space>
      ),
      target: () => itemGroupRef.current,
    },
    {
      title: "Cost",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
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
          
        </Space>
      ),
      target: () => brandRef.current,
    },
    {
      title: "Description",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
        </Space>
      ),
      target: () => descriptionRef.current,
    },
    {
      title: "Ownership",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
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
          
        </Space>
      ),
      target: () => mainWarehouseRef.current,
    },
    {
      title: "Serial Number",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
        </Space>
      ),
      target: () => serialNumberRef.current,
    },
    {
      title: "Warehouse",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
        </Space>
      ),
      target: () => warehouseRef.current,
    },
    {
      title: "Company",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
        </Space>
      ),
      target: () => companyRef.current,
    },
    {
      title: "Location",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
        </Space>
      ),
      target: () => locationRef.current,
    },
    {
      title: "Extra Info",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>
            Possible names: extra information, extra info, more details, extra
            details, details
          </Text>
        </Space>
      ),
      target: () => extraInfoRef.current,
    },
    {
      title: "Container",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
          <Text type="secondary">Default: 0</Text>
        </Space>
      ),
      target: () => containerRef.current,
    },
    {
      title: "Container Capacity",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>
            Possible names: container limit, limit, capacity, container capacity
          </Text>
          <Text type="secondary">Default: 0</Text>
        </Space>
      ),
      target: () => containerCapacityRef.current,
    },
    {
      title: "Image",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
        </Space>
      ),
      target: () => imageRef.current,
    },
    {
      title: "Status",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
          <Text type="secondary">Default: &ldquo;Operational&ldquo;</Text>
        </Space>
      ),
      target: () => statusRef.current,
    },
    {
      title: "Assignable",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
          <Text type="secondary">Default: 1</Text>
        </Space>
      ),
      target: () => assignableRef.current,
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
      title: "Stored in Container?",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          <Text>
            Possible names: is it in a container, is it store inside a container
          </Text>
          <Text type="secondary">Default: 0</Text>
        </Space>
      ),
      target: () => isStoredInContainerRef.current,
    },
    {
      title: "Container ID",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
          <Text type="secondary">Default: null</Text>
        </Space>
      ),
      target: () => containerIdRef.current,
    },
    {
      title: "Display Item",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
          
          <Text type="secondary">Default: 1</Text>
        </Space>
      ),
      target: () => displayItemRef.current,
    },
    {
      title: "Return Date",
      description: (
        <Space direction="vertical">
          <Text strong>Mandatory Field</Text>
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
            Possible names: supplier information, supplier, rental company
            information
          </Text>
          <Text type="secondary">Default: null</Text>
        </Space>
      ),
      target: () => supplierInfoRef.current,
    },
  ];

  return (
    <TourModals
      open={open}
      setOpen={setOpen}
      title="Inventory Import Template Guide"
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
