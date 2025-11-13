"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { SignIn } from "@/utils/clerkClient";

const DEFAULT_REDIRECT = "/ledger";

export default function SignInClient() {
  const searchParams = useSearchParams();

  const redirectUrl = useMemo(() => {
    const param = searchParams?.get("redirect_url");
    if (!param) {
      return DEFAULT_REDIRECT;
    }

    try {
      const decoded = decodeURIComponent(param);
      return decoded.startsWith("/") ? decoded : DEFAULT_REDIRECT;
    } catch {
      return DEFAULT_REDIRECT;
    }
  }, [searchParams]);

  return <SignIn forceRedirectUrl={redirectUrl} />;
}
