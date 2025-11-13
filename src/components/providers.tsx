'use client';

import { useEffect, useTransition } from "react";
import type { FC, ReactNode } from "react";
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
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    __clerk_internal_invalidateCachePromise?: () => void;
    __unstable__onBeforeSetActive?: () => Promise<void>;
  }
}

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
      <ClerkCacheRefreshPatch />
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

const ClerkCacheRefreshPatch: FC = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!AUTH_ENABLED || typeof window === "undefined") {
      return;
    }

    const previous = window.__unstable__onBeforeSetActive;
    const patched = () =>
      new Promise<void>((resolve) => {
        window.__clerk_internal_invalidateCachePromise = resolve;
        startTransition(() => {
          router.refresh();
        });
      });

    window.__unstable__onBeforeSetActive = patched;

    return () => {
      if (typeof window === "undefined") {
        return;
      }
      window.__unstable__onBeforeSetActive = previous;
    };
  }, [router, startTransition]);

  useEffect(() => {
    if (!AUTH_ENABLED || typeof window === "undefined") {
      return;
    }
    if (!isPending) {
      window.__clerk_internal_invalidateCachePromise?.();
      window.__clerk_internal_invalidateCachePromise = undefined;
    }
  }, [isPending]);

  return null;
};
