/**
 * Whether the company sign-up has to go back to its first step for the
 * password.
 *
 * Path A (a new account) posts the password typed in Registration to
 * /registration/new from RegisterCompany. It lives only in memory: the
 * persisted copy of the store never holds it (store/persistTransforms.js), so
 * a reload between the two steps loses it. Path B (`existing`) only adds a
 * company to an account that already has one.
 *
 * @param {object|undefined} user state.admin.user
 */
export const signupNeedsPasswordAgain = (user) => {
  if (!user || typeof user !== "object" || Array.isArray(user)) return true;
  if (user.existing) return false;
  return !user.password;
};

/**
 * Where a finished sign-up goes. The Stripe connected account is created only
 * from Profile -> Stripe, in a signed-in session (2026-11-02); sign-up used to
 * end on a public page that created it without one.
 */
export const SIGNUP_DONE_PATH = "/login";
