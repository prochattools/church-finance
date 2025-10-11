import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Billing portal is disabled while authentication is turned off.",
    },
    { status: 503 }
  );
}
