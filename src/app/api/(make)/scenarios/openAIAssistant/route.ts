import prisma from '@/libs/prisma'
import { currentUser } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextResponse } from 'next/server'

interface FlowModule {
	id: number
	mapper: Record<string, any>
	parameters: Record<string, any>
	module: string
	version: number
	metadata: Record<string, any>
}

export async function POST(req: Request) {
	try {
		const { id, apiKey, apiOrg, assistantId } = await req.json()
		const user = await currentUser()

		if (!user) {
			throw new Error('User not found')
		}

		const MAKE_API_KEY = process.env.MAKE_API_KEY
		const MAKE_TEAM_ID = process.env.MAKE_TEAM_ID
		const BASE_URL = process.env.MAKE_API_URL
		const date = new Date().toISOString()

		// 1. Create OpenAI connection
		const connectionResponse = await axios.post(
			`${BASE_URL}/connections?teamId=${MAKE_TEAM_ID}`,
			{
				accountName: `OpenAI ${date}`,
				accountType: 'openai-gpt-3',
				apiKey: apiKey,
				apiOrg: apiOrg,
			},
			{ headers: { Authorization: `Token ${MAKE_API_KEY}` } }
		)

		const connectionId = connectionResponse.data.connection.id

		if (!connectionId) {
			throw new Error('Connection ID missed')
		}

		// 2. Create webhook for receiving messages
		const webhookResponse = await axios.post(
			`${BASE_URL}/hooks?teamId=${MAKE_TEAM_ID}`,
			{
				name: `webhook openAI ${date}`,
				team_id: MAKE_TEAM_ID,
				teamId: MAKE_TEAM_ID,
				typeName: 'gateway-webhook',
				method: true,
				headers: true,
				stringify: false,
				interface: [{ name: 'message', type: 'text' }],
			},
			{ headers: { Authorization: `Token ${MAKE_API_KEY}` } }
		)

		const webhookId = webhookResponse.data.hook.id
		const webhookLink = webhookResponse.data.hook.url

		if (!webhookId || !webhookLink) {
			throw Error('hook creating error')
		}

		// 3. Get the blueprint of the source scenario
		const blueprintResponse = await axios.get(
			`${BASE_URL}/scenarios/${id}/blueprint`,
			{
				headers: { Authorization: `Token ${MAKE_API_KEY}` },
			}
		)

		const blueprint = blueprintResponse.data.response.blueprint
		const flow = blueprint.flow as FlowModule[]

		// 4. Update module configurations in the flow
		const updatedFlow = flow.map(module => {
			// Update webhook module with new webhook ID
			if (module.module === 'gateway:CustomWebHook') {
				return {
					...module,
					parameters: {
						...module.parameters,
						hook: webhookId,
					},
				}
			}

			// Update OpenAI module with new connection and assistant ID
			if (module.module === 'openai-gpt-3:messageAssistantAdvanced') {
				return {
					...module,
					parameters: {
						...module.parameters,
						__IMTCONN__: connectionId,
					},
					mapper: {
						...module.mapper,
						assistantId: assistantId,
					},
				}
			}

			return module
		})

		// 5. Create new scenario with updated configuration
		const createResponse = await axios.post(
			`${BASE_URL}/scenarios`,
			{
				name: `Cloned Scenario ${date}`,
				teamId: MAKE_TEAM_ID,
				blueprint: JSON.stringify({
					...blueprint,
					name: `Cloned Scenario ${date}`,
					flow: updatedFlow,
				}),
				scheduling: JSON.stringify({ type: 'indefinitely', interval: 900 }),
				basedon: 20,
			},
			{
				headers: { Authorization: `Token ${MAKE_API_KEY}` },
			}
		)

		const newid = createResponse.data.scenario.id

		if (!newid) {
			throw new Error('Failed to create new scenario')
		}

		// 6. Activate the newly created scenario
		await axios.post(
			`${BASE_URL}/scenarios/${newid}/start`,
			{},
			{
				headers: { Authorization: `Token ${MAKE_API_KEY}` },
			}
		)

		// 7. Store project details in database
		const dbProject = await prisma.project.create({
			data: {
				connection_id: connectionId.toString(),
				webhook_id: webhookId.toString(),
				scenario_id: newid.toString(),
				user_clerk_id: user.id,
				webhookLink: webhookLink,
				assistant_id: assistantId,
				type: 'make',
				status: 'active',
			},
		})

		if (!dbProject) {
			throw new Error('Failed to create project')
		}

		// Return success response with necessary IDs
		return NextResponse.json({
			success: true,
			id: newid,
			webhookLink,
			connectionId,
		})
	} catch (error) {
		// Handle and log any errors during the process
		console.error('Error in scenario cloning process:', error)
		return NextResponse.json(
			{
				success: false,
				error:
					error.response?.data?.message ||
					'Failed to clone and update scenario',
				details: error.response?.data || error.message,
			},
			{ status: error.response?.status || 500 }
		)
	}
}
