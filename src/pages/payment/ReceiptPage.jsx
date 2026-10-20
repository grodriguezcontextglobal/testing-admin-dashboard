import { useQuery } from "@tanstack/react-query";
import { Alert } from "antd";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import DevitrakLoading from "../../components/animation/DevitrakLoading";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import ReceiptDocument from "./components/ReceiptDocument";
import {
  mapTransactionToReceipt,
  publicReceiptToTransaction,
  readPaymentIntentFromSearch,
  readReceiptLogoFromSearch,
  readReceiptTokenFromSearch,
} from "./utils/receiptUtils";

/**
 * The page a receipt QR opens.
 *
 * Registered in BOTH route trees. App.jsx picks AuthRoutes or NoAuthRoutes from
 * the session, and AuthRoutes' catch-all is the error page — so a route living
 * in only one tree would send half the people who scan the code to a dead end,
 * depending on whether they happen to be logged in.
 *
 * Deliberately reads nothing from Redux: someone arriving from a phone camera
 * has no store, no company context and possibly no session.
 *
 * Its job is to show the CURRENT state of the transaction, which is what makes
 * a void visible after the paper copy was already handed over.
 *
 * Two reads (server FRONTEND_receipt_link_2026-10-20.md):
 * - Without a session and with a signed token (`rt`) on the link:
 *   GET /transaction/receipt?rt=…, a reduced receipt with no consumer name or
 *   email. A 401 there means the link expired.
 * - Otherwise GET /transaction/transaction?paymentIntent=…, the full document.
 *   Once the server's RECEIPT_PUBLIC_READ_MODE is `enforce` it answers only
 *   signed-in staff, so a QR printed before the token existed shows the sign-in
 *   state below.
 */
const ReceiptPage = () => {
  /* Empty for a viewer opening this from a QR scan, which is the point: the
     page serves both. The letterhead then comes off the link instead. */
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const paymentIntent = readPaymentIntentFromSearch(location.search);
  const receiptToken = readReceiptTokenFromSearch(location.search);
  // Staff with a session keep the full document, consumer included.
  const readSigned = Boolean(receiptToken) && !user?.uid;

  const receiptQuery = useQuery({
    queryKey: ["receiptTransaction", paymentIntent, readSigned ? receiptToken : null],
    enabled: Boolean(paymentIntent || readSigned),
    queryFn: async () => {
      if (readSigned) {
        const response = await devitrakApi.get(
          `/transaction/receipt?rt=${encodeURIComponent(receiptToken)}`
        );
        return publicReceiptToTransaction(response?.data?.receipt);
      }
      const response = await devitrakApi.get(
        `/transaction/transaction?paymentIntent=${encodeURIComponent(
          paymentIntent
        )}`
      );
      // The endpoint answers with { ok, list: [...] }; an ok response with an
      // empty list means the id is well-formed but unknown, which is a
      // different message from a failed request.
      return response?.data?.list?.[0] ?? null;
    },
    retry: 1,
  });

  const frame = (children) => (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        minHeight: "100dvh",
        padding: "24px",
      }}
    >
      {children}
    </main>
  );

  if (!paymentIntent && !readSigned) {
    return frame(
      <Alert
        type="error"
        showIcon
        message="No receipt in this link"
        description="The QR code did not include a transaction reference. Ask for a fresh copy of the receipt."
      />
    );
  }

  if (receiptQuery.isLoading) {
    return frame(<DevitrakLoading />);
  }

  if (receiptQuery.isError) {
    const status = receiptQuery.error?.response?.status;
    if (readSigned && (status === 401 || status === 404)) {
      return frame(
        <Alert
          type="warning"
          showIcon
          message={status === 401 ? "This receipt link has expired" : "Receipt not found"}
          description="Ask the company for a fresh copy of the receipt."
        />
      );
    }
    const needsSignIn = status === 401 || status === 403;
    return frame(
      <>
        <Alert
          type={needsSignIn ? "info" : "error"}
          showIcon
          message={needsSignIn ? "Sign in to view this receipt" : "Couldn't load this receipt"}
          description={
            needsSignIn
              ? "This receipt is only visible to staff signed in to the company account."
              : "The transaction service didn't respond. The receipt itself is unchanged — try again in a moment."
          }
        />
        {!needsSignIn && (
          <BlueButtonComponent
            title={"Try again"}
            func={() => receiptQuery.refetch()}
          />
        )}
      </>
    );
  }

  if (!receiptQuery.data) {
    return frame(
      <Alert
        type="warning"
        showIcon
        message="Receipt not found"
        description={`No transaction matches ${paymentIntent || "this link"}. It may have been issued by a different company account.`}
      />
    );
  }

  // No qrValue: the reader is already here, and a QR pointing at the page you
  // are looking at is noise.
  return frame(
    <ReceiptDocument
      receipt={mapTransactionToReceipt(receiptQuery.data, {
        /* Signed in, the logo comes from the session. Opened from a QR scan or
           a link out of an email there is no session, so it comes from the
           link itself -- put there by whoever printed or sent the receipt, and
           accepted only when it points at our own image host. */
        companyLogo:
          user?.companyData?.company_logo ||
          readReceiptLogoFromSearch(location.search),
      })}
    />
  );
};

export default ReceiptPage;
