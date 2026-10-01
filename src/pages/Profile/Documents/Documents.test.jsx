import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Documents from "./Documents";
import { devitrakApi } from "../../../api/devitrakApi";

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

/**
 * D1 + D2 + 2b.8 on the page itself: grouped by use, filterable, and an
 * expired document labelled — not hidden (meeting 2026-09-29 `37:36`).
 */
const DOCUMENTS = [
  { _id: "w", title: "Waiver form", trigger_action: "event", expiration_date: "2099-12-12" },
  { _id: "old", title: "Old waiver", trigger_action: "event", expiration_date: "2020-01-01" },
  { _id: "hb", title: "Staff handbook", trigger_action: "onboarding" },
];

const renderPage = () => {
  devitrakApi.get.mockResolvedValue({ data: { documents: DOCUMENTS } });
  devitrakApi.post.mockResolvedValue({ data: { folders: [] } });
  const store = configureStore({
    reducer: { admin: () => ({ user: { companyData: { id: "c1", industry: "Education" } } }) },
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <Documents />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
};

describe("Documents — grouped by use", () => {
  it("shows a section per use, with how many are expired", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Waiver form")).toBeInTheDocument());
    const sections = [...document.querySelectorAll(".document-group__title")].map(
      (heading) => heading.textContent
    );
    expect(sections).toEqual(["Staff1", "Event2 · 1 expired"]);
  });

  it("offers a filter per use and one for the expired", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Waiver form")).toBeInTheDocument());
    for (const label of ["All (3)", "Staff (1)", "Event (2)", "Expired (1)"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("narrows to the expired, still labelled Expired", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Waiver form")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Expired (1)" }));
    expect(screen.getByText("Old waiver")).toBeInTheDocument();
    expect(screen.queryByText("Waiver form")).toBeNull();
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });
});
