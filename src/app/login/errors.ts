// Shared by the login page (server) and the login form (client).

/** Keys of t.login used for sign-in errors. Kept as keys so the text follows a language switch. */
export type LoginErrorKey = "errorInvalid" | "errorDemo" | "errorGeneric";

/**
 * Auth.js reports "CredentialsSignin" only for a wrong email or password. Anything else
 * ("Configuration" when authorize() throws, "MissingCSRF", …) is not the reader's fault.
 */
export function loginErrorKey(authError: string): LoginErrorKey {
  return authError === "CredentialsSignin" ? "errorInvalid" : "errorGeneric";
}
