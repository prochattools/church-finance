/*
 * CUSTOM EDITS MADE:
 * 1. Added text truncation for long email addresses
 * 2. Added max-width constraint to prevent overflow
 * 3. Improved avatar text styling and capitalization
 * 4. Better responsive text sizing
 */
'use client'

import { useUser } from '@/utils/clerkClient'
import { cn } from '@/helpers/utils'
import { useRouter } from 'next/navigation'
import { AUTH_ENABLED } from '@/utils/auth'

const ButtonSignin = ({
	text = 'Log in',
	extraStyle,
	redirectUrl = '/ledger',
}: {
	text?: string
	extraStyle?: string
	redirectUrl?: string
}) => {
	const router = useRouter()
	const clerkUser = AUTH_ENABLED ? useUser() : null
	const isSignedIn = AUTH_ENABLED ? clerkUser?.isSignedIn ?? false : true
	const isLoaded = AUTH_ENABLED ? clerkUser?.isLoaded ?? false : true

	const handleClick = () => {
		if (!AUTH_ENABLED) {
			router.push(redirectUrl)
			return
		}

		if (!isLoaded) {
			return
		}

		if (isSignedIn) {
			router.push(redirectUrl)
			return
		}

		const target = redirectUrl ?? '/'
		const search = new URLSearchParams({ redirect_url: target })
		router.push(`/sign-in?${search.toString()}`)
	}

	return (
		<button
			type='button'
			onClick={handleClick}
			className={cn(
				'group relative inline-flex items-center justify-center overflow-hidden rounded-full px-7 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(98,97,255,0.75)] transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
				extraStyle,
			)}
			aria-label={text}
		>
			<span className='absolute inset-0 bg-gradient-to-r from-[#5D5AF6] via-[#6E62FF] to-[#24C4FF]' />
			<span className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_rgba(255,255,255,0))] opacity-0 transition-opacity duration-200 group-hover:opacity-100' />
			<span className='relative z-[1]'>{text}</span>
		</button>
	)
}

export default ButtonSignin
