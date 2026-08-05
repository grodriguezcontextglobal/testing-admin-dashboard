/**
 * Avatar presentation helpers.
 *
 * Kept out of the component file so the module exports components only —
 * otherwise React Fast Refresh gives up on it.
 */

// Only non-semantic ramps: a red or amber avatar would read as a warning about
// the person rather than a way to recognise them.
const TINTS = [
  { background: "var(--action-50, #eff4ff)", color: "var(--action-700, #004eeb)" },
  { background: "var(--blue-50, #eff8ff)", color: "var(--blue-700, #175cd3)" },
  { background: "var(--brand-50, #e6edf4)", color: "var(--brand-500, #0a2f52)" },
  { background: "var(--blue-dark-50, #eff4ff)", color: "var(--blue-dark-800, #0040c1)" },
  { background: "var(--gray-100, #eeefe9)", color: "var(--gray-700, #454944)" },
];

/** "Nora Lopez" -> "NL". Never the whole name crushed into a circle. */
export function getInitials(name) {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

/** Same person, same colour, every time — a free recognition cue in a roster. */
export function getTint(name) {
  const key = String(name ?? "");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  }
  return TINTS[hash % TINTS.length];
}
