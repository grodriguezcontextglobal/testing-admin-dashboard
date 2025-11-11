const DisplayDeviceRequestedLegendPerTransaction = ({ record, checked }) => {
  const normalizeType = (s) =>
    String(s || "")
      .trim()
      .replace(/^(event inventory|staff devices)\s*/i, "")
      .trim()
      .toLowerCase();

  const prettyType = (s) =>
    String(s || "")
      .trim()
      .replace(/^(Event Inventory|Staff Devices)\s*/i, "")
      .trim() || "Unknown";

  const requestedAgg = (() => {
    const map = new Map();
    const label = new Map();
    const root = Array.isArray(record?.device) ? record.device : [];
    for (const entry of root) {
      if (Array.isArray(entry?.device)) {
        for (const d of entry.device) {
          const norm = normalizeType(d?.deviceType);
          const qty = Number(d?.deviceNeeded) || 0;
          if (qty > 0) {
            map.set(norm, (map.get(norm) || 0) + qty);
            if (!label.has(norm)) label.set(norm, prettyType(d?.deviceType));
          }
        }
      } else {
        const norm = normalizeType(entry?.deviceType);
        const qty = Number(entry?.deviceNeeded) || 0;
        if (qty > 0) {
          map.set(norm, (map.get(norm) || 0) + qty);
          if (!label.has(norm)) label.set(norm, prettyType(entry?.deviceType));
        }
      }
    }
    return { map, label };
  })();

  const assignedAgg = (() => {
    const map = new Map();
    const arr = Array.isArray(checked) ? checked : [];
    for (const row of arr) {
      const norm = normalizeType(row?.deviceType);
      const isAssigned = row?.status !== false; // count truthy as assigned
      if (isAssigned) {
        map.set(norm, (map.get(norm) || 0) + 1);
      }
    }
    return map;
  })();

  const rows = (() => {
    const keys = new Set([
      ...requestedAgg.map.keys(),
      ...assignedAgg.keys(),
    ]);
    const list = [];
    for (const k of keys) {
      const requested = requestedAgg.map.get(k) || 0;
      const assigned = assignedAgg.get(k) || 0;
      const remaining = Math.max(requested - assigned, 0);
      const name =
        requestedAgg.label.get(k) ||
        // fallback to first letter upper-case of normalized key
        (k ? k.replace(/\b\w/g, (c) => c.toUpperCase()) : "Unknown");
      list.push({ deviceType: name, requested, assigned, remaining });
    }
    return list
      .sort(
        (a, b) =>
          b.requested - a.requested || a.deviceType.localeCompare(b.deviceType)
      );
  })();

  const totalRequested = rows.reduce((sum, r) => sum + r.requested, 0);
  const totalAssigned = rows.reduce((sum, r) => sum + r.assigned, 0);
  const totalRemaining = rows.reduce((sum, r) => sum + r.remaining, 0);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "8px",
        }}
      >
        <h4 style={{ margin: 0 }}>Requested Devices</h4>
        <small style={{ color: "#667085" }}>
          Requested: {totalRequested} • Assigned: {totalAssigned} • Remaining:{" "}
          {totalRemaining}
        </small>
      </div>

      {rows.length === 0 ? (
        <div style={{ fontStyle: "italic", color: "#667085" }}>
          No devices requested
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rows.map(({ deviceType, requested, assigned, remaining }) => (
            <li
              key={deviceType}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 8px",
                border: "1px solid #EAECF0",
                borderRadius: "8px",
                marginBottom: "6px",
                background: "#F9FAFB",
              }}
            >
              <span style={{ fontWeight: 500 }}>{deviceType}</span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span
                  style={{
                    background: "#EEF4FF",
                    color: "#3538CD",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                  title="Requested"
                >
                  Req: {requested}
                </span>
                <span
                  style={{
                    background: "#E7F5ED",
                    color: "#067647",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                  title="Assigned"
                >
                  Asg: {assigned}
                </span>
                <span
                  style={{
                    background: remaining > 0 ? "#FEF3F2" : "#F2F4F7",
                    color: remaining > 0 ? "#B42318" : "#344054",
                    borderRadius: "12px",
                    padding: "2px 8px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                  title="Remaining"
                >
                  Rem: {remaining}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DisplayDeviceRequestedLegendPerTransaction;
