import PropTypes from "prop-types";
import { forwardRef } from "react";
import { useSelector } from "react-redux";
import { getIndustryProfile } from "../../config/industryProfiles";
import { hasPermission, resolveRoleType } from "../../config/roles";
import { Link } from "react-router-dom";
import colorMark from "../../assets/maskable_icon_white_background.png";
import DevitrakWordmark from "../icons/DevitrakWordmark";

/**
 * App footer (Untitled UI style).
 * - `full`: site tree + support + legal columns with bottom bar (main app).
 * - default: minimal copyright line (auth pages keep their quiet footer).
 */

const columnHeading = {
  margin: "0 0 12px",
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--gray-500, #777b73)",
  textAlign: "left",
};

const linkStyle = {
  fontFamily: "Inter, sans-serif",
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: 500,
  color: "var(--gray-600, #5d615a)",
  textDecoration: "none",
  textAlign: "left",
};

const FooterLink = ({ to, href, children }) =>
  to ? (
    <Link to={to} style={linkStyle}>
      {children}
    </Link>
  ) : (
    <a href={href} style={linkStyle}>
      {children}
    </a>
  );

FooterLink.propTypes = {
  to: PropTypes.string,
  href: PropTypes.string,
  children: PropTypes.node.isRequired,
};

const COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Home", to: "/" },
      { label: "Events", to: "/events" },
      { label: "Inventory", to: "/inventory" },
      { label: "Consumers", to: "/consumers" },
      { label: "Staff", to: "/staff" },
      { label: "Posts", to: "/posts" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "FAQs & guides", to: "/posts" },
      { label: "Contact support", href: "mailto:support@devitrak.net" },
      { label: "My profile", to: "/profile/my_details" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Platform policies", to: "/profile/platform_policies" },
      { label: "Terms of use", to: "/profile/platform_policies" },
      { label: "Privacy policy", to: "/profile/platform_policies" },
    ],
  },
];

const FooterComponent = forwardRef(function FooterComponent({ full }, ref) {
  const { user } = useSelector((state) => state.admin);
  const hiddenNavTabs = getIndustryProfile(
    user?.companyData?.industry
  ).hiddenNavTabs;
  // hide product links the company's industry doesn't use (e.g. Consumers
  // for schools — students are the consumers there), and links the user's
  // role can't access (Staff is admin-level — same nav:staff gate as the
  // navbar; the /staff route also redirects unauthorized deep links home)
  const canSeeStaff = hasPermission("nav:staff", resolveRoleType(user));
  const columns = COLUMNS.map((col) =>
    col.heading === "Product"
      ? {
          ...col,
          links: col.links.filter(
            (l) =>
              !hiddenNavTabs.includes(l.label.toLowerCase()) &&
              (l.to !== "/staff" || canSeeStaff)
          ),
        }
      : col
  );
  const year = new Date().getFullYear();

  if (!full) {
    return (
      <p
        ref={ref}
        style={{
          margin: 0,
          padding: "16px 20px",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          color: "var(--gray-500, #777b73)",
          textAlign: "left",
        }}
      >
        © Devitrak {year}
      </p>
    );
  }

  return (
    <footer
      ref={ref}
      style={{
        width: "100%",
        marginTop: "48px",
        borderTop: "1px solid var(--gray-200, #ddded6)",
        background: "var(--base-white, #fff)",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "40px 24px 0",
          display: "flex",
          flexWrap: "wrap",
          gap: "48px",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ maxWidth: "320px", textAlign: "left" }}>
          {/* full colored logo: brand mark + wordmark (per brand guide) */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <img
              src={colorMark}
              alt="Devitrak"
              width={40}
              height={40}
              style={{ margin: "-8px" }}
            />
            <DevitrakWordmark height={20} />
          </span>
          <p
            style={{
              margin: "12px 0 0",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              lineHeight: "20px",
              color: "var(--gray-600, #5d615a)",
            }}
          >
            Device tracking, event logistics, and consumer management for
            rental operations.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "64px" }}>
          {columns.map((col) => (
            <div
              key={col.heading}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <p style={columnHeading}>{col.heading}</p>
              {col.links.map((l) => (
                <FooterLink key={l.label} to={l.to} href={l.href}>
                  {l.label}
                </FooterLink>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          maxWidth: "1400px",
          margin: "32px auto 0",
          padding: "20px 24px",
          borderTop: "1px solid var(--gray-200, #ddded6)",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "var(--gray-500, #777b73)",
          }}
        >
          © {year} Devitrak. All rights reserved.
        </span>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "var(--gray-500, #777b73)",
          }}
        >
          Your Devices. Secured
        </span>
      </div>
    </footer>
  );
});

FooterComponent.propTypes = {
  full: PropTypes.bool,
};

export default FooterComponent;
