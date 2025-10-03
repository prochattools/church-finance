import { currentUser } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const user = await currentUser()

		if (!user) {
			throw new Error('User not found')
		}

		const scenarios = await axios.get(
			`${process.env.MAKE_API_URL}/scenarios?teamId=${process.env.MAKE_TEAM_ID}`,
			{ headers: { Authorization: `Token ${process.env.MAKE_API_KEY}` } }
		)

		return NextResponse.json({
			success: true,
			scenarios: scenarios.data.scenarios,
		})
	} catch (err) {
		console.error('Connection error:', err)
		if (err) {
			return NextResponse.json({ error: err.message })
		}
		return NextResponse.json(
			{ error: 'An unexpected error occurred' },
			{ status: 500 }
		)
	}
}
