import { createHmac, timingSafeEqual } from "node:crypto";

type RequestAccessAction = "approve" | "deny";

export type RequestAccessPayload = {
  name: string;
  email: string;
  role?: string;
  reason: string;
};

const getSecret = () => {
  const secret =
    process.env.REQUEST_ACCESS_SECRET ??
    process.env.APP_SECRET ??
    process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new Error("Request access secret is not configured");
  }
  return secret;
};

const buildPayloadString = (
  email: string,
  action: RequestAccessAction,
  data: string
) => {
  return `${email.trim().toLowerCase()}|${action}|${data}`;
};

export const encodeRequestData = (payload: RequestAccessPayload) => {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
};

export const decodeRequestData = (encoded?: string | null) => {
  if (!encoded) {
    return null;
  }
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as RequestAccessPayload;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.email !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const generateActionToken = (
  email: string,
  action: RequestAccessAction,
  data: string
) => {
  const secret = getSecret();
  return createHmac("sha256", secret)
    .update(buildPayloadString(email, action, data))
    .digest("hex");
};

export const verifyActionToken = (
  email: string,
  action: RequestAccessAction,
  data: string,
  token?: string | null
) => {
  if (!token) return false;
  try {
    const expected = generateActionToken(email, action, data);
    const expectedBuffer = Buffer.from(expected, "hex");
    const providedBuffer = Buffer.from(token, "hex");
    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }
    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
};

export const getAppUrl = (fallbackOrigin?: string) => {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    fallbackOrigin ??
    "http://localhost:3000"
  );
};

export const getAdminEmail = () => process.env.ADMIN_EMAIL;
