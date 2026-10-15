import { hasPermission } from "../../../config/roles";

/**
 * What the home page shows to a role.
 *
 * It used to show everything to everyone: an inventory manager got live events
 * and "Create new event", an event manager got inventory units and "Add to
 * inventory". Sections follow inventory:read / event:read, buttons follow
 * inventory:create / event:create — the same permissions the navigation uses.
 *
 * The events block used to appear only once the company had inventory, so a
 * new company starts on the "add to inventory" screen. That stays for roles
 * that can add inventory; a role that cannot (an events-only role, or
 * sale_manager, which reads inventory but cannot add it) never gets that
 * screen, and its events are not held back by an inventory it cannot fill.
 *
 * @param {{roleType: string|undefined, inventoryCount: number}} input
 */
export const homeLayout = ({ roleType, inventoryCount = 0 }) => {
  const readsInventory = hasPermission("inventory:read", roleType);
  const readsEvents = hasPermission("event:read", roleType);
  const actions = {
    addInventory: hasPermission("inventory:create", roleType),
    createEvent: hasPermission("event:create", roleType),
  };
  const hasInventory = inventoryCount > 0;
  // Only a role that can add the inventory is held on the first-run screen.
  const firstRun = readsInventory && actions.addInventory && !hasInventory;

  return {
    kpis: { inventory: readsInventory, events: readsEvents },
    actions,
    inventorySection: readsInventory && hasInventory,
    eventsSection: readsEvents && !firstRun,
    onboarding:
      firstRun && (actions.addInventory || actions.createEvent) ? { ...actions } : null,
  };
};
