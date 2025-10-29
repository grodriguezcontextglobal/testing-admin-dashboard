import { Icon } from "@iconify/react/dist/iconify.js";
import { Select } from "antd";
import { dicSelectedOptions } from "./dicSelectedOptions";
import { useMemo, useCallback, memo } from "react";

const FilterOptionsUX = memo(function FilterOptionsUX({
  filterOptions = {},
  chosen,
  setChosen,
}) {
  // Helper: current value for a specific category
  const getCurrentValue = useCallback(
    (categoryIndex) => {
      if (!Array.isArray(chosen)) return undefined;
      const filter = chosen.find((item) => item.category === categoryIndex);
      return filter ? filter.value : undefined;
    },
    [chosen]
  );

  // Update chosen filters (guard against redundant updates)
  const updateChosenFilters = useCallback(
    (categoryIndex, value) => {
      if (!Array.isArray(chosen)) {
        const nextChosen =
          value == null ? [] : [{ category: categoryIndex, value }];
        setChosen(nextChosen);
        return;
      }

      if (value == null) {
        const newChosen = chosen.filter(
          (item) => item.category !== categoryIndex
        );
        if (newChosen.length === chosen.length) return; // no change
        setChosen(newChosen);
      } else {
        const existingIndex = chosen.findIndex(
          (item) => item.category === categoryIndex
        );
        if (existingIndex >= 0) {
          if (chosen[existingIndex].value === value) return; // no change
          const newChosen = [...chosen];
          newChosen[existingIndex] = { category: categoryIndex, value };
          setChosen(newChosen);
        } else {
          setChosen([...chosen, { category: categoryIndex, value }]);
        }
      }
    },
    [chosen, setChosen]
  );

  // Memoize options list for each select
  const selectOptionsByIndex = useMemo(() => {
    return new Array(6).fill(null).map((_, index) => {
      const opts = Array.isArray(filterOptions[index])
        ? filterOptions[index]
        : [];
      return opts.map((item) => ({
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
            {/* <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "Inter, sans-serif",
              }}
            > */}
              {item}
            {/* </p> */}
          </div>
        ),
      }));
    });
  }, [filterOptions]);

  return (
    <div
      style={{
        display: "grid",
        width: "100%",
        gap: "8px",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      }}
    >
      {new Array(6).fill(null).map((_, index) => {
        const currentValue = getCurrentValue(index);

        const onChange = (value) => {
          if (value === currentValue) return;
          updateChosenFilters(index, value);
        };

        const onClear = () => {
          if (currentValue == null) return;
          updateChosenFilters(index, null);
        };

        return (
          <Select
            style={{
              margin: "0 5px 0 0",
              width: "100%",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
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
            popupClassName="no-indent-options"
            optionLabelProp="label"
            value={currentValue}
            options={selectOptionsByIndex[index]}
            allowClear
            onClear={onClear}
            onChange={onChange}
            showSearch
            optionFilterProp="value"
            filterOption={(input, option) => {
              const val = (option?.value ?? "").toString();
              return val
                .toLowerCase()
                .includes((input ?? "").trim().toLowerCase());
            }}
            virtual={true}
            placeholder="Type or scan"
          />
        );
      })}
    </div>
  );
});

export default FilterOptionsUX;
