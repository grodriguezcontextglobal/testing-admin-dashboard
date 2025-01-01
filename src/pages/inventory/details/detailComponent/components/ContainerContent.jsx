import { Grid, InputAdornment, OutlinedInput } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, Divider, message, Modal, Pagination, Space } from "antd";
import { groupBy } from "lodash";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { TrashIcon } from "../../../../../components/icons/TashIcon";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { useLocation } from "react-router-dom";

const ContainerContent = ({ openModal, setOpenModal, containerInfo }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [current, setCurrent] = useState(1);
  const { user } = useSelector((state) => state.admin);
  const [itemToContent, setItemToContent] = useState(containerInfo?.container_items ?? []);
  const { register, watch, setValue } = useForm();
      // const itemsInInventoryQuery = useQuery({
  //   queryKey: ["listOfItemsInStock"],
  //   queryFn: () =>
  //     devitrakApi.get(
  //       `/db_item/check-inventory?company_id=${user.sqlInfo.company_id}`
  //     ),
  //   refetchOnMount: false,
  // });
  const itemsInInventoryQuery = useQuery({
    queryKey: ["retrievingItemsInInventoryQuery"],
    queryFn: () =>
      devitrakApi.post(
        `/db_item/warehouse-items`,{
          company_id: user.sqlInfo.company_id,
          warehouse: true,
          enableAssignFeature: true,
        }
      ),
    refetchOnMount: false,
  });
  const location = useLocation();
  const searchParams = String(location.search).split("=")[1];
  const closeModal = () => {
    setOpenModal(false);
  };

  useEffect(() => {
    const controller = new AbortController();
    itemsInInventoryQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  if (itemsInInventoryQuery.data) {
    let dataToIterate = itemsInInventoryQuery.data.data.items //result;
    const groupingByWarehouse = groupBy(dataToIterate, "warehouse");
    const groupingByItemGroup = groupBy(groupingByWarehouse[1], "item_group");
    const renderingOptions = () => {
      let finalResult = [];
      if (dataToIterate.length > 0) {
        for (let [key, value] of Object.entries(groupingByItemGroup)) {
          finalResult = [
            ...finalResult,
            { key: key, value: JSON.stringify(value) },
          ];
        }
      }
      return finalResult;
    };

    const renderingItems = () => {
      let result = [];
      if (selectedItem?.length > 0) {
        const value = JSON.parse(selectedItem);
        const sortedData = groupBy(value, "serial_number");
        for (let [key, value] of Object.entries(sortedData)) {
          result = [
            ...result,
            {
              key: key,
              value: value,
            },
          ];
        }
      }
      return result;
    };

    const renderingLimitedUnits = () => {
      const start = (current - 1) * 50;
      const end = start + 50;
      return renderingItems().slice(start, end);
    };

    const renderingUnits = () => {
      const checking = watch("search");
      if (
        checking?.length > 0 &&
        checking?.length === renderingItems()[0].key.length
      ) {
        return renderingItems().filter((item) =>
          String(item.key).toLowerCase().includes(watch("search").toLowerCase())
        );
      }
      return renderingLimitedUnits();
    };

    const renderingTitle = () => {
      let result;
      if (selectedItem.length > 0) {
        const value = JSON.parse(selectedItem);
        result = value[0].item_group;
      }
      return result;
    };

    const handleAddRemoveItem = (props) => {
      let adding = [];
      if (itemToContent.some((item) => item.serial_number === props.key)) {
        adding = [
          ...itemToContent.filter((item) => item.serial_number !== props.key),
        ];
      } else {
        adding = [
          ...itemToContent,
          { serial_number: props.key, ...props.value[0] },
        ];
      }
      return setItemToContent(adding);
    };

    const onChange = (page) => {
      setCurrent(page);
    };

    const checkingIfItemWasAdded = groupBy(itemToContent, "serial_number");

    const savingItemsInContainer = async () => {
      try {
        const content = itemToContent.map((item) => {
          return {
            serial_number: item.serial_number,
            item_id: item.item_id,
          };
        });
        const response = await devitrakApi.post(
          `/db_company/update-content-in-container`,
          {
            item_id: searchParams,
            container_items: JSON.stringify(content),
            ref: JSON.stringify(containerInfo?.container_items),
          }
        );
        if (response.data) message.success("Item was successfully updated");
        return closeModal();
      } catch (error) {
        message.error("Something went wrong");
      }
    };

    return (
      <Modal
        open={openModal}
        onCancel={closeModal}
        footer={[]}
        centered
        maskClosable={false}
        title="Add/Update content."
        width={1000}
      >
        <Grid
          display={"flex"}
          justifyContent={"flex-start"}
          alignItems={"center"}
          gap={1}
          container
        >
          {renderingOptions()?.map((item) => {
            return (
              <Button
                style={BlueButton}
                key={item.key}
                onClick={() => {
                  setSelectedItem(item.value);
                  setCurrent(1);
                }}
              >
                <p style={{ ...BlueButtonText, ...CenteringGrid }}>
                  {item.key}
                </p>
              </Button>
            );
          })}
        </Grid>
        <Divider />
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          marginY={2}
          gap={1}
          container
        >
          <h2
            style={{
              ...Subtitle,
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            {selectedItem ? renderingTitle() : "No item selected"}
          </h2>
          <div style={{ width: "30%" }}>
            <OutlinedInput
              {...register("search")}
              style={OutlinedInputStyle}
              placeholder="Search here"
              fullWidth
              endAdornment={
                <InputAdornment
                  style={{
                    cursor: "pointer",
                    display:
                      String(watch("search")).length > 0 ? "flex" : "none",
                  }}
                  position="end"
                >
                  <Button
                    style={{
                      margin: 0,
                      padding: 0,
                      width: "fit-content",
                      height: "fit-content",
                      border: "none",
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => setValue("search", "")}
                  >
                    <TrashIcon />
                  </Button>
                </InputAdornment>
              }
            />
          </div>
          <Pagination
            current={current}
            onChange={onChange}
            total={renderingItems().length}
            pageSize={50}
            style={{ margin: "5px 0" }}
            // jumpNextIcon={<RightArrowIcon />}
            // jumpPrevIcon={<LeftArrowIcon />}
            showSizeChanger={false}
            showQuickJumper={false}
          />
          <Divider />
          <Grid
            style={{ height: selectedItem ? "35vh" : 0 }}
            item
            xs={12}
            sm={12}
            md={12}
          >
            <Space style={{ margin: "5px 0" }} size={[8, 16]} wrap>
              {renderingUnits()?.map((item) => {
                return (
                  <Button
                  disabled={item.value[0].display_item === 0 && item.value[0].container_id !== searchParams}
                    style={{
                      ...GrayButton,
                      background:
                        checkingIfItemWasAdded[item.key]?.length > 0
                          ? BlueButton.background
                          : GrayButton.background,
                    }}
                    onClick={() => handleAddRemoveItem(item)}
                    key={item.key}
                  >
                    <p
                      style={{
                        ...GrayButtonText,
                        ...CenteringGrid,
                        color:
                        checkingIfItemWasAdded[item.key]?.length > 0
                            ? BlueButtonText.color
                            : GrayButtonText.color,
                      }}
                    >
                      {item.key}
                    </p>
                  </Button>
                );
              })}
            </Space>
          </Grid>
          <Divider />
          <Grid
            style={{ display: itemToContent?.length > 0 ? "flex" : "none" }}
            justifyContent={"flex-start"}
            alignItems={"center"}
            gap={1}
            item
            xs={12}
            sm={12}
            md={12}
          >
            <Button style={GrayButton} onClick={() => setItemToContent([])}>
              <p style={{ ...GrayButtonText, ...CenteringGrid }}>Cancel</p>
            </Button>
            <Button style={BlueButton} onClick={() => savingItemsInContainer()}>
              <p style={{ ...BlueButtonText, ...CenteringGrid }}>Save</p>
            </Button>
          </Grid>
        </Grid>
      </Modal>
    );
  }
};

export default ContainerContent;
