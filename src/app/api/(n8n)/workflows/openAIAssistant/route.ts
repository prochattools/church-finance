import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'n8n workflow automation is disabled in the current build.',
    },
    { status: 501 }
  );
}
