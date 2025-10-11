import { NextResponse, NextRequest } from "next/server";

// Stripe webhooks are currently disabled while we strip out billing and auth.
export async function POST(_: NextRequest) {
  return NextResponse.json(
    {
      message: "Stripe integration temporarily disabled.",
    },
    { status: 200 }
  );
}
