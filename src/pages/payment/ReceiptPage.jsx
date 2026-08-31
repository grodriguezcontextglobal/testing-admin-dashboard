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
  readPaymentIntentFromSearch,
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
 * KNOWN LIMIT — the lookup goes through devitrakApi, which attaches the session
 * headers. If GET /transaction/transaction is auth-protected server-side (not
 * verified here — the backend is owned elsewhere), a logged-out scan gets a 401
 * and the sign-in state below. Making the scan work for a parent needs an
 * unauthenticated read keyed by an unguessable token, not by the payment intent:
 * these receipts carry a name and an email, so a guessable URL is an exposure,
 * not just an inconvenience. That is a backend ask, not something to paper over
 * here.
 */
const ReceiptPage = () => {
  /* Empty for a viewer opening this from a QR scan, which is the point: the
     page serves both, and the letterhead is the part only a member of the
     company can supply. */
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const paymentIntent = readPaymentIntentFromSearch(location.search);

  const receiptQuery = useQuery({
    queryKey: ["receiptTransaction", paymentIntent],
    enabled: Boolean(paymentIntent),
    queryFn: async () => {
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

  if (!paymentIntent) {
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
        description={`No transaction matches ${paymentIntent}. It may have been issued by a different company account.`}
      />
    );
  }

  // No qrValue: the reader is already here, and a QR pointing at the page you
  // are looking at is noise.
  return frame(
    <ReceiptDocument
      receipt={mapTransactionToReceipt(receiptQuery.data, {
        /* Only a signed-in viewer has a company to read. Someone opening this
           from a QR scan is outside the company and gets the receipt without
           its letterhead -- which is the backend ask, not something the client
           can answer. */
        companyLogo: user?.companyData?.company_logo,
      })}
    />
  );
};

export default ReceiptPage;
