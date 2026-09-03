import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import renderingTitle from "../../../../../components/general/renderingTitle";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { ProfileSkeleton } from "../../../../../components/UX/profile";
import "../../../../../styles/global/actionForm.css";

/**
 * Sending this person a password-reset link.
 *
 * The screen was written for the self-service flow and never re-worded: a modal
 * titled "Reset your password" containing a card titled "Reset Password"
 * containing "Enter your email to get a link to reset your password" — three
 * headings, all second person, on a page where an administrator is resetting
 * somebody else's password.
 *
 * The email was an editable field defaulted to the profile's address, and the
 * submit handler was wrapped in `if (adminUserInfoRef.current)` with no `else`.
 * Typing an address that did not match a known account did nothing whatsoever:
 * no request, no message, no closed modal.
 *
 * The target is fixed to the person whose profile this is, shown rather than
 * typed, and the one case that can fail — no account for that address — is
 * stated before the button can be pressed.
 */
const ForgetPasswordLinkFromStaffPage = () => {
  const { profile } = useSelector((state) => state.staffDetail);
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const { notify, contextHolder } = useStatusNotification();
  const [notice, setNotice] = useState(null);

  /**
   * The account behind this profile, looked up by its own email.
   *
   * It used to fetch every admin user in the company and filter, gated on
   * `companyData.companyName` — a field the session does not carry; it is
   * `company_name`. So `enabled` was false, and a disabled query in
   * react-query v4 stays at status "loading" forever: the modal sat on its
   * skeleton with no error and no way out.
   *
   * By email there is nothing to gate on. `profile.email` is what the parent
   * profile requires before it renders anything at all, and one record is all
   * this screen ever needed. The key keeps the `listOfAdminUsers` prefix so the
   * invalidation in StaffDetail still reaches it.
   */
  const adminUsersQuery = useQuery({
    queryKey: ["listOfAdminUsers", profile.email],
    queryFn: () =>
      devitrakApi.post("/staff/admin-users", { email: profile.email }),
    enabled: Boolean(profile.email),
  });

  // The lookup exists to read the account's id and name for the email body, so
  // it is keyed off the profile rather than off a free-text field.
  const account = useMemo(() => {
    const list = adminUsersQuery.data?.data?.adminUsers ?? [];
    const wanted = String(profile.email ?? "").trim().toLowerCase();
    return (
      list.filter(
        (item) => String(item?.email ?? "").trim().toLowerCase() === wanted
      ).at(-1) ?? null
    );
  }, [adminUsersQuery.data, profile.email]);

  const closeModal = () => navigate(`/staff/${profile.adminUserInfo.id}/main`);

  const sendLink = useMutation({
    mutationFn: () =>
      devitrakApi.post("/nodemailer/reset-admin-password", {
        adminUser: { firstName: account.name, lastName: account.lastName },
        linkToResetPassword: `https://admin.devitrak.net/reset-password?uid=${
          account.id
        }&stamp-time=${encodeURI(`${new Date()}`)}`,
        contactInfo: { email: profile.email, company: account.company },
        company_logo: user.companyData.company_logo,
      }),
    onSuccess: (response) => {
      if (!response.data?.ok) {
        return setNotice("The email was not queued. Try again in a moment.");
      }
      notify(
        "success",
        "Reset link queued.",
        `${profile.email} will receive it shortly.`
      );
      closeModal();
    },
    onError: () => setNotice("The email was not queued. Try again in a moment."),
  });

  const body = (
    <div className="action-form">
      {contextHolder}

      {/* `isLoading` alone is not "a request is in flight" in react-query v4:
          a disabled query reports status "loading" forever, so gating a
          spinner on it is how a modal ends up loading with nothing to wait
          for. Pairing it with `isFetching` asks the question that was meant.
          Without a request, the state below is truthful — "Not found", the
          reason, and a button that cannot be pressed. */}
      {adminUsersQuery.isLoading && adminUsersQuery.isFetching ? (
        <ProfileSkeleton lines={2} />
      ) : (
        <>
          <p className="action-form__lead">
            We email a one-time link that lets this person choose a new password.
            Their current password keeps working until they use it.
          </p>

          <dl className="action-form__summary">
            <div>
              <dt>Sending to</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>Account</dt>
              <dd>
                {account
                  ? `${account.name ?? ""} ${account.lastName ?? ""}`.trim() ||
                    profile.email
                  : "Not found"}
              </dd>
            </div>
          </dl>

          {!account && (
            <p className="action-form__notice">
              No account is registered under {profile.email}, so there is nothing
              to reset. This happens when an invitation was never accepted.
            </p>
          )}

          {notice && <p className="action-form__notice">{notice}</p>}

          <div className="action-form__footer">
            <GrayButtonComponent
              title="Cancel"
              buttonType="button"
              disabled={sendLink.isPending}
              func={closeModal}
            />
            <BlueButtonComponent
              title="Send reset link"
              buttonType="button"
              isDisabled={!account || sendLink.isPending}
              isLoading={sendLink.isPending}
              func={() => {
                setNotice(null);
                sendLink.mutate();
              }}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <ModalUX
      title={renderingTitle("Send a password reset link")}
      openDialog
      closeModal={closeModal}
      closable={!sendLink.isPending}
      footer={null}
      width={480}
      body={body}
    />
  );
};

export default ForgetPasswordLinkFromStaffPage;
