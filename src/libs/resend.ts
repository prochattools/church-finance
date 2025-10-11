import InvoiceTemplate from '@/components/email-templates/Invoice'
import ThankYouTemplate from '@/components/email-templates/ThanksYouTemplate'
import config from '@/config'
import prisma from '@/libs/prisma'
import { Resend } from 'resend'

type AudienceRecord = {
	resend_id: string
	name: string
}

type ResendResponse<T = unknown> = {
	data: T
}

class ResendService {
	private client: Resend | null = null

	private get resend() {
		if (this.client) {
			return this.client
		}
		const apiKey = process.env.RESEND_API_KEY
		if (!apiKey) {
			return null
		}
		this.client = new Resend(apiKey)
		return this.client
	}

	private ensureResendAvailable(action: string) {
		if (!this.resend) {
			if (process.env.NODE_ENV !== 'production') {
				console.warn(`Resend API key missing – skipping ${action}`)
			}
		}
	}

	public async sendThanksYouEmail(toMail: string) {
		if (!this.resend) {
			this.ensureResendAvailable('thank you email send')
			return { id: `resend-mock-${Date.now()}` }
		}

		const { data, error } = await this.resend.emails.send({
			from: config.resend.fromAdmin,
			to: [toMail],
			replyTo: config.resend.forwardRepliesTo,
			subject: config.resend.subjects.thankYou,
			react: ThankYouTemplate({ email: toMail }),
		})

		if (error) {
			throw error
		}

		return data
	}

	public async sendInvoice(toMail: string, renderData: any) {
		if (!this.resend) {
			this.ensureResendAvailable('invoice email send')
			return { id: `resend-invoice-mock-${Date.now()}` }
		}

		const { data, error } = await this.resend.emails.send({
			from: config.resend.fromAdmin,
			to: [toMail],
			replyTo: config.resend.forwardRepliesTo,
			subject: 'Invoice: ' + renderData.id,
			react: InvoiceTemplate(renderData),
		})

		if (error) {
			throw error
		}

		return data
	}

	public async addNewEmailAddress(email: string) {
		const audience = await this.upsertAudience()
		if (!this.resend) {
			this.ensureResendAvailable('waiting list subscription')
			return {
				data: {
					id: `resend-contact-mock-${Date.now()}`,
					email,
					status: 'mocked',
				},
			} satisfies ResendResponse
		}
		return this.resend.contacts.create({
			email,
			unsubscribed: false,
			audienceId: audience.resend_id,
		})
	}

	private async upsertAudience(): Promise<AudienceRecord> {
		const existing = await prisma.audiences.findFirst({
			select: {
				resend_id: true,
				name: true,
			},
		})

		if (existing) {
			return existing
		}

		if (!this.resend) {
			this.ensureResendAvailable('audience creation')
			return {
				resend_id: 'resend-audience-mock',
				name: 'Waiting List (local)',
			}
		}

		const resendAudience = await this.resend.audiences.create({
			name: 'Waiting List',
		})
		const {
			data: { id, name },
		} = resendAudience
		const created = await prisma.audiences.create({
			data: {
				resend_id: id,
				name,
			},
			select: {
				resend_id: true,
				name: true,
			},
		})
		return created
	}
}

export const resendService = new ResendService()
