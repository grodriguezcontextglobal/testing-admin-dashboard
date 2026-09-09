/**
 * Home and search — the manual.
 *
 * The seven tiles and their labels come from home/components/HomeKpiSection.
 * One of them is not fixed: its label is the industry profile's audience, so a
 * school sees "Students" where an events company sees its own word. The search
 * sections come from pages/search/components — one per kind of thing.
 */

export const homeSection = {
  id: "home",
  title: "Home and search",
  summary:
    "Home answers \"how are we doing\" at a glance. Search answers \"where is this one thing\" from anywhere in the app. Between them they are how most days start.",
  articles: [
    {
      id: "home-dashboard",
      title: "Reading the home dashboard",
      appRoute: "/",
      summary:
        "Seven numbers across the top, then the live picture underneath. The tiles are counts of the whole company, not of one event — a number that looks wrong is usually being read as if it were scoped to something.",
      steps: [
        {
          text: "Inventory units — everything the company has on record, wherever it is.",
        },
        {
          text: "Devices out — what is in somebody's hands right now, whether a consumer's, a student's or a colleague's.",
        },
        { text: "Team members — the staff with accounts." },
        {
          text: "Consumers, and the audience tile beside it — a school sees \"Students\" here, because the label follows the industry the company is set up as.",
        },
        {
          text: "Live events and Upcoming events — what is running today and what is coming.",
        },
        {
          text: "Below the tiles: the live event snapshot, the value of the inventory, what is held by category, and the devices-per-event chart.",
          note: "\"No live event right now\" is the honest empty state, not a loading failure.",
        },
      ],
      rules: [
        "Every tile counts the whole company. Nothing on this page is filtered to an event or a location.",
        "For a role scoped to particular locations, the inventory figures reflect what that role can see — two people can legitimately read different numbers.",
      ],
      related: ["home-search", "home-company", "inventory-browse"],
    },
    {
      id: "home-search",
      title: "The search bar",
      appRoute: "/search-result-page",
      summary:
        "One box that searches seven kinds of thing at once — devices, consumers, students, staff, events, inventory and posts — and groups the results by kind so you can tell a device called \"Bridges\" from a school called \"Bridges\".",
      steps: [
        {
          text: "Search from the bar in the navigation, anywhere in the app.",
        },
        {
          text: "Results arrive grouped by kind. Each group is a section you can read past.",
        },
        {
          text: "Open a result to go straight to its page — a device to its detail, a consumer to their transactions, an event to its own page.",
        },
      ],
      rules: [
        "A serial number is the fastest way to find a device, and it is text: leading zeros count, and \"7\" is not \"CAM-0007\".",
        "You only see what your role and your locations allow. An empty group is not proof nothing exists — it can mean nothing you are allowed to see exists.",
      ],
      related: ["inventory-browse", "home-dashboard"],
    },
    {
      id: "home-company",
      title: "Working across more than one company",
      appRoute: "/",
      summary:
        "Somebody who belongs to several companies picks which one they are working in. Everything in the app then belongs to that company — inventory, events, staff, branding, billing.",
      steps: [
        {
          text: "Choose the company when you sign in, or switch from home.",
        },
        {
          text: "Check which one you are in before doing anything that writes. The switch is quiet by design.",
        },
      ],
      rules: [
        "Switching company changes what every page shows. It is not a filter you can forget you applied — it is the whole context.",
        "Email branding, billing and the payment account are per company. A guardian gets the branding of the company the event belongs to.",
      ],
      pitfalls: [
        "Equipment cannot be moved between companies by switching. Two companies are two inventories.",
      ],
      related: ["profile-email-branding", "profile-billing"],
    },
  ],
};
