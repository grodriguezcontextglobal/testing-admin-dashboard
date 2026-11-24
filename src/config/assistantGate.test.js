import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

// Two properties of the staff assistant that no unit test can observe,
// because one is about what a BUILD contains and the other is about a method
// that must never be called. Both are checked by reading the source.

const read = (relative) => fs.readFileSync(path.resolve(process.cwd(), relative), "utf8");

describe("the assistant is gated at the import, not only at the call site", () => {
  const app = read("src/App.jsx");

  // Measured, not assumed. With `lazyWithRetry(() => import(...))` at module
  // scope and the flag checked only in the JSX, the factory is still
  // evaluated and Rollup emitted an AssistantWindow chunk into a build with
  // the flag OFF -- 3.7 KB of a feature nobody had turned on. Folding the
  // flag around the import makes it unreachable and the chunk is not emitted.
  //
  // This test exists because the difference is invisible from the running app:
  // both forms render nothing. Only the bundle tells them apart.
  it("reads the flag around the dynamic import of the window", () => {
    // Up to the first semicolon, with no line-ending in the pattern: this
    // repository checks out CRLF on Windows, and anything anchored to "\n"
    // right after the semicolon matches on one machine and not the other.
    const declaration = /const AssistantWindow\s*=([^;]*);/.exec(app);
    expect(declaration, "AssistantWindow is no longer declared in App.jsx").toBeTruthy();
    const body = declaration[1];
    expect(body).toContain("FEATURE_ASSISTANT");
    expect(body).toContain("import(");
    // The flag has to come first: a ternary that imports in both arms, or a
    // bare factory followed by a check, is the shape this test is here to
    // prevent.
    expect(body.indexOf("FEATURE_ASSISTANT")).toBeLessThan(body.indexOf("import("));
  });

  it("still guards the render, so the flag is not load-bearing in one place only", () => {
    expect(app).toMatch(/FEATURE_ASSISTANT && <AssistantWindow/);
  });
});

describe("the assistant never renders server text as HTML", () => {
  // The answer and its links are written by a model that the question can
  // steer. React escapes text children; dangerouslySetInnerHTML does not, and
  // one call to it anywhere in this feature turns a confusing answer into
  // script running in a staff session.
  //
  // The day a markdown renderer is added, it has to be one with raw HTML
  // disabled -- and this test will not catch that, so it says so here where
  // whoever adds it will be reading.
  const files = [
    "src/components/assistant/AssistantWindow.jsx",
    "src/hooks/assistant/useAssistantAsk.js",
    "src/pages/assistant/utils/assistant.js",
    "src/pages/assistant/utils/stub/assistantStub.js",
  ];

  // Looks for the USE, not the word: the window's own comment names it in
  // order to say it is not there, and a test that cannot tell those apart
  // would have to be silenced the first time someone documented the rule.
  it.each(files)("%s never passes dangerouslySetInnerHTML", (file) => {
    expect(read(file)).not.toMatch(/dangerouslySetInnerHTML\s*[=:]/);
  });

  it("renders the answer with its line breaks and nothing else", () => {
    expect(read("src/components/assistant/AssistantWindow.jsx")).toContain("pre-wrap");
  });
});
