import prisma from '@/libs/prisma'
import { currentUser } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
	try {
		const user = await currentUser()
		const { projectId } = await req.json() as { projectId: string }

		if (!user || !projectId) {
			return NextResponse.json(
				{ error: 'Unauthorized or missing project ID' },
				{ status: 401 }
			)
		}

		// Get the project to find the scenario ID
		const project = await prisma.project.findUnique({
			where: {
				id: projectId,
			},
		})

		if (!project || !project.scenario_id) {
			return NextResponse.json(
				{ error: 'Project or scenario not found' },
				{ status: 404 }
			)
		}

		if(project.status == 'active') {
			const disActivateResponse = await axios.post(
				`https://eu2.make.com/api/v2/scenarios/${project.scenario_id}/stop`,
				{},
				{
					headers: {
						Authorization: `Token ${process.env.MAKE_API_KEY}`,
					},
				}
			)

			if (!disActivateResponse.data.scenario) {
				throw new Error('Failed to deactivate scenario')
			}

			const dbProject = await prisma.project.update({
				where: {
					id: projectId,
				},
				data: {
					status: 'inactive',
				},
			})

			if (!dbProject) {
				throw new Error('Failed to update project')
			}
		} else {
			const activateResponse = await axios.post(
				`https://eu2.make.com/api/v2/scenarios/${project.scenario_id}/start`,
				{},
				{
					headers: {
						Authorization: `Token ${process.env.MAKE_API_KEY}`,
					},
				}
			)

			if (!activateResponse.data.scenario) {
				throw new Error('Failed to deactivate scenario')
			}

			const dbProject = await prisma.project.update({
				where: {
					id: projectId,
				},
				data: {
					status: 'active',
				},
			})

			if (!dbProject) {
				throw new Error('Failed to update project')
			}
		}

		return NextResponse.json({
			success: true,
		})
	} catch (err) {
		console.error('Activation error:', err)
		return NextResponse.json(
			{ error: 'Failed to activate scenario' },
			{ status: 500 }
		)
	}
}

export async function GET(req: NextRequest) {
	try {
		const user = await currentUser()
		const { searchParams } = new URL(req.url)

		const project = await prisma.project.findUnique({
			where: {
				id: searchParams.get('id'),
			},
		})

		const scenarioId = project.scenario_id

		if (!user || !scenarioId) {
			throw new Error('Something went wrong')
		}

		const checkStatus = await axios.get(
			`https://eu2.make.com/api/v2/scenarios/${scenarioId}`,
			{ headers: { Authorization: `Token ${process.env.MAKE_API_KEY}` } }
		)

		if (!checkStatus.data.scenario.id) {
			throw Error('check status error')
		}

		const { isActive } = checkStatus.data.scenario

		return NextResponse.json({ success: true, isActive })
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
