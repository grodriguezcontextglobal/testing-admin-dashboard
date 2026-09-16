import { Icon } from "@iconify/react/dist/iconify.js";
import { Select } from "antd";
import { dicSelectedOptions } from "./dicSelectedOptions";
import { getLogisticStatusLabel } from "./logisticStatusConfig";
import { useMemo, useCallback, memo, useContext } from "react";
import { FilterOptionsContext } from "../MainPage";
// import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
// import LightBlueButtonComponent from "../../../components/UX/buttons/LigthBlueButton";
// The Status labels come from logisticStatusConfig, the same twenty entries the
// table column reads. There used to be a hand-written map of seven here, and a
// status outside those seven rendered as an option with no text at all — a row
// the user could pick but not read. Rare while the options were grouped out of
// the rows already loaded; not rare once the server's facets started returning
// every status in the company.

const FilterOptionsUX = memo(function FilterOptionsUX({
  // filterOptions = {},
  // chosen,
  setChosen,
  // setOpenAdvanceSearchModal,
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

  // The categories that still exist, in order. Driven by the dictionary rather
  // than by a fixed count: index 6 (Staff member) was removed and its index
  // left empty on purpose, so counting from 0 would render a select with no
  // label and no options.
  const categories = useMemo(
    () => Object.keys(dicSelectedOptions).map(Number),
    [],
  );

  // Memoize options list for each select
  const selectOptionsByIndex = useMemo(() => {
    const byIndex = {};
    for (const index of categories) {
      const opts = Array.isArray(filterOptionsValues?.filterOptions[index])
        ? filterOptionsValues?.filterOptions[index]
        : [];
      byIndex[index] = opts.map((item) => {
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
              {index === 7 ? getLogisticStatusLabel(item) : item}
            </div>
          ),
        };
      });
    }
    return byIndex;
  }, [filterOptionsValues?.filterOptions, categories]);

  return (
    // <div style={{ width:"100%", alignSelf:"flex-start", height:"100%"}}>
      <div
        style={{
          display: "grid",
          width: "100%",
          gap: "8px",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {categories.map((index) => {
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
    // </div>
  );
});

export default FilterOptionsUX;
