import { Icon } from "@iconify/react/dist/iconify.js";
import { Select } from "antd";
import { dicSelectedOptions } from "./dicSelectedOptions";

const FilterOptionsUX = ({ filterOptions = {}, chosen, setChosen }) => {
  // Helper function to get current value for a specific category
  const getCurrentValue = (categoryIndex) => {
    if (!Array.isArray(chosen)) return undefined;
    const filter = chosen.find(item => item.category === categoryIndex);
    return filter ? filter.value : undefined;
  };

  // Helper function to update chosen filters
  const updateChosenFilters = (categoryIndex, value) => {
    if (!Array.isArray(chosen)) {
      // Initialize as array if not already
      setChosen(value == null ? [] : [{ category: categoryIndex, value }]);
      return;
    }

    if (value == null) {
      // Remove filter for this category
      const newChosen = chosen.filter(item => item.category !== categoryIndex);
      setChosen(newChosen);
    } else {
      // Add or update filter for this category
      const existingIndex = chosen.findIndex(item => item.category === categoryIndex);
      if (existingIndex >= 0) {
        // Update existing filter
        const newChosen = [...chosen];
        newChosen[existingIndex] = { category: categoryIndex, value };
        setChosen(newChosen);
      } else {
        // Add new filter
        setChosen([...chosen, { category: categoryIndex, value }]);
      }
    }
  };

  return (
    <div style={{ display:"grid", width:"100%", gap:"8px", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))" }}>
      {new Array(6).fill(null).map((_, index) => {
        const currentValue = getCurrentValue(index);
        
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
              value={currentValue}
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
                updateChosenFilters(index, null);
              }}
              onChange={(value) => {
                // Prevent redundant state updates that can cause render loops
                if (value === currentValue) {
                  return;
                }

                updateChosenFilters(index, value);
              }}
              virtual={true}
            />
        );
      })}
    </div>
  );
};

export default FilterOptionsUX;
