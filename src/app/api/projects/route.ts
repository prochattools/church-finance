import prisma from '@/libs/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const user = await currentUser()

		if (!user) {
			throw new Error('user in undefined')
		}

		const projects = await prisma.project.findMany({
			where: {
				user_clerk_id: user.id,
			},
		})

		return NextResponse.json({ success: true, projects })
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
