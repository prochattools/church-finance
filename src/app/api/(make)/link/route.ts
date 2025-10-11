import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Make.com automations are disabled in this build.',
    },
    { status: 501 }
  );
}
