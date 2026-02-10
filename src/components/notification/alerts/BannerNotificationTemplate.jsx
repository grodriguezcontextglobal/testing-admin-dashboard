// import { Grid, Typography } from "@mui/material";
// import { Card } from "antd";
// import { CardStyle } from "../../../styles/global/CardStyle";
// import { Title } from "../../../styles/global/Title";
// import { Subtitle } from "../../../styles/global/Subtitle";
// import { BorderedCloseIcon } from "../../icons/BorderedCloseIcon";
// import { CloseIcon } from "../../icons/CloseIcon";
// import { InformationIcon } from "../../icons/InformationIcon";
// import CenteringGrid from "../../../styles/global/CenteringGrid";

// const BannerNotificationTemplate = ({
//   setNotificationStatus,
//   title,
//   body,
//   category = 0,
// }) => {
  
//   return (
//     <Card
//       style={{
//         ...CardStyle,
//         ...CenteringGrid,
//         padding: "5px 16px",
//         border: "1px solid var(--gray-200)",
//         boxShadow:
//           "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
//         background:
//           category > 0
//             ? "var(--pending-leased-equip-alert)"
//             : "var(--basewhite)",
//       }}
//       styles={{
//         body: { ...CenteringGrid, padding: "0px 0px 5px 0px" },
//       }}
//       // bodyStyle={{ ...CenteringGrid, padding: 0 }}
//     >
//       <Grid container>
//         <Grid style={{ ...CenteringGrid }} container>
//           <div
//             style={{
//               fontSize: "25px",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "flex-end",
//               width: "fit-content",
//               padding: "15px 5px 10px 0",
//               alignSelf: "flex-start",
//             }}
//           ></div>
//           <Grid item xs={12} sm={12} md={10} lg={10}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 width: "100%",
//               }}
//             >
//               <Typography
//                 style={{
//                   ...Title,
//                   padding: "",
//                   fontSize: "14px",
//                   width: "100%",
//                   textWrap: "pretty",
//                 }}
//               >
//                 <span
//                   style={{
//                     marginRight: "5px",
//                     fontSize: "18px",
//                     alignSelf: "baseline",
//                   }}
//                 >
//                   <InformationIcon />
//                 </span>
//                 &nbsp;
//                 {title}
//               </Typography>
//               <Typography
//                 onClick={() => setNotificationStatus(false)}
//                 style={{
//                   cursor: "pointer",
//                   fontWeight: 900,
//                   height: "15px",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                 }}
//               >
//                 <CloseIcon />
//               </Typography>
//             </div>

//             <Typography
//               style={{
//                 ...Subtitle,
//                 fontSize: "14px",
//                 width: "100%",
//                 textWrap: "pretty",
//               }}
//             >
//               {body}
//             </Typography>
//           </Grid>
//         </Grid>
//         <Grid
//           sx={{
//             ...CenteringGrid,
//             justifyContent: "flex-start",
//             padding: {
//               sx: "1rem 0",
//               sm: "1rem 0",
//               md: "1rem 0 0 0.5rem",
//               lg: "1rem 0 0 0.5rem",
//             },
//             cursor: "pointer",
//           }}
//           item
//           xs={12}
//           sm={12}
//           md={10}
//           lg={10}
//         >
//           {/* <div
//             onClick={() => setNotificationStatus(false)}
//             style={{
//               color: "var(--blue700)",
//               fontWeight: 900,
//               height: "15px",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           ></div>
//           &nbsp; */}
//           <Typography
//             onClick={() => setNotificationStatus(false)}
//             style={{ color: "var(--blue700)", alignContent: "baseline" }}
//           >
//             <button
//               key={"button-dismiss"}
//               id="button-dismiss"
//               className="transparentButton"
//             >
//               <BorderedCloseIcon
//                 fill="var(--blue700)"
//                 style={{
//                   alignSelf: "baseline",
//                   height: "15px",
//                 }}
//               />
//             </button>
//             &nbsp; <span style={{ height:"fit-content", alignSelf:"flex-start" }}>Dismiss the notification</span>
//           </Typography>
//         </Grid>
//       </Grid>
//     </Card>
//   );
// };

// export default BannerNotificationTemplate;

import { useMemo } from "react";
import { Typography } from "@mui/material";
import { Card } from "antd";

import { Title } from "../../../styles/global/Title";
import { Subtitle } from "../../../styles/global/Subtitle";
import CenteringGrid from "../../../styles/global/CenteringGrid";

import { CloseIcon } from "../../icons/CloseIcon";
import { InformationIcon } from "../../icons/InformationIcon";
import { BorderedCloseIcon } from "../../icons/BorderedCloseIcon";

