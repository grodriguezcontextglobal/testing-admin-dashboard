import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ForceLogout from "./ForceLogout";
import { devitrakApi } from "../../api/devitrakApi";

vi.mock("../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn() },
}));

const notify = vi.fn();
vi.mock("../../components/notification/alerts/useStatusNotification", () => ({
  useStatusNotification: () => ({ notify, contextHolder: null }),
}));

vi.mock("../../components/animation/DevitrakLoading", () => ({
  default: () => <div data-testid="loading" />,
}));

/**
 * The force-logout email used to embed a `<form method="GET">` with a password
 * field, so the plaintext password travelled in the URL. The email now links
 * here with the account email only and the password is typed on this page.
 * These tests hold that line, and hold the back-compat path for links that
 * were already in inboxes when it changed.
 */
// MemoryRouter keeps the URL in memory, so window.location never reflects it.
// Asserting on window.location here would pass no matter what the component
// did; this probe reports the router's actual location instead.
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

function renderAt(search) {
  return render(
    <MemoryRouter initialEntries={[`/force-logout${search}`]}>
      <LocationProbe />
      <Routes>
        <Route path="/force-logout" element={<ForceLogout />} />
        <Route path="/login" element={<div data-testid="login-page" />} />
      </Routes>
    </MemoryRouter>
  );
}

const passwordField = () => document.querySelector('input[name="password"]');
// antd wraps the submit button in spans, and a click on those does not reach
// jsdom's implicit form submission; submitting the form is what the button
// does anyway, and it still runs react-hook-form's validation.
const submitForm = () => fireEvent.submit(document.querySelector("form"));

describe("ForceLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    devitrakApi.post.mockResolvedValue({ data: { ok: true } });
  });

  it("renders from an email-only link — no password in the URL", async () => {
    renderAt("?email=ana%40bridgespcs.org&timestamp=1788220265821");

    expect(await screen.findByText("Revoke Active Session")).toBeTruthy();
    expect(screen.getByText("ana@bridgespcs.org")).toBeTruthy();
    // The field the user types into has to actually exist and be empty.
    const field = passwordField();
    expect(field).toBeTruthy();
    expect(field.type).toBe("password");
    expect(field.value).toBe("");
  });

  it("posts the typed password to /staff/force-logout", async () => {
    renderAt("?email=ana%40bridgespcs.org&timestamp=1");

    await screen.findByText("Revoke Active Session");
    fireEvent.change(passwordField(), { target: { value: "s3cret-typed" } });
    submitForm();

    await waitFor(() =>
      expect(devitrakApi.post).toHaveBeenCalledWith("/staff/force-logout", {
        email: "ana@bridgespcs.org",
        password: "s3cret-typed",
      })
    );
  });

  it("does not submit an empty password", async () => {
    renderAt("?email=ana%40bridgespcs.org");

    await screen.findByText("Revoke Active Session");
    submitForm();

    await waitFor(() => expect(screen.getByText("Revoke Active Session")).toBeTruthy());
    expect(devitrakApi.post).not.toHaveBeenCalled();
  });

  it("still honours a legacy ?cred= link, so mail already sent keeps working", async () => {
    renderAt("?email=ana%40bridgespcs.org&cred=legacy-pass&timestamp=1");

    await screen.findByText("Revoke Active Session");
    expect(passwordField().value).toBe("legacy-pass");

    submitForm();
    await waitFor(() =>
      expect(devitrakApi.post).toHaveBeenCalledWith("/staff/force-logout", {
        email: "ana@bridgespcs.org",
        password: "legacy-pass",
      })
    );
  });

  it("scrubs a legacy password out of the URL as soon as it is read", async () => {
    // It reached the browser in the link, but it must not survive on this page —
    // not in the address bar, not in a Referer, not behind the back button.
    renderAt("?email=ana%40bridgespcs.org&cred=legacy-pass&timestamp=1");

    await screen.findByText("Revoke Active Session");
    // Sanity: the probe really does see the query string, so a later
    // "does not contain cred" cannot pass by reading an empty string.
    expect(screen.getByTestId("location-search").textContent).toContain("email=");

    await waitFor(() => {
      const current = screen.getByTestId("location-search").textContent;
      expect(current).not.toContain("cred");
      expect(current).not.toContain("legacy-pass");
    });
    // The email and timestamp are still there — only the secret was removed.
    const finalSearch = screen.getByTestId("location-search").textContent;
    expect(finalSearch).toContain("email=ana%40bridgespcs.org");
    expect(finalSearch).toContain("timestamp=1");
    // And the value the user submits is unaffected by the scrub.
    expect(passwordField().value).toBe("legacy-pass");
  });

  it("scrubs the x_cred spelling too", async () => {
    renderAt("?x_email=ana%40bridgespcs.org&x_cred=legacy-pass");

    await screen.findByText("Revoke Active Session");
    await waitFor(() =>
      expect(screen.getByTestId("location-search").textContent).not.toContain("legacy-pass")
    );
    expect(passwordField().value).toBe("legacy-pass");
  });

  it("accepts the x_ prefixed parameter spellings", async () => {
    renderAt("?x_email=ana%40bridgespcs.org");
    expect(await screen.findByText("ana@bridgespcs.org")).toBeTruthy();
  });

  it("sends a link with no email back to login rather than showing a dead form", async () => {
    renderAt("?timestamp=1788220265821");
    expect(await screen.findByTestId("login-page")).toBeTruthy();
    expect(notify).toHaveBeenCalledWith(
      "error",
      "Invalid link. Please click the link from your email again."
    );
  });

  it("surfaces the server's rejection and stays put so the password can be retyped", async () => {
    devitrakApi.post.mockRejectedValue({ response: { data: { msg: "Invalid credentials." } } });
    renderAt("?email=ana%40bridgespcs.org");

    await screen.findByText("Revoke Active Session");
    fireEvent.change(passwordField(), { target: { value: "wrong" } });
    submitForm();

    await waitFor(() => expect(notify).toHaveBeenCalledWith("error", "Invalid credentials."));
    expect(screen.getByText("Revoke Active Session")).toBeTruthy();
  });
});
