import { CircleCheck, CircleHelp, ExternalLink, TriangleAlert, XCircle } from "lucide-react";
import Chip from "../../components/UX/Chip/Chip";
import DevitrakLoading from "../../components/animation/DevitrakLoading";
import {
  STATUS_PAGE_URL,
  useServiceStatus,
} from "../../hooks/useServiceStatus";

/**
 * `/status` — the public service-status page.
 *
 * Reachable without a session and registered in both route trees, because a
 * prospect arrives with no account and a customer may already be signed in.
 *
 * This is a sales surface as much as an operational one: it is shown to
 * customers and prospects as evidence that the service is watched and that we
 * say so out loud when it is not. That is the whole argument, and it only works
 * if the page is honest — which is why a request we could not complete reads as
 * "we could not check", never as green. See `useServiceStatus`.
 *
 * The status document is read straight from a worker outside our own
 * infrastructure, so this page keeps answering on the day the rest does not.
 */

const PRESENTATION = {
  operational: {
    label: "Operational",
    chip: "success",
    icon: CircleCheck,
    color: "var(--success-600, #079455)",
    surface: "var(--success-50, #ECFDF3)",
    border: "var(--success-200, #ABEFC6)",
  },
  degraded: {
    label: "Degraded",
    chip: "warning",
    icon: TriangleAlert,
    color: "var(--warning-600, #DC6803)",
    surface: "var(--warning-50, #FFFAEB)",
    border: "var(--warning-200, #FEDF89)",
  },
  down: {
    label: "Down",
    chip: "error",
    icon: XCircle,
    color: "var(--error-600, #D92D20)",
    surface: "var(--error-50, #FEF3F2)",
    border: "var(--error-200, #FECDCA)",
  },
  unknown: {
    label: "Unknown",
    chip: "default",
    icon: CircleHelp,
    color: "var(--gray-600, #475467)",
    surface: "var(--gray-50, #F9FAFB)",
    border: "var(--gray-200, #EAECF0)",
  },
};

const HEADLINE = {
  operational: "All systems operational",
  degraded: "Some systems are degraded",
  down: "We are experiencing an outage",
  unknown: "Service status unavailable",
};

const look = (status) => PRESENTATION[status] ?? PRESENTATION.unknown;

const formatMoment = (iso) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/* A number the worker measured, printed the way it measured it. Components fed
   by internal events carry `null` instead — their history is state changes, not
   time samples — and the contract is explicit that null must not be drawn as
   0% or 100%. The line is omitted. */
const formatUptime = (value) =>
  typeof value === "number" ? `${value.toFixed(2).replace(/\.00$/, "")}% uptime, 90 days` : null;

const ComponentRow = ({ component }) => {
  const presentation = look(component.status);
  const uptime = formatUptime(component.uptime90d);
  const since = formatMoment(component.since);

  return (
    <li
      style={{
        display: "flex",
        gap: "16px",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        padding: "18px 0",
        borderBottom: "1px solid var(--gray-200, #EAECF0)",
      }}
    >
      <div style={{ minWidth: "220px", flex: "1 1 320px" }}>
        <p
          style={{
            margin: 0,
            fontWeight: 600,
            fontSize: "0.9375rem",
            color: "var(--gray-900, #101828)",
          }}
        >
          {component.name}
        </p>
        {component.description && (
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "0.875rem",
              color: "var(--gray-600, #475467)",
            }}
          >
            {component.description}
          </p>
        )}
        {uptime && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "0.8125rem",
              color: "var(--gray-500, #667085)",
            }}
          >
            {uptime}
          </p>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        <Chip label={presentation.label} color={presentation.chip} size="small" />
        {since && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "0.75rem",
              color: "var(--gray-500, #667085)",
            }}
          >
            Since {since}
          </p>
        )}
      </div>
    </li>
  );
};

/* `message` is plain text written by a person. It is rendered as a string, so
   JSX escapes it — never dangerouslySetInnerHTML here. */
const IncidentPanel = ({ incident }) => {
  const updates = Array.isArray(incident.updates) ? incident.updates : [];
  const [latest, ...older] = updates;

  return (
    <section
      style={{
        border: "1px solid var(--warning-200, #FEDF89)",
        background: "var(--warning-25, #FFFCF5)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: latest ? "12px" : 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--gray-900, #101828)",
          }}
        >
          {incident.title}
        </h2>
        {incident.state && (
          <Chip label={incident.state} color="warning" size="small" variant="outlined" />
        )}
      </div>

      {latest && (
        <p
          style={{
            margin: 0,
            fontSize: "0.9375rem",
            lineHeight: 1.6,
            color: "var(--gray-700, #344054)",
          }}
        >
          {latest.message}
        </p>
      )}

      {older.length > 0 && (
        <ul style={{ listStyle: "none", margin: "16px 0 0", padding: 0 }}>
          {older.map((update, index) => (
            <li
              key={`${update.at ?? "update"}-${index}`}
              style={{
                paddingTop: "12px",
                marginTop: "12px",
                borderTop: "1px solid var(--warning-200, #FEDF89)",
                fontSize: "0.875rem",
                color: "var(--gray-600, #475467)",
              }}
            >
              <span style={{ display: "block", fontSize: "0.75rem", marginBottom: "2px" }}>
                {formatMoment(update.at)} · {update.state}
              </span>
              {update.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const ServiceStatusPage = () => {
  const { overall, components, incident, updatedAt, unreachable, isLoading } =
    useServiceStatus();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DevitrakLoading />
      </div>
    );
  }

  const presentation = look(overall);
  const HeadlineIcon = presentation.icon;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--gray-25, #FCFCFD)",
        padding: "48px 16px 64px",
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: "0.8125rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "var(--gray-500, #667085)",
          }}
        >
          Devitrak service status
        </p>

        <section
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            border: `1px solid ${presentation.border}`,
            background: presentation.surface,
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <HeadlineIcon size={32} color={presentation.color} aria-hidden="true" />
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "1.5rem",
                lineHeight: 1.3,
                fontWeight: 600,
                color: "var(--gray-900, #101828)",
              }}
            >
              {HEADLINE[overall] ?? HEADLINE.unknown}
            </h1>
            {unreachable && (
              /* Our own network is the likeliest reason this failed, so the
                 sentence says what we know — that we could not check — and does
                 not accuse the service of being down. */
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "0.875rem",
                  color: "var(--gray-600, #475467)",
                }}
              >
                We could not reach the status service from this browser. This says
                nothing about the service itself.
              </p>
            )}
          </div>
        </section>

        {incident && <IncidentPanel incident={incident} />}

        {components.length > 0 && (
          <section
            style={{
              border: "1px solid var(--gray-200, #EAECF0)",
              background: "var(--base-white, #FFF)",
              borderRadius: "12px",
              padding: "8px 24px 24px",
            }}
          >
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {/* Walked, never hardcoded: the contract says the list grows, and
                  a new component must not need a release from us. */}
              {components.map((component) => (
                <ComponentRow key={component.key} component={component} />
              ))}
            </ul>
          </section>
        )}

        <footer
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            marginTop: "24px",
            fontSize: "0.8125rem",
            color: "var(--gray-500, #667085)",
          }}
        >
          <span>{updatedAt ? `Updated ${formatMoment(updatedAt)}` : "Checked just now"}</span>
          <a
            href={STATUS_PAGE_URL}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--action-600, #155EEF)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Full status history
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </footer>
      </div>
    </main>
  );
};

export default ServiceStatusPage;
