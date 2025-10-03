import PricingSection from '@/components/PricingSection'
import Scenarios from '@/components/Scenarios'
import ThankYouPopup from '@/components/ThankyouPopUp'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSubscriptionByUserId } from '../api/actions'

export default async function Dashboard() {
	const { userId } = auth()

	if (!userId) {
		redirect('/sign-in')
	}

	const sub = await getSubscriptionByUserId(userId)
	const isInactive = sub ? sub?.sub_status !== 'active' : true

	if (isInactive) {
		redirect('/processing-page')
	}

	return (
		<div>
			{isInactive ? (
				<PricingSection />
			) : (
				<div>
					<Scenarios />
					<ThankYouPopup />
				</div>
			)}
		</div>
	)
}
