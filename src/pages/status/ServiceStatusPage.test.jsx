import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ServiceStatusPage from "./ServiceStatusPage";
import { STATUS_PAGE_URL, useServiceStatus } from "../../hooks/useServiceStatus";

/**
 * `/status` is public and shown to customers and prospects as evidence that the
 * service is watched. `useServiceStatus` has its own tests for reading the
 * document; these pin what the page does with it, which is where the three
 * promises the page makes are actually kept or broken:
 *
 *  - a component with `uptime90d: null` shows no uptime line, never 0% or 100%;
 *  - `unknown`, or any status the page does not know, is never drawn green;
 *  - an incident message is text written by a person and is rendered escaped.
 */
vi.mock("../../hooks/useServiceStatus", async (importOriginal) => ({
  ...(await importOriginal()),
  useServiceStatus: vi.fn(),
}));

vi.mock("../../components/animation/DevitrakLoading", () => ({
  default: () => <div data-testid="loading" />,
}));

// The chip's colour is the claim the page makes about a component.
vi.mock("../../components/UX/Chip/Chip", () => ({
  default: ({ label, color }) => (
    <span data-testid="chip" data-color={color}>
      {label}
    </span>
  ),
}));

const component = (overrides) => ({
  key: "api",
  name: "API",
  description: "",
  status: "operational",
  uptime90d: null,
  since: null,
  ...overrides,
});

const status = (overrides) => ({
  overall: "operational",
  components: [],
  incident: null,
  updatedAt: null,
  unreachable: false,
  isLoading: false,
  ...overrides,
});

const rowOf = (name) => screen.getByText(name).closest("li");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ServiceStatusPage", () => {
  it("shows the loader and nothing else while the document loads", () => {
    useServiceStatus.mockReturnValue(status({ isLoading: true }));
    render(<ServiceStatusPage />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("says all systems are operational when they are", () => {
    useServiceStatus.mockReturnValue(status({ components: [component()] }));
    render(<ServiceStatusPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "All systems operational"
    );
    expect(within(rowOf("API")).getByTestId("chip")).toHaveAttribute("data-color", "success");
  });

  describe("uptime", () => {
    it("omits the line when the component has no measured uptime", () => {
      useServiceStatus.mockReturnValue(status({ components: [component({ uptime90d: null })] }));
      render(<ServiceStatusPage />);
      expect(screen.queryByText(/uptime/)).not.toBeInTheDocument();
      expect(screen.queryByText(/0%|100%/)).not.toBeInTheDocument();
    });

    it("prints a measured uptime as measured, trimming a bare .00", () => {
      useServiceStatus.mockReturnValue(
        status({
          components: [
            component({ key: "api", name: "API", uptime90d: 99.951 }),
            component({ key: "web", name: "Dashboard", uptime90d: 100 }),
          ],
        })
      );
      render(<ServiceStatusPage />);
      expect(within(rowOf("API")).getByText("99.95% uptime, 90 days")).toBeInTheDocument();
      expect(within(rowOf("Dashboard")).getByText("100% uptime, 90 days")).toBeInTheDocument();
    });
  });

  describe("never green without knowing", () => {
    it("draws an unknown component grey, labelled Unknown", () => {
      useServiceStatus.mockReturnValue(
        status({ overall: "degraded", components: [component({ status: "unknown" })] })
      );
      render(<ServiceStatusPage />);
      const chip = within(rowOf("API")).getByTestId("chip");
      expect(chip).toHaveTextContent("Unknown");
      expect(chip).not.toHaveAttribute("data-color", "success");
    });

    it("treats a status it has never heard of as unknown", () => {
      useServiceStatus.mockReturnValue(
        status({ overall: "maintenance", components: [component({ status: "maintenance" })] })
      );
      render(<ServiceStatusPage />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Service status unavailable"
      );
      expect(within(rowOf("API")).getByTestId("chip")).toHaveTextContent("Unknown");
    });

    /* Our own network is the likeliest cause: the page says it could not
       check, and does not claim the service is down. */
    it("says it could not check when the worker was unreachable", () => {
      useServiceStatus.mockReturnValue(status({ overall: "unknown", unreachable: true }));
      render(<ServiceStatusPage />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Service status unavailable"
      );
      expect(screen.getByText(/could not reach the status service/)).toBeInTheDocument();
      expect(screen.queryByText(/outage/i)).not.toBeInTheDocument();
    });

    it("names an outage when the document says the service is down", () => {
      useServiceStatus.mockReturnValue(
        status({ overall: "down", components: [component({ status: "down" })] })
      );
      render(<ServiceStatusPage />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "We are experiencing an outage"
      );
      expect(within(rowOf("API")).getByTestId("chip")).toHaveAttribute("data-color", "error");
    });
  });

  describe("incident", () => {
    it("renders the message as text, never as markup", () => {
      const message = '<img src=x onerror="alert(1)"> Database <b>slow</b>';
      useServiceStatus.mockReturnValue(
        status({
          overall: "degraded",
          incident: {
            title: "Slow responses",
            state: "investigating",
            updates: [{ at: "2026-10-05T10:00:00Z", state: "investigating", message }],
          },
        })
      );
      const { container } = render(<ServiceStatusPage />);
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector("b")).toBeNull();
    });

    it("shows the latest update first and the older ones below it", () => {
      useServiceStatus.mockReturnValue(
        status({
          overall: "degraded",
          incident: {
            title: "Slow responses",
            state: "monitoring",
            updates: [
              { at: "2026-10-05T11:00:00Z", state: "monitoring", message: "A fix is out." },
              { at: "2026-10-05T10:00:00Z", state: "investigating", message: "Looking into it." },
            ],
          },
        })
      );
      render(<ServiceStatusPage />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Slow responses");
      const latest = screen.getByText("A fix is out.");
      const older = screen.getByText(/Looking into it\./);
      expect(latest.compareDocumentPosition(older) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("has no incident panel when there is no incident", () => {
      useServiceStatus.mockReturnValue(status());
      render(<ServiceStatusPage />);
      expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    });
  });

  /* The contract says the list grows: a new component must not need a release. */
  it("lists every component the document carries, including new ones", () => {
    useServiceStatus.mockReturnValue(
      status({
        components: [
          component({ key: "api", name: "API" }),
          component({ key: "payments-2027", name: "Payments (new)" }),
        ],
      })
    );
    render(<ServiceStatusPage />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Payments (new)")).toBeInTheDocument();
  });

  it("links to the full history and says when it last checked", () => {
    useServiceStatus.mockReturnValue(status());
    render(<ServiceStatusPage />);
    const link = screen.getByRole("link", { name: /full status history/i });
    expect(link).toHaveAttribute("href", STATUS_PAGE_URL);
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByText("Checked just now")).toBeInTheDocument();
  });
});
