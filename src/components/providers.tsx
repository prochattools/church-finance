'use client';

import { ReactNode } from "react";
import { ClerkProvider } from "@/utils/clerkClient";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import { LedgerProvider } from "@/context/ledger-context";
import {
  AUTH_ENABLED,
  getPublishableKey,
  getSignInUrl,
  getSignUpUrl,
} from "@/utils/auth";

export function Providers({ children }: { children: ReactNode }) {
  if (!AUTH_ENABLED) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <LedgerProvider>
          <div className="min-h-screen bg-background">{children}</div>
        </LedgerProvider>

        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            className: "text-sm dark:bg-black dark:text-white",
          }}
        />

        <Tooltip id="tooltip" className="z-[60] !opacity-100 max-w-sm shadow-lg" />
      </ThemeProvider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={getPublishableKey()}
      signInUrl={getSignInUrl()}
      signUpUrl={getSignUpUrl()}
      fallbackRedirectUrl="/ledger"
      signInFallbackRedirectUrl="/ledger"
      signUpFallbackRedirectUrl="/ledger"
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <LedgerProvider>
          <div className="min-h-screen bg-background">{children}</div>
        </LedgerProvider>
      </ThemeProvider>

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          className: "text-sm dark:bg-black dark:text-white",
        }}
      />

      <Tooltip id="tooltip" className="z-[60] !opacity-100 max-w-sm shadow-lg" />
    </ClerkProvider>
  );
}