/**
 * UntitledUI-like Alert (floating)
 * - Compact, rounded, subtle border + shadow
 * - Left icon, title + body, close icon on the right
 * - Optional footer action (Dismiss)
 *
 * Props:
 * - open: boolean (optional). If you control visibility externally, pass open + onClose
 * - onClose: function
 * - title: string | ReactNode
 * - body: string | ReactNode
 * - variant: "default" | "brand" | "gray" | "error" | "warning" | "success"
 * - showDismissAction: boolean
 *
 * Backward-compatible:
 * - setNotificationStatus(false) is supported if provided
 * - category: number -> maps to "brand" when category > 0
 */
const BannerNotificationTemplate = ({
  open = true,
  onClose,
  setNotificationStatus,
  title,
  body,
  category = 0,
  variant,
  showDismissAction = true,
}) => {
  const resolvedVariant = useMemo(() => {
    if (variant) return variant;
    return category > 0 ? "brand" : "gray"; // closer to UntitledUI “floating gray/brand”
  }, [variant, category]);

  const handleClose = () => {
    if (typeof onClose === "function") onClose();
    if (typeof setNotificationStatus === "function") setNotificationStatus(false);
  };

  const VARIANTS = {
    default: {
      background: "var(--basewhite)",
      border: "var(--gray-200)",
      iconColor: "var(--gray-600)",
      titleColor: "var(--gray-900)",
      bodyColor: "var(--gray-600)",
      actionColor: "var(--blue700)",
    },
    brand: {
      background: "var(--pending-leased-equip-alert)",
      border: "var(--gray-200)",
      iconColor: "var(--blue700)",
      titleColor: "var(--gray-900)",
      bodyColor: "var(--gray-700)",
      actionColor: "var(--blue700)",
    },
    gray: {
      background: "var(--basewhite)",
      border: "var(--gray-200)",
      iconColor: "var(--gray-600)",
      titleColor: "var(--gray-900)",
      bodyColor: "var(--gray-600)",
      actionColor: "var(--blue700)",
    },
    error: {
      background: "var(--basewhite)",
      border: "var(--error-200)",
      iconColor: "var(--error-600)",
      titleColor: "var(--gray-900)",
      bodyColor: "var(--gray-600)",
      actionColor: "var(--error-700)",
    },
    warning: {
      background: "var(--basewhite)",
      border: "var(--warning-200)",
      iconColor: "var(--warning-600)",
      titleColor: "var(--gray-900)",
      bodyColor: "var(--gray-600)",
      actionColor: "var(--warning-700)",
    },
    success: {
      background: "var(--basewhite)",
      border: "var(--success-200)",
      iconColor: "var(--success-600)",
      titleColor: "var(--gray-900)",
      bodyColor: "var(--gray-600)",
      actionColor: "var(--success-700)",
    },
  };

  const v = VARIANTS[resolvedVariant] ?? VARIANTS.gray;

  if (!open) return null;

  return (
    <Card
      style={{
        ...CenteringGrid,
        width: "100%",
        borderRadius: "12px",
        padding: "12px 14px",
        border: `1px solid ${v.border}`,
        background: v.background,
        boxShadow:
          "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
      }}
      styles={{
        body: {
          padding: 0,
          width: "100%",
        },
      }}
    >
      {/* Header row (icon + title/body + close) */}
      <div style={{ display: "flex", gap: 12, width: "100%" }}>
        {/* Left icon */}
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "flex-start",
            paddingTop: "12px",
            color: v.iconColor,
          }}
          aria-hidden="true"
        >
          <span style={{ display: "inline-flex", fontSize: 35 }}>
            <InformationIcon />
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <Typography
            style={{
              ...Title,
              padding:"12px 0",
              display: "flex", justifyContent: "flex-start",
              fontSize: "14px",
              lineHeight: "20px",
              margin: 0,
              color: v.titleColor,
              textWrap: "pretty",
              textAlign: "left",
            }}
          >
            {title}
          </Typography>

          <Typography
            style={{
              ...Subtitle,
              fontSize: "14px",
              lineHeight: "20px",
              marginTop: 4,
              marginBottom: 0,
              color: v.bodyColor,
              textWrap: "pretty",
            }}
          >
            {body}
          </Typography>

          {/* Footer action (UntitledUI often shows a subtle action) */}
          {showDismissAction ? (
            <div style={{ marginTop: 10, width: "100%", display: "flex", justifyContent: "flex-start" }}>
              <button
                type="button"
                onClick={handleClose}
                className="transparentButton"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: v.actionColor,
                  fontWeight: 600,
                }}
              >
                <BorderedCloseIcon
                  fill={v.actionColor}
                  style={{ height: 15, width: 15 }}
                />
                <span style={{ lineHeight: "20px" }}>Dismiss the notification</span>
              </button>
            </div>
          ) : null}
        </div>

        {/* Close icon */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close alert"
          className="transparentButton"
          style={{
            flex: "0 0 auto",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 2,
            marginTop: 2,
          }}
        >
          <CloseIcon />
        </button>
      </div>
    </Card>
  );
};

export default BannerNotificationTemplate;
