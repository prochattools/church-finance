import { SignIn } from "@/utils/clerkClient";
import { Suspense } from "react";
import SignInClient from "./sign-in-client";
import { AUTH_ENABLED } from "@/utils/auth";

export default function Page() {
  if (!AUTH_ENABLED) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="max-w-md space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-[0_24px_90px_-50px_rgba(49,112,255,0.85)] backdrop-blur-2xl">
          <h1 className="text-xl font-semibold text-white">Authentication disabled</h1>
          <p className="text-sm text-white/70">
            Clerk authentication is turned off in this development build. Add real Clerk keys to enable sign-in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_24px_90px_-50px_rgba(49,112,255,0.85)] backdrop-blur-2xl">
        <Suspense
          fallback={
            <div className="space-y-4 text-center text-sm text-white/70">
              Preparing secure sign-in…
            </div>
          }
        >
          <SignInClient>
            {(redirectUrl) => <SignIn forceRedirectUrl={redirectUrl} />}
          </SignInClient>
        </Suspense>
      </div>
    </div>
  );
}
