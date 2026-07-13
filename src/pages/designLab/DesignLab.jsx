/**
 * Design Lab — internal page for previewing Untitled UI components/tokens.
 * Reconstructed as a placeholder after the original was lost to a OneDrive
 * sync failure (original kept as DesignLab.jsx.onedrive-dead).
 */
const swatches = [
  ["gray", ["25", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900"]],
  ["brand", ["50", "100", "300", "500", "600", "700"]],
  ["action", ["50", "100", "300", "500", "600", "700"]],
  ["error", ["50", "100", "300", "500", "600", "700"]],
  ["warning", ["50", "200", "500", "600", "700"]],
  ["success", ["50", "200", "500", "600", "700"]],
];

const DesignLab = () => (
  <div style={{ padding: 32, fontFamily: "Inter, sans-serif", textAlign: "left" }}>
    <h1 style={{ color: "var(--gray-900)", fontSize: 24, marginBottom: 4 }}>Design Lab</h1>
    <p style={{ color: "var(--gray-500)", marginBottom: 24 }}>
      Token preview (placeholder page — the original Design Lab file is being restored).
    </p>
    {swatches.map(([name, steps]) => (
      <div key={name} style={{ marginBottom: 16 }}>
        <div style={{ color: "var(--gray-600)", fontSize: 13, marginBottom: 6 }}>{name}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {steps.map((s) => (
            <div key={s} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 40,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--gray-200)",
                  background: `var(--${name}-${s})`,
                }}
              />
              <span style={{ fontSize: 11, color: "var(--gray-500)" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default DesignLab;
