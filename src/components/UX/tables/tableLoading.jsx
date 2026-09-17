import DevitrakLoading from "../../animation/DevitrakLoading";

/**
 * What a table shows while it waits.
 *
 * antd renders its own dot spinner for `loading={true}` and only lets you
 * replace it through the object form, `{spinning, indicator}`. Every table in
 * the product passed the boolean, so every table waited with antd's spinner
 * instead of the brand's animation — on the inventory screen that is the wait
 * people see most: every load, every filter, every page.
 *
 * The small variant is the one built for this: bracket mark alone, 18px, no
 * wordmark and no margins. The full lockup belongs in a Suspense fallback, and
 * the fullscreen one over a whole view.
 *
 * A caller that already passes its own `indicator` keeps it. The default is a
 * default, not a rule — a screen with something better to say still says it.
 *
 * @param {boolean|{spinning?: boolean, indicator?: React.ReactNode}|undefined} loading
 * @param {{label?: string}} [options] `label` names what is loading, for screen
 *   readers: "Loading inventory…" beats a generic spinner announcement.
 * @returns {object|undefined} antd's loading prop, or undefined when the caller
 *   said nothing — a table with no loading state has to keep having none.
 */
export const resolveTableLoading = (loading, { label } = {}) => {
  if (loading === undefined || loading === null) return undefined;

  const branded = <DevitrakLoading size="small" {...(label ? { label } : {})} />;

  if (typeof loading === "object") {
    return loading.indicator ? loading : { ...loading, indicator: branded };
  }

  return { spinning: Boolean(loading), indicator: branded };
};
