const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const secretKey = process.env.CLERK_SECRET_KEY ?? "";

const isStubKey = (key: string) =>
  key.startsWith("pk_stub_") ||
  key.startsWith("sk_stub_") ||
  key === "pk_test_dummy" ||
  key === "sk_test_dummy";

const isValidPublishableKey = (key: string) =>
  key.startsWith("pk_") && key.length > 20 && !isStubKey(key);

const isValidSecretKey = (key: string) =>
  key.startsWith("sk_") && key.length > 20 && !isStubKey(key);

export const AUTH_ENABLED =
  isValidPublishableKey(publishableKey) && isValidSecretKey(secretKey);

export const getPublishableKey = () => publishableKey;
export const getSignInUrl = () =>
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";
export const getSignUpUrl = () =>
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up";
export const getAfterSignInUrl = () =>
  process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? "/ledger";
export const getAfterSignUpUrl = () =>
  process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL ?? "/ledger";

const buildUrlWithRedirect = (baseUrl: string, redirectTarget: string) => {
  if (!redirectTarget) {
    return baseUrl;
  }

  const params = new URLSearchParams({ redirect_url: redirectTarget });
  return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${params.toString()}`;
};

export const resolveSignInUrl = (redirectTarget: string) =>
  buildUrlWithRedirect(getSignInUrl(), redirectTarget);

export const resolveSignUpUrl = (redirectTarget: string) =>
  buildUrlWithRedirect(getSignUpUrl(), redirectTarget);
