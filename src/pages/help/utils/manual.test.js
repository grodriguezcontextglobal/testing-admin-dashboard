import { describe, expect, it } from "vitest";
import {
  articleForRoute,
  articleToPlainText,
  countArticles,
  findArticle,
  flattenArticles,
  manualToPlainText,
  searchArticles,
} from "./manual";

const SECTIONS = [
  {
    id: "events",
    title: "Events",
    summary: "Everything that happens between creating an event and closing it.",
    articles: [
      {
        id: "events-create",
        title: "Creating an event",
        appRoute: "/create-event-page/event-detail",
        summary: "The five-step wizard.",
        steps: [{ text: "Fill in the event name and address." }],
        rules: ["Later steps stay locked until the earlier ones are filled in."],
      },
      {
        id: "events-close",
        title: "Closing an event",
        appRoute: "/events/event-quickglance",
        summary: "Count the inventory, then close.",
        elevated: true,
        steps: [{ text: "Scan every device that came back." }],
        pitfalls: ["Closing cannot be reversed."],
        related: ["events-create"],
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    summary: "Your devices, wherever they are.",
    articles: [
      {
        id: "inventory-add",
        title: "Adding devices",
        appRoute: "/inventory",
        summary: "One device, or a numbered range of them.",
        steps: [{ text: "Pick a category." }],
      },
    ],
  },
];

describe("flattenArticles", () => {
  it("returns every article, carrying its section down with it", () => {
    const flat = flattenArticles(SECTIONS);
    expect(flat).toHaveLength(3);
    expect(flat[0]).toMatchObject({
      id: "events-create",
      sectionId: "events",
      sectionTitle: "Events",
    });
    expect(flat[2].sectionId).toBe("inventory");
  });

  it("survives a section with no articles, and no sections at all", () => {
    expect(flattenArticles([{ id: "x", title: "X" }])).toEqual([]);
    expect(flattenArticles(undefined)).toEqual([]);
  });
});

describe("countArticles", () => {
  it("counts across sections", () => {
    expect(countArticles(SECTIONS)).toBe(3);
    expect(countArticles([])).toBe(0);
  });
});

describe("findArticle", () => {
  it("finds an article by id and says which section it belongs to", () => {
    const found = findArticle(SECTIONS, "events-close");
    expect(found.title).toBe("Closing an event");
    expect(found.sectionTitle).toBe("Events");
  });

  it("returns null for an id nobody has, so a bad deep link can be handled", () => {
    expect(findArticle(SECTIONS, "nope")).toBeNull();
    expect(findArticle(SECTIONS, undefined)).toBeNull();
  });
});

describe("searchArticles", () => {
  it("returns everything when there is nothing to search for", () => {
    expect(searchArticles(SECTIONS, "")).toHaveLength(3);
    expect(searchArticles(SECTIONS, "   ")).toHaveLength(3);
  });

  it("matches the title, case-insensitively", () => {
    const hits = searchArticles(SECTIONS, "CLOSING");
    expect(hits).toHaveLength(1);
    expect(hits[0].id).toBe("events-close");
  });

  it("matches the body too — a step, a rule, a pitfall", () => {
    expect(searchArticles(SECTIONS, "scan")[0].id).toBe("events-close");
    expect(searchArticles(SECTIONS, "locked")[0].id).toBe("events-create");
    expect(searchArticles(SECTIONS, "reversed")[0].id).toBe("events-close");
  });

  it("matches the section name, so 'inventory' finds the inventory articles", () => {
    const hits = searchArticles(SECTIONS, "inventory");
    expect(hits.map((hit) => hit.id)).toContain("inventory-add");
  });

  it("ranks a title match above a body-only match", () => {
    const hits = searchArticles(SECTIONS, "event");
    expect(hits[0].title).toContain("event");
  });

  it("finds nothing rather than everything when nothing matches", () => {
    expect(searchArticles(SECTIONS, "zzzz")).toEqual([]);
  });
});

describe("articleToPlainText", () => {
  it("writes the article out as text, headings and all", () => {
    const text = articleToPlainText(findArticle(SECTIONS, "events-close"));
    expect(text).toContain("Closing an event");
    expect(text).toContain("Where: /events/event-quickglance");
    expect(text).toContain("Scan every device that came back.");
    expect(text).toContain("Closing cannot be reversed.");
  });

  it("leaves out the headings for parts an article does not have", () => {
    const text = articleToPlainText(findArticle(SECTIONS, "inventory-add"));
    expect(text).not.toContain("Watch out");
    expect(text).not.toContain("Rules");
  });

  it("returns an empty string for nothing at all", () => {
    expect(articleToPlainText(null)).toBe("");
  });
});

describe("manualToPlainText", () => {
  it("serializes the whole manual — this is the file a bot would be given", () => {
    const text = manualToPlainText(SECTIONS);
    expect(text).toContain("Events");
    expect(text).toContain("Inventory");
    expect(text).toContain("Creating an event");
    expect(text).toContain("Adding devices");
  });

  it("carries every article id, so an answer can cite one", () => {
    const text = manualToPlainText(SECTIONS);
    flattenArticles(SECTIONS).forEach((article) => {
      expect(text).toContain(`[${article.id}]`);
    });
  });
});

describe("articleForRoute", () => {
  it("finds the article for the screen you are on", () => {
    expect(articleForRoute(SECTIONS, "/inventory")?.id).toBe("inventory-add");
  });

  it("prefers the most specific appRoute, not the first one that matches", () => {
    const sections = [
      {
        id: "s",
        title: "S",
        articles: [
          { id: "broad", title: "Broad", appRoute: "/inventory" },
          { id: "narrow", title: "Narrow", appRoute: "/inventory/location" },
        ],
      },
    ];
    expect(articleForRoute(sections, "/inventory/location")?.id).toBe("narrow");
    expect(articleForRoute(sections, "/inventory")?.id).toBe("broad");
  });

  it("matches a route with an id in it, because /consumers/9 is still consumers", () => {
    const sections = [
      { id: "s", title: "S", articles: [{ id: "c", title: "C", appRoute: "/consumers" }] },
    ];
    expect(articleForRoute(sections, "/consumers/665f0abc")?.id).toBe("c");
  });

  it("does not match a route that merely starts with the same letters", () => {
    const sections = [
      { id: "s", title: "S", articles: [{ id: "c", title: "C", appRoute: "/consumers" }] },
    ];
    expect(articleForRoute(sections, "/consumers-report")).toBeNull();
  });

  it("takes the first article declared when several share a route", () => {
    expect(articleForRoute(SECTIONS, "/events/event-quickglance")?.id).toBe(
      "events-close",
    );
  });

  it("returns null for a screen the manual says nothing about", () => {
    expect(articleForRoute(SECTIONS, "/staff")).toBeNull();
    expect(articleForRoute(SECTIONS, "/")).toBeNull();
    expect(articleForRoute(SECTIONS, undefined)).toBeNull();
  });
});
