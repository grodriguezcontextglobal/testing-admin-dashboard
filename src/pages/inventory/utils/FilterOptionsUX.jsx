import { Icon } from "@iconify/react/dist/iconify.js";
import { Select, Space } from "antd";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { dicSelectedOptions } from "./dicSelectedOptions";

const FilterOptionsUX = ({ filterOptions, chosen, setChosen }) => {
  return (
    <div
      style={{
        ...TextFontsize18LineHeight28,
        width: "100%",
        textAlign: "right",
        cursor: "pointer",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <Space size={[8, 16]} wrap styles={{ width: "100%" }}>
        {new Array(6).fill(null).map((_, index) => {
          return (
            <Select
              style={{
                margin: "0 5px 0 0",
                width: "fit-content",
                overflowY: "hidden",
              }}
              key={index}
              title={dicSelectedOptions[index]}
              prefix={dicSelectedOptions[index]}
              suffixIcon={
                <Icon
                  icon="fluent:chevron-down-12-filled"
                  style={{ color: "var(--gray-600, #475467)" }}
                />
              }
              value={chosen.category === index ? chosen.value : null}
              options={[
                ...filterOptions[index].map((item) => ({
                  value: item,
                  label: item,
                })),
              ]}
              allowClear
              onChange={(value) => {
                if (value === undefined || value === null) {
                  return setChosen({
                    category: null,
                    value: null,
                  });
                }
                return setChosen({
                  category: value === null ? null : index,
                  value: value,
                });
              }}
            />
          );
        })}
      </Space>
    </div>
  );
};

export default FilterOptionsUX;
