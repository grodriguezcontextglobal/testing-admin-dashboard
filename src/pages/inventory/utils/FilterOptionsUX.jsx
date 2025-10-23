import { Icon } from "@iconify/react/dist/iconify.js";
import { Select } from "antd";
import { dicSelectedOptions } from "./dicSelectedOptions";

const FilterOptionsUX = ({ filterOptions = {}, chosen, setChosen }) => {
  return (
    <div style={{ display:"grid", width:"100%", gap:"8px", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))" }}>
      {new Array(6).fill(null).map((_, index) => {
        return (
            <Select
              style={{
                margin: "0 5px 0 0",
                width: "100%",
                // overflowY: "hidden",
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
              // Remove indentation for option content via custom overlay class
              popupClassName="no-indent-options"
              // Make sure option label is used and rendered flat
              optionLabelProp="label"
              value={chosen.category === index ? chosen.value : undefined}
              options={[
                ...filterOptions[index].map((item) => ({
                  value: item,
                  label: (
                    <div
                      style={{
                        width: "100%",
                        padding: 0,
                        margin: 0,
                        textIndent: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      {item}
                    </div>
                  ),
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
    </div>
  );
};

export default FilterOptionsUX;
