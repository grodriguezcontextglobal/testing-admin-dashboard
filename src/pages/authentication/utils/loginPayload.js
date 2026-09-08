/**
 * What a login attempt sends, and what has to be forgotten between steps.
 *
 * Login is three steps over one react-hook-form. `useForm()` is created without
 * `shouldUnregister`, so a field's value survives its input being unmounted —
 * which is the whole of the bug this file fixes: the MFA code stayed in the form
 * after the MFA step was left, and the payload carried it on every later
 * attempt, including the password step.
 *
 * The server then answered "Invalid MFA code" for an attempt where the user had
 * not typed one, and only a page refresh — which is what resets form state —
 * cleared it.
 */

export const LOGIN_STEPS = {
  EMAIL: "email",
  PASSWORD: "password",
  MFA: "mfa",
};

const text = (value) => String(value ?? "").trim();

/**
 * The body POST /api/admin/login takes.
 *
 * `mfaCode` is included only on the MFA step, and only when there is one. On
 * the password step it used to be `data.mfaCode` unconditionally: `undefined`
 * on a first attempt, which axios drops, but whatever the user last typed once
 * they had been through the MFA step in the same page session.
 *
 * The wire format for a password-step attempt is unchanged — the key was absent
 * then and is absent now. Worth knowing that the generated contract lists
 * `mfaCode` as required for this route; a first login has never sent one, so
 * either the generator over-reported or `validateFields` does not enforce it.
 */
export const buildLoginPayload = ({
  step,
  data,
  userEmail,
  userPassword,
  rememberMe,
  forceLogin,
}) => {
  const payload = {
    email: userEmail,
    password: step === LOGIN_STEPS.PASSWORD ? data?.password : userPassword,
    rememberMe: Boolean(rememberMe),
    forceLogin: Boolean(forceLogin),
  };

  const code = text(data?.mfaCode);
  if (step === LOGIN_STEPS.MFA && code) payload.mfaCode = code;

  return payload;
};

/**
 * The form fields that must be blank on arriving at a step.
 *
 * `setValue("mfaCode", "")` appeared exactly once, in the one retry branch. The
 * 401 path, both full resets and the MFA step's own Back button all left the
 * code in the form.
 */
const FIELDS_TO_CLEAR = {
  [LOGIN_STEPS.EMAIL]: ["password", "mfaCode"],
  [LOGIN_STEPS.PASSWORD]: ["mfaCode"],
  [LOGIN_STEPS.MFA]: ["mfaCode"],
};

export const fieldsToClearFor = (step) => FIELDS_TO_CLEAR[step] ?? [];

/**
 * Whether a failed attempt carried a code the user did not type on it.
 *
 * Used to say something true when the server rejects a code that was never
 * entered for this attempt, instead of repeating "Invalid MFA code".
 */
export const wasStaleCodeSent = ({ step, data }) =>
  step !== LOGIN_STEPS.MFA && text(data?.mfaCode).length > 0;
