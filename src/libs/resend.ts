import InvoiceTemplate from '@/components/email-templates/Invoice'
import ThankYouTemplate from '@/components/email-templates/ThanksYouTemplate'
import config from '@/config'
import prisma from '@/libs/prisma'
import { Resend } from 'resend'

class ResendService {
	private resend = new Resend(process.env.RESEND_API_KEY)

	public async sendThanksYouEmail(toMail: string) {
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
		return this.resend.contacts.create({
			email,
			unsubscribed: false,
			audienceId: audience.resend_id,
		})
	}

	private async upsertAudience() {
		const audience = await prisma.audiences.findFirst()

		if (audience) {
			return audience
		}

		const resendAudience = await this.resend.audiences.create({
			name: 'Waiting List',
		})
		const {
			data: { id, name },
		} = resendAudience
		return prisma.audiences.create({
			data: {
				resend_id: id,
				name,
			},
		})
	}
}

export const resendService = new ResendService()
