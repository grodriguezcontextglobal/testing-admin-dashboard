import { Icon } from "@iconify/react";

/**
 * Infer a leading/trailing icon for a button from its label text.
 * Untitled UI-style line icons (Tabler set — visually equivalent to the
 * Untitled UI free icon set, 24px / 2px stroke, already used app-wide).
 *
 * Conservative by design: only well-understood verbs map; anything else gets
 * no icon. Explicit iconLeading/iconTrailing props always win (callers
 * never get a second icon).
 */
const RULES = [
  // [regex, icon, placement]
  [
    /\b(add|create|new|invite)\b.*\b(consumer|user|member|staff|admin|attendee|guest|employee)\b/,
    "tabler:user-plus",
    "leading",
  ],
  [/\b(add|create|new)\b/, "tabler:plus", "leading"],
  [/\b(save|confirm|verify|approve|apply|done)\b/, "tabler:check", "leading"],
  [/\b(update|refresh|reload|sync|renew)\b/, "tabler:refresh", "leading"],
  [/\b(edit|rename|modify)\b/, "tabler:pencil", "leading"],
  [/\b(delete|remove)\b/, "tabler:trash", "leading"],
  [/\b(export|download)\b/, "tabler:download", "leading"],
  [/\b(import|upload)\b/, "tabler:upload", "leading"],
  [/\b(e-?mail|resend)\b/, "tabler:mail", "leading"],
  [/\b(send|share|invite)\b/, "tabler:send", "leading"],
  [/\b(log ?out|sign ?out)\b/, "tabler:logout", "leading"],
  [/\b(log ?in|sign ?in)\b/, "tabler:login-2", "leading"],
  [/\b(search|find|look ?up)\b/, "tabler:search", "leading"],
  [/\b(copy|duplicate)\b/, "tabler:copy", "leading"],
  [/\bprint\b/, "tabler:printer", "leading"],
  [/\b(pay|payment|charge|checkout)\b/, "tabler:credit-card", "leading"],
  [/\b(assign|attach|link)\b/, "tabler:link", "leading"],
  [/\b(view|see|details|preview)\b/, "tabler:eye", "leading"],
  [/\bscan\b/, "tabler:scan", "leading"],
  [/\b(end|stop|terminate)\b/, "tabler:flag-off", "leading"],
  [/\b(back|previous|return)\b/, "tabler:arrow-left", "leading"],
  // forward motion reads better trailing
  [/\b(next|continue|proceed|go)\b/, "tabler:arrow-right", "trailing"],
  [/\b(submit)\b/, "tabler:send", "trailing"],
];

export const inferButtonIcons = (label) => {
  if (typeof label !== "string" || !label.trim()) return null;
  const text = label.toLowerCase();
  for (const [re, icon, placement] of RULES) {
    if (re.test(text)) {
      const node = <Icon icon={icon} width={20} height={20} />;
      return placement === "trailing"
        ? { leading: null, trailing: node }
        : { leading: node, trailing: null };
    }
  }
  return null;
};

export default inferButtonIcons;
