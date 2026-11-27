import { Icon } from "@iconify/react";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import "./profileShell.css";

/**
 * Loading and error states, owned by the shell so no page can forget them.
 *
 * The consumer profile previously rendered `undefined` when its query failed —
 * a blank white screen with nothing to read and nothing to click. An error
 * state has to say what broke, whether anything changed, and what to do next.
 */

const BAR_WIDTHS = ["45%", "80%", "62%", "72%", "55%"];

export const ProfileSkeleton = ({ lines, testId }) => (
  <div className="profile-skeleton" data-testid={testId} aria-hidden="true">
    {Array.from({ length: lines }, (_, index) => (
      <span
        // Bars are decorative and positional; index is the only identity.
        key={index}
        className="profile-skeleton__bar"
        style={{ width: BAR_WIDTHS[index % BAR_WIDTHS.length] }}
      />
    ))}
  </div>
);

ProfileSkeleton.propTypes = {
  lines: PropTypes.number,
  testId: PropTypes.string,
};

ProfileSkeleton.defaultProps = {
  lines: 4,
  testId: "profile-skeleton",
};

export const ProfileErrorState = ({ title, description, reference, action, testId }) => (
  <div className="profile-error" role="alert" data-testid={testId}>
    <span className="profile-error__icon">
      <Icon icon="tabler:cloud-off" width={22} />
    </span>
    <p className="profile-error__title">{title}</p>
    {description && <p className="profile-error__description">{description}</p>}
    <ErrorReference value={reference} />
    {action && <div className="profile-error__action">{action}</div>}
  </div>
);

ProfileErrorState.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  // The API's error reference, when the failure carried one: pass
  // `error.errorRef`, which devitrakApi's interceptor attaches.
  reference: PropTypes.string,
  action: PropTypes.node,
  testId: PropTypes.string,
};

ProfileErrorState.defaultProps = {
  title: "Couldn't load this section",
  description: "The service didn't respond. Nothing was changed.",
  reference: null,
  action: null,
  testId: "profile-error",
};

const COPIED_FOR_MS = 1500;

const clipboardAvailable = () =>
  typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function";

/**
 * The reference the API attached to a failure (api/errorReference.js), shown
 * so the person who hit it can repeat it.
 *
 * Two deliberate choices. It is **secondary**: the user does not care about
 * `a3f91c2b4e07`, they care that it failed, so this sits under the message and
 * never in the title. And it is **copyable**: twelve hex characters get
 * transcribed wrong by hand, and a wrong reference is worse than none because
 * it sends someone to read the wrong log.
 *
 * Where the clipboard is unavailable — an insecure origin, a browser that
 * refuses it — the button is not rendered at all rather than rendered dead.
 * The reference is on screen and selectable either way.
 */
export const ErrorReference = ({ value, testId }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), COPIED_FOR_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!value) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // A denied clipboard is not worth an error state of its own.
      setCopied(false);
    }
  };

  return (
    <p className="profile-error__reference" data-testid={testId}>
      <span>Reference</span>
      <code className="profile-error__reference-value">{value}</code>
      {clipboardAvailable() && (
        <button
          type="button"
          className="profile-error__copy"
          onClick={copy}
          aria-label={`Copy error reference ${value}`}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </p>
  );
};

ErrorReference.propTypes = {
  value: PropTypes.string,
  testId: PropTypes.string,
};

ErrorReference.defaultProps = {
  value: null,
  testId: "error-reference",
};
