import prisma from '@/libs/prisma'
import { currentUser } from '@clerk/nextjs/server'
import axios from 'axios'
import { NextResponse } from 'next/server'

interface WorkflowNode {
	id: string
	parameters: Record<string, any>
	name: string
	type: string
	typeVersion: number
	position: [number, number]
	credentials?: Record<string, any>
}

interface N8nCredentials {
	name: string
	type: string
	data: Record<string, string>
}

export async function POST(req: Request) {
	try {
		const { id, apiKey, assistantId } = await req.json()
		const user = await currentUser()

		if (!user) {
			throw new Error('User not authenticated')
		}

		if (!id) {
			throw new Error('Workflow ID is required')
		}

		if (!apiKey) {
			throw new Error('API Key is required')
		}

		if (!assistantId) {
			throw new Error('Assistant ID is required')
		}

		// Safe retrieval of environment variables
		const N8N_API_KEY = process.env.N8N_API_KEY
		const N8N_BASE_URL = process.env.N8N_API_URL
		const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

		if (!N8N_API_KEY || !N8N_BASE_URL) {
			throw new Error('N8N configuration is missing')
		}

		const date = new Date().toISOString()
		const headers = { 'X-N8N-API-KEY': N8N_API_KEY }

		// 1. Creating OpenAI credentials
		const credentialsData: N8nCredentials = {
			name: `OpenAI ${date}`,
			type: 'openAiApi',
			data: { apiKey: apiKey },
		}

		const credentialsResponse = await axios.post(
			`${N8N_BASE_URL}/credentials`,
			credentialsData,
			{ headers }
		)

		const credentialsId = credentialsResponse.data.id
		if (!credentialsId) {
			throw new Error('Failed to create credentials')
		}

		// 3. Getting the source workflow
		const workflowResponse = await axios.get(
			`${N8N_BASE_URL}/workflows/${id}`,
			{ headers }
		)

		const workflow = workflowResponse.data
		const webhookPath = date.replace(/[^a-zA-Z0-9]/g, '')

		// 4. Updating nodes configuration
		const updatedNodes: WorkflowNode[] = workflow.nodes.map(
			(node: WorkflowNode) => {
				if (node.type === 'n8n-nodes-base.webhook') {
					return {
						...node,
						parameters: {
							...node.parameters,
							path: webhookPath,
						},
					}
				}

				if (node.type === 'n8n-nodes-base.openAi') {
					return {
						...node,
						credentials: {
							openAiApi: credentialsId,
						},
						parameters: {
							...node.parameters,
							assistantId: assistantId,
						},
					}
				}

				return node
			}
		)

		// 5. Creating new workflow
		const newWorkflowResponse = await axios.post(
			`${N8N_BASE_URL}/workflows`,
			{
				name: `Cloned Workflow ${date}`,
				nodes: updatedNodes,
				connections: workflow.connections,
				settings: workflow.settings,
			},
			{ headers }
		)

		const newid = newWorkflowResponse.data.id
		if (!newid) {
			throw new Error('Failed to create new workflow')
		}
		const webhookLink = `${N8N_WEBHOOK_URL}/${webhookPath}`

		// Activating the new workflow
		const activateWorkflow = await axios.post(
			`${N8N_BASE_URL}/workflows/${newid}/activate`,
			{},
			{ headers }
		)

		if (!activateWorkflow) {
			throw new Error('Failed to activate workflow')
		}

		// 6. Saving project to database

		const dbProject = await prisma.project.create({
			data: {
				connection_id: credentialsId,
				webhook_id: newid, // Using workflow ID instead of separate webhook ID
				scenario_id: newid,
				user_clerk_id: user.id,
				webhookLink: webhookLink,
				assistant_id: assistantId,
				type: 'n8n',
				status: 'active',
			},
		})

		if (!dbProject) {
			throw new Error('Failed to create project in database')
		}

		return NextResponse.json({
			success: true,
			id: newid,
			webhookLink,
			credentialsId,
		})
	} catch (error: any) {
		console.error('Error in workflow cloning process:', error)

		return NextResponse.json(
			{
				success: false,
				error:
					error.response?.data?.message ||
					'Failed to clone and update workflow',
				details: error.response?.data || error.message,
			},
			{ status: error.response?.status || 500 }
		)
	}
}
