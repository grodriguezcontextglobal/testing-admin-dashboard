/**
 * The manual, as data.
 *
 * The content lives in `../content/*.js` as plain objects rather than Markdown
 * for two reasons. The app has no Markdown renderer among its dependencies and
 * adding one means a package manifest change and a Docker image rebuild for
 * everybody. And an article that is an object can carry things Markdown cannot:
 * a stable `id` to cite, the `appRoute` where the feature actually lives, and
 * whether it needs elevated permissions.
 *
 * `manualToPlainText` is the bridge to the other thing this content is for. If
 * a support bot is built later, its knowledge is meant to be bounded by exactly
 * this manual, and that function is the file it would be given — with every
 * article id in it, so an answer can cite the article a reader can then open.
 *
 * Article shape:
 *
 *   {
 *     id: "events-close",            // stable; the citation anchor and the URL
 *     title: "Closing an event",
 *     appRoute: "/events/event-quickglance",   // where in the app this happens
 *     summary: "One or two sentences.",
 *     elevated: true,                // needs a permission not everyone has
 *     steps: [{ text, note? }],      // what to do, in order
 *     rules: ["..."],                // what the system enforces or guarantees
 *     pitfalls: ["..."],             // what goes wrong, and what it costs
 *     related: ["events-count"],     // other article ids
 *   }
 */

const text = (value) => String(value ?? "");

const asArray = (value) => (Array.isArray(value) ? value : []);

/** Every article in reading order, each one told which section it came from. */
export const flattenArticles = (sections) =>
  asArray(sections).flatMap((section) =>
    asArray(section?.articles).map((article) => ({
      ...article,
      sectionId: section.id,
      sectionTitle: section.title,
    })),
  );

export const countArticles = (sections) => flattenArticles(sections).length;

/** One article by id, or null — a deep link to a renamed article has to fail cleanly. */
export const findArticle = (sections, id) => {
  if (!id) return null;
  return flattenArticles(sections).find((article) => article.id === id) ?? null;
};

/* Everything a search should look inside: the article's own words and the name
   of the section holding it, so "inventory" finds the inventory articles even
   when the word is not in their titles. */
const haystack = (article) =>
  [
    article.title,
    article.summary,
    article.sectionTitle,
    ...asArray(article.steps).map((step) => `${step?.text ?? ""} ${step?.note ?? ""}`),
    ...asArray(article.rules),
    ...asArray(article.pitfalls),
  ]
    .map(text)
    .join(" ")
    .toLowerCase();

/**
 * Filtered, with title matches first. Somebody typing "close" wants the article
 * called "Closing an event" before the one that merely mentions closing.
 */
export const searchArticles = (sections, term) => {
  const needle = text(term).trim().toLowerCase();
  const all = flattenArticles(sections);
  if (!needle) return all;

  return all
    .map((article) => {
      const inTitle = text(article.title).toLowerCase().includes(needle);
      const inBody = haystack(article).includes(needle);
      return { article, rank: inTitle ? 0 : 1, matched: inTitle || inBody };
    })
    .filter((entry) => entry.matched)
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.article);
};

const block = (heading, lines) =>
  lines.length > 0 ? `${heading}\n${lines.map((line) => `- ${line}`).join("\n")}` : "";

/**
 * One article as text. The id is in brackets on the first line: a bot answering
 * from this file cites the id, and the reader can open /help/<id> to see the
 * same thing in the app.
 */
export const articleToPlainText = (article) => {
  if (!article) return "";

  const steps = asArray(article.steps).map((step, index) =>
    [`${index + 1}. ${text(step?.text)}`, step?.note ? `   (${step.note})` : ""]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `## ${text(article.title)}  [${text(article.id)}]`,
    article.appRoute ? `Where: ${article.appRoute}` : "",
    article.elevated ? "Needs elevated permissions." : "",
    text(article.summary),
    steps.length > 0 ? `Steps\n${steps.join("\n")}` : "",
    block("Rules", asArray(article.rules).map(text)),
    block("Watch out", asArray(article.pitfalls).map(text)),
  ]
    .filter(Boolean)
    .join("\n\n");
};

/** The whole manual as one document. */
export const manualToPlainText = (sections) =>
  asArray(sections)
    .map((section) =>
      [
        `# ${text(section?.title)}`,
        text(section?.summary),
        ...asArray(section?.articles).map((article) =>
          articleToPlainText({ ...article, sectionTitle: section?.title }),
        ),
      ]
        .filter(Boolean)
        .join("\n\n"),
    )
    .join("\n\n---\n\n");

/**
 * The article about the screen the reader is currently on, so the help button
 * opens something relevant instead of the front of the manual.
 *
 * Longest matching `appRoute` wins: /inventory/location is answered by the
 * locations article rather than by the broader inventory one. The match is on
 * whole path segments — "/consumers-report" is not a consumers page just
 * because it starts the same way.
 */
export const articleForRoute = (sections, pathname) => {
  const path = text(pathname);
  if (!path) return null;

  return (
    flattenArticles(sections)
      .filter((article) => {
        const route = text(article.appRoute);
        if (!route) return false;
        return path === route || path.startsWith(`${route}/`);
      })
      /* Longest route first; among equals, the order they were written, which
         is why each domain declares its overview article before its detail
         ones. */
      .sort((a, b) => text(b.appRoute).length - text(a.appRoute).length)[0] ??
    null
  );
};
