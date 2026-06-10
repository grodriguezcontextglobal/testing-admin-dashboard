import { logisticStatusConfig } from "./logisticStatusConfig";

// Build label lookup from config. Also map hyphen variants for legacy data.
const buildDictionary = () => {
  const dict = {};
  for (const [key, { label }] of Object.entries(logisticStatusConfig)) {
    dict[key] = label;
    dict[key.replace(/_/g, "-")] = label;
  }
  return dict;
};

export const warehouseDicStatus = buildDictionary();
