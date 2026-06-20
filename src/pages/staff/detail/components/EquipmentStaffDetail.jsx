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
  backgroundColor: isActive ? "#344054" : "transparent",
  color: isActive ? "#fff" : "#475467",
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
              border: "1px solid #D0D5DD",
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
