import { useState } from "react";
import { devitrakApi } from "../../api/devitrakApi";

/**
 * Public family portal — "My Devices".
 * Students (adults) or parents/guardians (for minors) look up the devices the
 * school shows as assigned to them: serials, due dates, and return status.
 * Verification: student ID + the responsible party's email on file.
 */
const card = {
  background: "var(--base-white, #fff)",
  border: "1px solid var(--gray-200, #ddded6)",
  borderRadius: "var(--radius-xl, 12px)",
  boxShadow: "var(--shadow-sm)",
  padding: "24px",
  width: "100%",
  textAlign: "left",
};
const label = {
  display: "block",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--gray-700, #454944)",
  margin: "0 0 4px",
};
const input = {
  width: "100%",
  boxSizing: "border-box",
  height: "2.5rem",
  padding: "0 12px",
  borderRadius: "var(--radius-md, 8px)",
  border: "1px solid var(--gray-300, #c6c7bb)",
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  outline: "none",
  background: "var(--base-white, #fff)",
};
const statusChip = (lease) => {
  const base = {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "var(--radius-full, 9999px)",
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    fontWeight: 600,
  };
  if (Number(lease.returned) === 0) {
    const overdue =
      lease.expected_return_date &&
      new Date(lease.expected_return_date).getTime() < Date.now();
    return overdue
      ? { ...base, background: "var(--error-25, #fdf7f5)", border: "1px solid var(--error-300, #e28f75)", color: "var(--error-700, #9a3922)", text: "Overdue — please return" }
      : { ...base, background: "var(--blue-50, #eff8ff)", border: "1px solid var(--blue-200, #b2ddff)", color: "var(--blue-800, #1849a9)", text: "Checked out to you" };
  }
  const map = {
    returned: { background: "var(--success-50, #ecfdf3)", border: "1px solid var(--success-200, #abefc6)", color: "var(--success-700, #067647)", text: "Returned" },
    damaged: { background: "var(--warning-50, #fffaeb)", border: "1px solid var(--warning-200, #fedf89)", color: "var(--warning-700, #b54708)", text: "Returned damaged" },
    lost: { background: "var(--error-25, #fdf7f5)", border: "1px solid var(--error-300, #e28f75)", color: "var(--error-700, #9a3922)", text: "Reported lost" },
  };
  return { ...base, ...(map[lease.return_status] ?? map.returned) };
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");

// million-ignore — Million's block compiler breaks controlled-input onChange
// handlers in this component (same issue as NavigationBarMain's search button).
const MyDevicesPortal = () => {
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const lookup = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await devitrakApi.post(
        "/db_member/my-devices",
        { email, external_id: studentId },
        { headers: { "Content-Type": "application/json" } }
      );
      setResult(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.msg ||
          "No record found for that student ID and email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--gray-50, #f7f7f4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 16px",
        gap: "16px",
      }}
    >
      <div style={{ maxWidth: 640, width: "100%" }}>
        <h1
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "28px",
            lineHeight: "36px",
            fontWeight: 600,
            color: "var(--gray-900, #171d1a)",
            margin: "0 0 4px",
            textAlign: "left",
          }}
        >
          My Devices
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "var(--gray-600, #5d615a)",
            margin: "0 0 16px",
            textAlign: "left",
          }}
        >
          Look up the school equipment assigned to you. Adult students use
          their own email; for students under 18, use the parent/guardian
          email on file with the school.
        </p>

        <form style={card} onSubmit={lookup}>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={label} htmlFor="portal-student-id">Student ID</label>
              <input
                id="portal-student-id"
                style={input}
                placeholder="e.g. STU-2041"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={label} htmlFor="portal-email">Email on file</label>
              <input
                id="portal-email"
                style={input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                height: "2.5rem",
                borderRadius: "var(--radius-md, 8px)",
                border: "none",
                background: "var(--action-600, #155eef)",
                color: "var(--base-white, #fff)",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Looking up…" : "View my devices"}
            </button>
            {error && (
              <p
                role="alert"
                style={{
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: "var(--error-700, #9a3922)",
                }}
              >
                {error}
              </p>
            )}
          </div>
        </form>

        {result?.ok && (
          <div style={{ ...card, marginTop: 16 }}>
            <p
              style={{
                margin: "0 0 2px",
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--gray-900, #171d1a)",
              }}
            >
              {result.member.first_name} {result.member.last_name}
              {result.member.grade ? ` · Grade ${result.member.grade}` : ""}
              {result.member.homeroom ? ` · ${result.member.homeroom}` : ""}
            </p>
            <p
              style={{
                margin: "0 0 16px",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                color: "var(--gray-500, #777b73)",
              }}
            >
              {result.member.minor === 1
                ? `Responsible party: ${result.member.responsible_party} (parent/guardian)`
                : "Adult student — responsible for their own equipment"}
            </p>
            {result.leases.length === 0 && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--gray-600)" }}>
                No devices on record.
              </p>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              {result.leases.map((lease) => {
                const chip = statusChip(lease);
                const { text, ...chipStyle } = chip;
                return (
                  <div
                    key={lease.lease_id}
                    style={{
                      border: "1px solid var(--gray-200, #ddded6)",
                      borderRadius: "var(--radius-md, 8px)",
                      padding: "12px 16px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, color: "var(--gray-900)" }}>
                        {lease.serial_number || "Device"} — {lease.item_group}
                      </p>
                      <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--gray-500)" }}>
                        Assigned {fmt(lease.assigned_date)} · Due {fmt(lease.expected_return_date)}
                        {lease.returned_date ? ` · Closed ${fmt(lease.returned_date)}` : ""}
                        {lease.condition_note ? ` · Note: ${lease.condition_note}` : ""}
                      </p>
                    </div>
                    <span style={chipStyle}>{text}</span>
                  </div>
                );
              })}
            </div>
            <p
              style={{
                margin: "16px 0 0",
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                color: "var(--gray-500, #777b73)",
              }}
            >
              Something look wrong, or need to report damage or loss? Email{" "}
              <a href="mailto:it.director@summitunified.edu" style={{ color: "var(--action-700, #004eeb)" }}>
                your district IT office
              </a>{" "}
              — include the device serial number.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDevicesPortal;
