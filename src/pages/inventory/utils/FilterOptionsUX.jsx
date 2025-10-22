import { Icon } from "@iconify/react/dist/iconify.js";
import { Select, Space } from "antd";
import TextFontsize18LineHeight28 from "../../../styles/global/TextFontSize18LineHeight28";
import { dicSelectedOptions } from "./dicSelectedOptions";

const FilterOptionsUX = ({ filterOptions = {}, chosen, setChosen }) => {
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
      <Space size={[8, 16]} wrap style={{ width: "100%" }}>
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
              value={chosen.category === index ? chosen.value : undefined}
              options={[
                ...filterOptions[index].map((item) => ({
                  value: item,
                  label: item,
                })),
              ]}
              allowClear
              onClear={() => {
                if (chosen.category === null && chosen.value === null) return;
                setChosen({ category: null, value: null });
              }}
              onChange={(value) => {
                const next =
                  value == null
                    ? { category: null, value: null }
                    : { category: index, value };

                // Prevent redundant state updates that can cause render loops
                if (
                  next.category === chosen.category &&
                  next.value === chosen.value
                ) {
                  return;
                }

                setChosen(next);
              }}
            />
          );
        })}
      </Space>
    </div>
  );
};

export default FilterOptionsUX;
