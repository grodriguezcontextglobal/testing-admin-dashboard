import { NavLink, Outlet } from "react-router-dom";
import { usePermission } from "../../../../hooks/usePermission";

const tabOptions = [
  { label: "Assigned devices", route: "list-equipment", id: 0 },
  { label: "New assignment",   route: "assignment",     id: 1 },
];

const pillNavLinkStyle = ({ isActive }) => ({
  borderRadius: "9999px",
  padding: "6px 14px",
  fontSize: "13px",
  fontWeight: 500,
  lineHeight: "1.4",
  whiteSpace: "nowrap",
  textDecoration: "none",
  backgroundColor: isActive ? "var(--gray-700, #484d47)" : "transparent",
  color: isActive ? "#fff" : "var(--gray-600, #5d615a)",
  transition: "background-color 0.15s, color 0.15s",
});

const EquipmentStafDetail = () => {
  const canAssignDevices = usePermission("staff:assign_devices");

  return (
    <div style={{ width: "100%" }}>
      {canAssignDevices && (
        <div style={{ margin: "12px 0 16px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              border: "1px solid var(--gray-300, #c6c8bf)",
              borderRadius: "9999px",
              padding: "4px",
              backgroundColor: "#fff",
              width: "fit-content",
            }}
          >
            {tabOptions.map((tab) => (
              <NavLink key={tab.id} to={tab.route} style={pillNavLinkStyle}>
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
      <Outlet />
    </div>
  );
};

export default EquipmentStafDetail;
