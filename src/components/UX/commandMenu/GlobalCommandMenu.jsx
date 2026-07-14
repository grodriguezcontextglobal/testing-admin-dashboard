import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommandMenu from "./CommandMenu";
import { useSelector } from "react-redux";
import { getIndustryProfile } from "../../../config/industryProfiles";

/**
 * App-wide ⌘K / Ctrl+K command menu: quick navigation + common actions.
 * Mounted once inside AuthRoutes (needs router context).
 */
const GlobalCommandMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.admin);
  const hiddenNavTabs = getIndustryProfile(
    user?.companyData?.industry
  ).hiddenNavTabs;

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    // the navbar magnifier (and anything else) can open the palette
    const onOpenEvent = () => setOpen(true);
    // Delegated fallback: any element with [data-open-cmdk] opens the menu.
    // The navbar's React onClick is unreliable there (Million-compiled), so
    // this document-level listener is the source of truth for that trigger.
    const onDocClick = (e) => {
      if (e.target.closest?.("[data-open-cmdk]")) setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("devitrak:open-cmdk", onOpenEvent);
    document.addEventListener("click", onDocClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("devitrak:open-cmdk", onOpenEvent);
      document.removeEventListener("click", onDocClick);
    };
  }, []);

  const isTabVisible = (id) => !hiddenNavTabs.includes(id);
  const groups = useMemo(
    () => [
      {
        label: "Navigation",
        items: [
          { id: "home", label: "Home", icon: "tabler:home", onSelect: () => navigate("/") },
          { id: "events", label: "Events", icon: "tabler:calendar-event", onSelect: () => navigate("/events") },
          { id: "inventory", label: "Inventory", icon: "tabler:box", onSelect: () => navigate("/inventory") },
          ...(isTabVisible("consumers")
            ? [{ id: "consumers", label: "Consumers", icon: "tabler:users", onSelect: () => navigate("/consumers") }]
            : []),
          { id: "staff", label: "Staff", icon: "tabler:id-badge-2", onSelect: () => navigate("/staff") },
          { id: "posts", label: "Posts", icon: "tabler:news", onSelect: () => navigate("/posts") },
        ],
      },
      {
        label: "Actions",
        items: [
          {
            id: "new-event",
            label: "Create new event",
            icon: "tabler:calendar-plus",
            onSelect: () => navigate("/create-event-page/event-detail"),
          },
          ...(isTabVisible("consumers")
            ? [{
                id: "new-consumer",
                label: "Add new consumer",
                icon: "tabler:user-plus",
                onSelect: () =>
                  navigate("/consumers", { state: { quickAction: "create" } }),
              }]
            : []),
          {
            id: "new-staff",
            label: "Add staff member",
            icon: "tabler:user-plus",
            onSelect: () =>
              navigate("/staff", { state: { quickAction: "create" } }),
          },
          {
            id: "new-inventory",
            label: "Add to inventory",
            icon: "tabler:packages",
            onSelect: () => navigate("/inventory/new-bulk-items"),
          },
          {
            id: "new-post",
            label: "Write new post",
            icon: "tabler:pencil-plus",
            onSelect: () => navigate("/posts/new-post"),
          },
          {
            id: "profile",
            label: "My profile",
            icon: "tabler:user-circle",
            onSelect: () => navigate("/profile/my_details"),
          },
          {
            id: "design-lab",
            label: "Design Lab (component kit)",
            icon: "tabler:flask",
            hint: "new",
            onSelect: () => navigate("/design-lab"),
          },
        ],
      },
    ],
    [navigate, hiddenNavTabs]
  );

  return (
    <CommandMenu
      open={open}
      onClose={() => setOpen(false)}
      groups={groups}
      searchScopes={[
        { key: "Consumers", label: "Consumers", icon: "tabler:users" },
        { key: "Staff", label: "Staff", icon: "tabler:id-badge-2" },
        { key: "Devices", label: "Devices", icon: "tabler:device-mobile" },
        { key: "Events", label: "Events", icon: "tabler:calendar-event" },
      ]}
      onSearchAll={(q, scope) =>
        navigate(`/search-result-page?search=${encodeURIComponent(q)}`, {
          state: { search: q, count: 0, filter: scope ?? null },
        })
      }
    />
  );
};

export default GlobalCommandMenu;
