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
 * The page asks for nothing: a valid email in the link is the whole trigger.
 *
 * With MFA mandatory the password proved nothing the sign-in had not already
 * proved, so it is gone. What it also stood in for — possession of the link —
 * is the `token`, which this page posts when the link carries one. Both halves
 * are held here, along with the rule that outlived the redesign: a secret that
 * arrived in the address bar never stays there, and the legacy `cred` is read
 * only to be thrown away.
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

// A request that never settles, so the page stays on screen and an assertion
// about what it shows cannot pass by accident after it has navigated away.
const inFlight = () => new Promise(() => {});

const searchNow = () => screen.getByTestId("location-search").textContent;

describe("ForceLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    devitrakApi.post.mockResolvedValue({ data: { ok: true } });
  });

  it("revokes as soon as the link opens, with nothing to type and nothing to click", async () => {
    renderAt("?email=ana%40bridgespcs.org&timestamp=1788220265821");

    await waitFor(() =>
      expect(devitrakApi.post).toHaveBeenCalledWith("/staff/force-logout", {
        email: "ana@bridgespcs.org",
      })
    );
    expect(await screen.findByTestId("login-page")).toBeTruthy();
    expect(notify).toHaveBeenCalledWith(
      "success",
      "Your previous session has been revoked. You can now log in."
    );
  });

  it("never renders a password field", async () => {
    devitrakApi.post.mockReturnValue(inFlight());
    renderAt("?email=ana%40bridgespcs.org");

    await waitFor(() => expect(devitrakApi.post).toHaveBeenCalled());
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(document.querySelector('input[name="password"]')).toBeNull();
  });

  it("says whose session it is ending while it does it", async () => {
    devitrakApi.post.mockReturnValue(inFlight());
    renderAt("?email=ana%40bridgespcs.org");

    expect(await screen.findByText("ana@bridgespcs.org")).toBeTruthy();
    expect(screen.getByTestId("loading")).toBeTruthy();
  });

  /* Links written before the redesign still carry the password in the query
     string. It is read only so it can be removed — it is not a credential this
     page sends any more. */
  it("never sends a legacy ?cred= password, even when the link still carries one", async () => {
    renderAt("?email=ana%40bridgespcs.org&cred=legacy-pass&timestamp=1");

    await waitFor(() => expect(devitrakApi.post).toHaveBeenCalled());
    expect(devitrakApi.post).toHaveBeenCalledWith("/staff/force-logout", {
      email: "ana@bridgespcs.org",
    });
  });

  it("scrubs a legacy password out of the URL as soon as it is read", async () => {
    // It reached the browser in the link, but it must not survive on this page —
    // not in the address bar, not in a Referer, not behind the back button.
    devitrakApi.post.mockReturnValue(inFlight());
    renderAt("?email=ana%40bridgespcs.org&cred=legacy-pass&timestamp=1");

    // Sanity: the probe really does see the query string, so a later
    // "does not contain cred" cannot pass by reading an empty string.
    await waitFor(() => expect(searchNow()).toContain("email="));
    await waitFor(() => {
      expect(searchNow()).not.toContain("cred");
      expect(searchNow()).not.toContain("legacy-pass");
    });
    // The email and timestamp are still there — only the secret was removed.
    expect(searchNow()).toContain("email=ana%40bridgespcs.org");
    expect(searchNow()).toContain("timestamp=1");
  });

  it("scrubs the x_cred spelling too", async () => {
    devitrakApi.post.mockReturnValue(inFlight());
    renderAt("?x_email=ana%40bridgespcs.org&x_cred=legacy-pass");

    await waitFor(() => expect(searchNow()).not.toContain("legacy-pass"));
  });

  it("sends a link with no email back to login rather than calling the API", async () => {
    renderAt("?timestamp=1788220265821");

    expect(await screen.findByTestId("login-page")).toBeTruthy();
    expect(notify).toHaveBeenCalledWith(
      "error",
      "Invalid link. Please click the link from your email again."
    );
    expect(devitrakApi.post).not.toHaveBeenCalled();
  });

  /* A mangled link is a broken link, and saying so beats posting a string that
     cannot be an address and relaying whatever the API makes of it. */
  it("sends a link whose email is not an address back to login", async () => {
    renderAt("?email=ana%40bridgespcs");

    expect(await screen.findByTestId("login-page")).toBeTruthy();
    expect(devitrakApi.post).not.toHaveBeenCalled();
  });

  it("reads the x_ prefixed parameter spellings", async () => {
    renderAt("?x_email=ana%40bridgespcs.org");

    await waitFor(() =>
      expect(devitrakApi.post).toHaveBeenCalledWith("/staff/force-logout", {
        email: "ana@bridgespcs.org",
      })
    );
  });

  /* Removing the token from the URL feeds a new searchParams straight back into
     the effect that fired the request. Without the guard that is a second
     revoke, caused by the page tidying up after itself. */
  it("revokes once, although scrubbing the URL re-runs the effect", async () => {
    devitrakApi.post.mockReturnValue(inFlight());
    renderAt("?email=ana%40bridgespcs.org&token=one-time-secret&timestamp=1");

    await waitFor(() => expect(searchNow()).not.toContain("one-time-secret"));
    expect(devitrakApi.post).toHaveBeenCalledTimes(1);
  });

  describe("a link that carries a revoke token", () => {
    it("posts the token alongside the email", async () => {
      renderAt("?email=ana%40bridgespcs.org&token=one-time-secret");

      await waitFor(() =>
        expect(devitrakApi.post).toHaveBeenCalledWith("/staff/force-logout", {
          email: "ana@bridgespcs.org",
          token: "one-time-secret",
        })
      );
    });

    /* Same rule as the legacy password: a secret that arrived in the address
       bar must not stay there. */
    it("scrubs the token out of the URL as soon as it is read", async () => {
      devitrakApi.post.mockReturnValue(inFlight());
      renderAt("?email=ana%40bridgespcs.org&token=one-time-secret&timestamp=1");

      await waitFor(() => {
        expect(searchNow()).not.toContain("one-time-secret");
        expect(searchNow()).not.toContain("token");
      });
      expect(searchNow()).toContain("email=ana%40bridgespcs.org");
    });

    it("posts the token it read, not the one the URL no longer has", async () => {
      renderAt("?x_email=ana%40bridgespcs.org&x_token=one-time-secret");

      await waitFor(() =>
        expect(devitrakApi.post).toHaveBeenCalledWith("/staff/force-logout", {
          email: "ana@bridgespcs.org",
          token: "one-time-secret",
        })
      );
    });
  });

  describe("when the revoke fails", () => {
    it("shows the server's own reason instead of a dead loading screen", async () => {
      devitrakApi.post.mockRejectedValue({
        response: { data: { msg: "No active session found." } },
      });
      renderAt("?email=ana%40bridgespcs.org");

      expect(await screen.findByText("No active session found.")).toBeTruthy();
      expect(notify).toHaveBeenCalledWith("error", "No active session found.");
      expect(screen.queryByTestId("login-page")).toBeNull();
    });

    it("offers a retry that sends the same request again, token and all", async () => {
      devitrakApi.post.mockRejectedValueOnce({
        response: { data: { msg: "No active session found." } },
      });
      renderAt("?email=ana%40bridgespcs.org&token=one-time-secret");

      await screen.findByText("No active session found.");
      fireEvent.click(screen.getByRole("button", { name: /Try again/i }));

      await waitFor(() => expect(devitrakApi.post).toHaveBeenCalledTimes(2));
      expect(devitrakApi.post).toHaveBeenLastCalledWith("/staff/force-logout", {
        email: "ana@bridgespcs.org",
        token: "one-time-secret",
      });
    });

    it("falls back to its own wording when the server sends none", async () => {
      devitrakApi.post.mockRejectedValue(new Error("Network Error"));
      renderAt("?email=ana%40bridgespcs.org");

      expect(
        await screen.findByText("Failed to revoke session. Please try again.")
      ).toBeTruthy();
    });
  });
});
