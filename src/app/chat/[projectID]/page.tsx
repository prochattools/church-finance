'use client'

import { Button } from '@/components/ui/button'
import axios from 'axios'
import { Field, Form, Formik } from 'formik'
import { Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import * as Yup from 'yup'

// Validation schema
const MessageSchema = Yup.object().shape({
	message: Yup.string().trim().required('Message cannot be empty'),
})

interface MessageFormValues {
	message: string
}

export default function ChatPage() {
	const { projectID } = useParams()
	const [messages, setMessages] = useState<
		Array<{
			id: string
			text: string
			sender: 'user' | 'ai'
			timestamp: Date
		}>
	>([])
	const [webhookLink, setWebhookLink] = useState('')
	const [isLoading, setIsLoading] = useState(true)

	const getWebhookLink = async () => {
		try {
			const response = await axios.get(`/api/link?projectID=${projectID}`)
			console.log(response.data)

			if (response.data.webhookLink) {
				setWebhookLink(response.data.webhookLink)
				setIsLoading(false)
			}
		} catch (error) {
			console.error('Error fetching webhook link:', error)
		}
	}

	useEffect(() => {
		getWebhookLink()
	}, [])

	const fetchMessage = async (message: string) => {
		const response = await axios.post(webhookLink, {
			message,
		})

		if (response.data) {
			setMessages(prev => [
				...prev,
				{
					id: Date.now().toString(),
					text: response.data.toString(),
					sender: 'ai' as const,
					timestamp: new Date(),
				},
			])
		}
	}

	const handleSubmit = async (
		values: MessageFormValues,
		{ resetForm }: any
	) => {
		if (!values.message.trim()) return

		// Create new message
		const newMessage = {
			id: Date.now().toString(),
			text: values.message,
			sender: 'user' as const,
			timestamp: new Date(),
		}

		// Add message to the list
		setMessages(prev => [...prev, newMessage])

		// Send message
		await fetchMessage(values.message)

		// Reset form
		resetForm()
	}

	if (isLoading) {
		return (
			<div className='flex justify-center items-center h-screen'>
				<Loader2 className='animate-spin text-primary' size={32} />
			</div>
		)
	}

	return (
		<div className='flex flex-col h-[800px] justify-between items-center w-full p-5'>
			<div className='flex flex-col w-3/4 h-5/6 rounded-b-lg'>
				<h1 className='text-2xl text-center font-bold'>Chat</h1>

				<div className='flex flex-col gap-2 h-full w-full'>
					{messages.map(message => (
						<div
							key={message.id}
							className={`flex rounded-lg flex-col ${
								message.sender === 'user' ? 'text-end' : 'text-start'
							}`}
						>
							<p>{message.text}</p>
						</div>
					))}
				</div>
			</div>

			<Formik
				initialValues={{ message: '' }}
				validationSchema={MessageSchema}
				onSubmit={handleSubmit}
			>
				{({ errors, touched, isSubmitting }) => (
					<Form className='flex gap-3 w-3/4 rounded-b-lg'>
						<Field
							type='text'
							id='message'
							name='message'
							placeholder='Send message...'
							className={`flex-1 p-2 rounded-md focus:outline-none focus:ring-2 
								${
									errors.message && touched.message
										? 'focus:ring-red-500 border-red-500'
										: 'focus:ring-blue-500'
								}`}
						/>
						<Button
							type='submit'
							disabled={isSubmitting}
							className='px-5 py-2 rounded-md transition-colors duration-200'
						>
							{isSubmitting ? (
								<Loader2 className='animate-spin' size={16} />
							) : (
								'Send'
							)}
						</Button>
					</Form>
				)}
			</Formik>
		</div>
	)
}
