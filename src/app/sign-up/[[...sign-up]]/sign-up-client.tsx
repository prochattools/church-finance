"use client";

import { ReactNode, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getAfterSignUpUrl } from "@/utils/auth";

type SignUpClientProps = {
  children: (redirectUrl: string) => ReactNode;
};

const DEFAULT_REDIRECT = (() => {
  const configured = getAfterSignUpUrl();
  return configured.startsWith("/") ? configured : "/ledger";
})();

export default function SignUpClient({ children }: SignUpClientProps) {
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

  return <>{children(redirectUrl)}</>;
}
