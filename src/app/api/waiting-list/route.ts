import { resendService } from '@/libs/resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
	const { email } = (await req.json()) as { email?: string }

	if (!email) {
		return NextResponse.json({ error: 'Email is required' }, { status: 400 })
	}

	try {
		const createdContact = await resendService.addNewEmailAddress(email)

		return NextResponse.json(
			{},
			{ status: 200, statusText: 'Contact created: ' + createdContact.data.id }
		)
	} catch (e) {
		console.error(e)
		return NextResponse.json(
			{ error: 'Error in contactcreated' },
			{ status: 500 }
		)
	}
}
