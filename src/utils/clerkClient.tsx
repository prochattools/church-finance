import React, { ReactNode } from "react";
import { AUTH_ENABLED } from "@/utils/auth";

type UseUserResponse = {
  isSignedIn: boolean;
  isLoaded: boolean;
  user?: unknown;
};

type ClerkClientExports = {
  ClerkProvider: (props: { children: ReactNode } & Record<string, unknown>) => JSX.Element;
  useUser: () => UseUserResponse;
  SignIn: (props: Record<string, unknown>) => JSX.Element | null;
  SignUp: (props: Record<string, unknown>) => JSX.Element | null;
};

const createStubExports = (): ClerkClientExports => ({
  ClerkProvider: ({ children }: { children: ReactNode } & Record<string, unknown>) => <>{children}</>,
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
  }),
  SignIn: () => null,
  SignUp: () => null,
});

let exportsObject: ClerkClientExports = createStubExports();

if (AUTH_ENABLED) {
  exportsObject = require("@clerk/nextjs");
}

export const ClerkProvider = exportsObject.ClerkProvider;
export const useUser = exportsObject.useUser;
export const SignIn = exportsObject.SignIn;
export const SignUp = exportsObject.SignUp;
