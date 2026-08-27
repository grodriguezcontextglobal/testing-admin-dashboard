import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import contract from "../docs/api-payloads.json";
import { bodyFromAxiosArgs, checkPayload, findEndpoint } from "./apiContract";

/**
 * Every `devitrakApi.*` call in the codebase, checked against the server's
 * payload contract.
 *
 * This is the check the generated docs were missing. `api-payloads.d.ts`
 * declares an interface per endpoint, but the project has no `tsconfig`, so a
 * payload missing a required field was only discovered when the request came
 * back 400 — usually in production, and usually in the middle of a flow that
 * had already written something.
 *
 * It reads the source rather than running it, so it only sees payloads written
 * as object literals. That is most of them; the ones assembled at runtime are
 * covered by the development-only interceptor in devitrakApi.jsx instead.
 *
 * WHEN THIS FAILS, the fix is the call site, not the allowlist. The entries
 * below are the findings that already existed when the check was introduced;
 * each one is a real defect with an owner, not an exemption to copy.
 */

/**
 * Calls to a path the contract does not carry, each with the reason it stays.
 * These are dispositions from the team, not exemptions to copy: a new entry
 * here needs the same answer.
 */
const KNOWN_UNMATCHED = [
  // Not implemented: there is no subscription system configured yet, the design
  // is still under discussion. The contract has DELETE and GET for
  // `/api/stripe/subscriptions/:id`, no POST.
  "POST /api/stripe/subscriptions/:x",
  // Not implemented: editing a stored document does not exist on the client
  // yet. Pending work, not a broken call.
  "PUT /api/document/:x",
  // Standby, pending a backend answer. The generator detects a payload for 451
  // of the 484 mounted endpoints, so absence from the contract is not proof
  // that the route is gone.
  "POST /api/admin/push/broadcast",
  "POST /api/cloudinary/upload-image",
  "POST /api/db_location/sub-location-path/delete",
  // Live on the server since 2026-08-25, but newer than the generated
  // artifacts in src/docs -- the backend regenerates those, we do not. Drop
  // this line once api-payloads.json carries the route.
  "POST /api/school/consent/list",
];

/** Literal payloads that omit a field the handler rejects the request without. */
const KNOWN_MISSING = [
  // Forming.jsx is dead code — nothing imports it — which is the only reason
  // this has never been reported.
  "POST /api/db_item/item-out-warehouse @ src/pages/events/quickGlance/inventory/action/components/Forming.jsx",
];

const SUFFIX = {
  devitrakApi: "",
  devitrakApiAdmin: "/admin",
  devitrakApiArticle: "/article",
};

const CALL = /\b(devitrakApi|devitrakApiAdmin|devitrakApiArticle)\.(get|post|put|patch|delete)\s*\(/g;
const KEY = /^(?:"([^"]+)"|'([^']+)'|\[[^\]]+\]|([A-Za-z_$][\w$]*))\s*(:|,|$)/;
const STRING_OPEN = /["'`]/;

/** The raw text between the parentheses of a call whose `(` is at `open`. */
function readArgs(source, open) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = open; i < source.length; i += 1) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (STRING_OPEN.test(char)) quote = char;
    else if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return null;
}

/** Split an argument list on its top-level commas. */
function splitTop(text) {
  const out = [];
  let depth = 0;
  let current = "";
  let quote = null;
  let escaped = false;

  for (const char of text) {
    if (quote) {
      current += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (STRING_OPEN.test(char)) quote = char;
    else if ("([{".includes(char)) depth += 1;
    else if (")]}".includes(char)) depth -= 1;
    else if (char === "," && depth === 0) {
      out.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) out.push(current);
  return out.map((part) => part.trim());
}

/** The request path, with every `${…}` segment turned into a parameter. */
function literalUrl(argument) {
  const match = /^(["'`])([\s\S]*?)\1/.exec(argument.trim());
  if (!match) return null;
  return match[2]
    .replace(/\$\{[^}]*\}/g, "\u0000")
    .split("/")
    .map((part) => (part.includes("\u0000") ? ":x" : part))
    .join("/")
    .split("?")[0];
}

/**
 * The top-level keys of an object literal, or `null` when the text is not one.
 * A spread makes the key list incomplete, so it is reported as unreadable.
 */
function literalKeys(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;

  const keys = [];
  for (const part of splitTop(trimmed.slice(1, -1))) {
    if (!part) continue;
    if (part.startsWith("...")) return null;
    const match = KEY.exec(part);
    if (!match) return null;
    const name = match[1] ?? match[2] ?? match[3];
    if (!name) return null;
    keys.push(name);
  }
  return keys;
}

/** The value of one key inside an object literal, as raw text. */
function literalProperty(text, wanted) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed.startsWith("{")) return null;
  for (const part of splitTop(trimmed.slice(1, -1))) {
    const match = KEY.exec(part.trim());
    const name = match?.[1] ?? match?.[2] ?? match?.[3];
    if (name === wanted) return part.slice(part.indexOf(":") + 1).trim();
  }
  return null;
}

function* sourceFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "docs") continue;
      yield* sourceFiles(full);
    } else if (/\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)) {
      yield full;
    }
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const unmatched = new Set();
const missing = [];
let calls = 0;

for (const file of sourceFiles(root)) {
  const source = fs.readFileSync(file, "utf-8");
  const relative = path.relative(path.resolve(root, ".."), file).replace(/\\/g, "/");

  CALL.lastIndex = 0;
  let match;
  while ((match = CALL.exec(source)) !== null) {
    const method = match[2].toUpperCase();
    const raw = readArgs(source, match.index + match[0].length - 1);
    if (raw === null) continue;

    const args = splitTop(raw);
    if (args.length === 0) continue;

    const url = literalUrl(args[0]);
    if (!url || !url.startsWith("/")) continue;

    calls += 1;
    const fullPath = `/api${SUFFIX[match[1]]}${url}`;

    if (!findEndpoint(contract, method, fullPath, { pattern: true })) {
      unmatched.add(`${method} ${fullPath}`);
      continue;
    }

    const payloadText =
      method === "GET" || method === "DELETE"
        ? literalProperty(args[1] ?? "", method === "DELETE" ? "data" : "params")
        : args[1] ?? "{}";

    // Only literal objects can be read; anything computed is the interceptor's
    // job, and a missing config on a GET carries no fields by definition.
    if (payloadText === null && method !== "POST" && method !== "PUT" && method !== "PATCH") {
      continue;
    }
    const keys = literalKeys(payloadText ?? "{}");
    if (keys === null) continue;

    const body = Object.fromEntries(keys.map((key) => [key, true]));
    const problem = checkPayload(contract, {
      method,
      url: fullPath,
      body: bodyFromAxiosArgs(method, method === "GET" ? { params: body } : body),
    });
    if (problem) {
      missing.push(`${problem.endpoint} @ ${relative}`);
    }
  }
}

describe("API payload contract", () => {
  it("reads a meaningful number of calls, so a broken scanner cannot pass silently", () => {
    expect(calls).toBeGreaterThan(500);
  });

  it("only calls endpoints the server actually exposes", () => {
    expect([...unmatched].sort()).toEqual([...KNOWN_UNMATCHED].sort());
  });

  it("sends every field the handler rejects the request without", () => {
    expect([...new Set(missing)].sort()).toEqual([...KNOWN_MISSING].sort());
  });
});
