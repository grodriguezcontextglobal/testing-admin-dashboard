import { Icon } from "@iconify/react/dist/iconify.js";
import { Select } from "antd";
import { dicSelectedOptions } from "./dicSelectedOptions";
import { useMemo, useCallback, memo, useContext } from "react";
import { FilterOptionsContext } from "../MainPage";

const FilterOptionsUX = memo(function FilterOptionsUX({
  // filterOptions = {},
  // chosen,
  setChosen,
}) {
  const filterOptionsValues = useContext(FilterOptionsContext)
  // Helper: current value for a specific category
  const getCurrentValue = useCallback(
    (categoryIndex) => {
      if (!Array.isArray(filterOptionsValues?.chosen)) return undefined;
      const filter = filterOptionsValues?.chosen?.find((item) => item.category === categoryIndex);
      return filter ? filter.value : undefined;
    },
    [filterOptionsValues?.chosen]
  );

  // Update chosen filters (guard against redundant updates)
  const updateChosenFilters = useCallback(
    (categoryIndex, value) => {
      if (!Array.isArray(filterOptionsValues.chosen)) {
        const nextChosen =
          value == null ? [] : [{ category: categoryIndex, value }];
        setChosen(nextChosen);
        return;
      }

      if (value == null) {
        const newChosen = filterOptionsValues.chosen.filter(
          (item) => item.category !== categoryIndex
        );
        if (newChosen.length === filterOptionsValues.chosen.length) return; // no change
        setChosen(newChosen);
      } else {
        const existingIndex = filterOptionsValues.chosen.findIndex(
          (item) => item.category === categoryIndex
        );
        if (existingIndex >= 0) {
          if (filterOptionsValues.chosen[existingIndex].value === value) return; // no change
          const newChosen = [...filterOptionsValues.chosen];
          newChosen[existingIndex] = { category: categoryIndex, value };
          setChosen(newChosen);
        } else {
          setChosen([...filterOptionsValues.chosen, { category: categoryIndex, value }]);
        }
      }
    },
    [filterOptionsValues?.chosen, setChosen]
  );

  // Memoize options list for each select
  const selectOptionsByIndex = useMemo(() => {
    return new Array(7).fill(null).map((_, index) => {
      const opts = Array.isArray(filterOptionsValues.filterOptions[index])
        ? filterOptionsValues.filterOptions[index]
        : [];
      return opts.map((item) => {
        return {
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
        };
      });
    });
  }, [filterOptionsValues.filterOptions]);

  return (
    <div
      style={{
        display: "grid",
        width: "100%",
        gap: "8px",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      }}
    >
      {new Array(7).fill(null).map((_, index) => {
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
            placeholder={
              dicSelectedOptions[index] !== "Serial Number"
                ? null
                : "Type or scan"
            }
          />
        );
      })}
    </div>
  );
});

export default FilterOptionsUX;
