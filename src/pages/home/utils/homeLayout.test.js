import { describe, expect, it } from "vitest";

import { homeLayout } from "./homeLayout";

/* The home page showed every section to every role: an inventory manager saw
   live events and "Create new event", an event manager saw inventory units
   and "Add to inventory". What each role sees now follows roles.js —
   inventory:read / event:read for the sections, :create for the buttons. */
describe("homeLayout", () => {
  it("an inventory-only role sees inventory and nothing about events", () => {
    for (const roleType of ["inventory_manager", "inventory_location_manager", "category_assistant"]) {
      const layout = homeLayout({ roleType, inventoryCount: 12 });
      expect(layout.inventorySection).toBe(true);
      expect(layout.eventsSection).toBe(false);
      expect(layout.kpis).toEqual({ inventory: true, events: false });
      expect(layout.actions.createEvent).toBe(false);
    }
  });

  it("an events-only role sees events and nothing about inventory", () => {
    for (const roleType of ["event_manager", "assistant"]) {
      const layout = homeLayout({ roleType, inventoryCount: 12 });
      expect(layout.inventorySection).toBe(false);
      expect(layout.eventsSection).toBe(true);
      expect(layout.kpis).toEqual({ inventory: false, events: true });
      expect(layout.actions.addInventory).toBe(false);
    }
  });

  /* It cannot read the inventory, so an inventory it cannot see must not hold
     its events back or send it to the "add to inventory" first-run screen. */
  it("an events-only role sees its events even with no inventory to count", () => {
    const layout = homeLayout({ roleType: "event_manager", inventoryCount: 0 });
    expect(layout.eventsSection).toBe(true);
    expect(layout.onboarding).toBeNull();
  });

  it("an admin sees both", () => {
    const layout = homeLayout({ roleType: "admin", inventoryCount: 3 });
    expect(layout.inventorySection).toBe(true);
    expect(layout.eventsSection).toBe(true);
    expect(layout.kpis).toEqual({ inventory: true, events: true });
    expect(layout.actions).toEqual({ addInventory: true, createEvent: true });
    expect(layout.onboarding).toBeNull();
  });

  it("an empty company still starts by adding inventory, as before", () => {
    const layout = homeLayout({ roleType: "admin", inventoryCount: 0 });
    expect(layout.inventorySection).toBe(false);
    expect(layout.eventsSection).toBe(false);
    expect(layout.onboarding).toEqual({ addInventory: true, createEvent: true });
  });

  it("the first-run screen only offers what the role can do", () => {
    expect(homeLayout({ roleType: "inventory_manager", inventoryCount: 0 }).onboarding).toEqual({
      addInventory: true,
      createEvent: false,
    });
    // Can read inventory but not add to it, nor create events: nothing to offer.
    expect(
      homeLayout({ roleType: "inventory_location_assistant", inventoryCount: 0 }).onboarding
    ).toBeNull();
  });

  /* sale_manager reads inventory and events but cannot add inventory. The
     "add inventory first" screen is not for it, so an empty inventory must not
     hide the events it can read — it used to leave the home with KPIs only. */
  it("a role that cannot add inventory sees its events with no inventory", () => {
    const layout = homeLayout({ roleType: "sale_manager", inventoryCount: 0 });
    expect(layout.inventorySection).toBe(false);
    expect(layout.eventsSection).toBe(true);
    expect(layout.onboarding).toBeNull();
  });

  it("a role it cannot resolve sees neither section", () => {
    const layout = homeLayout({ roleType: undefined, inventoryCount: 5 });
    expect(layout.inventorySection).toBe(false);
    expect(layout.eventsSection).toBe(false);
  });
});
