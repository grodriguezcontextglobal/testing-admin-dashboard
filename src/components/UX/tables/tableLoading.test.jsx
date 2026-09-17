import { describe, expect, it } from "vitest";
import DevitrakLoading from "../../animation/DevitrakLoading";
import { resolveTableLoading } from "./tableLoading";

describe("resolveTableLoading", () => {
  // The point of the whole thing: every table in the product waits with the
  // brand's animation, and a caller gets that by passing the boolean it was
  // already passing.
  it("turns a boolean into antd's object form with the branded indicator", () => {
    const loading = resolveTableLoading(true);

    expect(loading.spinning).toBe(true);
    expect(loading.indicator.type).toBe(DevitrakLoading);
    // The variant built for sitting inside a table: bracket mark only, 18px.
    expect(loading.indicator.props.size).toBe("small");
  });

  it("keeps a false boolean false", () => {
    expect(resolveTableLoading(false).spinning).toBe(false);
  });

  // A table that never passes `loading` must keep rendering exactly as it does
  // today — antd treats undefined and false differently in its own defaults,
  // and inventing a loading state for fifty screens is not what this is for.
  it("leaves a table that says nothing about loading alone", () => {
    expect(resolveTableLoading(undefined)).toBeUndefined();
  });

  it("fills in the indicator for a caller that only set spinning", () => {
    const loading = resolveTableLoading({ spinning: true, delay: 200 });

    expect(loading.spinning).toBe(true);
    expect(loading.delay).toBe(200);
    expect(loading.indicator.type).toBe(DevitrakLoading);
  });

  // The screen that wants to name what is loading, or show something else
  // entirely, keeps saying so. The default is a default, not a rule.
  it("leaves a caller's own indicator untouched", () => {
    const mine = <span data-testid="mine" />;
    const loading = resolveTableLoading({ spinning: true, indicator: mine });

    expect(loading.indicator).toBe(mine);
  });

  it("carries a label through to the animation", () => {
    const loading = resolveTableLoading(true, { label: "Loading inventory…" });

    expect(loading.indicator.props.label).toBe("Loading inventory…");
  });
});
