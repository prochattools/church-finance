/*
 * CUSTOM EDITS MADE:
 * 1. Added text truncation for long email addresses
 * 2. Added max-width constraint to prevent overflow
 * 3. Improved avatar text styling and capitalization
 * 4. Better responsive text sizing
 */
'use client'

import { Fragment, useMemo } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useUser, useClerk } from '@/utils/clerkClient'
import { cn } from '@/helpers/utils'
import { useRouter } from 'next/navigation'
import { AUTH_ENABLED } from '@/utils/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const ButtonSignin = ({
	text = 'Sign In',
	extraStyle,
	redirectUrl = '/ledger',
}: {
	text?: string
	extraStyle?: string
	redirectUrl?: string
}) => {
	const router = useRouter()
	const clerkUser = useUser()
	const clerk = useClerk()
	const isSignedIn = AUTH_ENABLED ? clerkUser?.isSignedIn ?? false : true
	const isLoaded = AUTH_ENABLED ? clerkUser?.isLoaded ?? false : true

	const userData = (clerkUser?.user ?? {}) as Record<string, any>

	const avatarImageUrl = (userData?.imageUrl as string | undefined) ?? undefined
	const fullName =
		(typeof userData?.fullName === 'string' && userData.fullName.trim().length > 0
			? userData.fullName
			: [userData?.firstName, userData?.lastName].filter(Boolean).join(' ')) || ''

	const primaryEmail =
		(typeof userData?.primaryEmailAddress?.emailAddress === 'string'
			? userData.primaryEmailAddress.emailAddress
			: typeof userData?.emailAddress === 'string'
				? userData.emailAddress
				: undefined) ?? undefined

	const initials = useMemo(() => {
		const fromName = fullName
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('')
		if (fromName.length > 0) {
			return fromName
		}
		if (primaryEmail) {
			return primaryEmail.slice(0, 2).toUpperCase()
		}
		return 'OF'
	}, [fullName, primaryEmail])

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

	const handleProfile = () => {
		if (AUTH_ENABLED && typeof clerk?.openUserProfile === 'function') {
			clerk.openUserProfile()
			return
		}
		router.push('/ledger')
	}

	const handleSignOut = async () => {
		if (AUTH_ENABLED && typeof clerk?.signOut === 'function') {
			try {
				const redirectUrl =
					typeof window !== 'undefined' ? window.location.origin ?? '/' : '/'
				await clerk.signOut({ redirectUrl })
				router.push('/')
				return
			} catch (error) {
				console.error('Failed to sign out', error)
			}
		}
		router.push('/')
	}

	const gradientButtonClasses = cn(
		'group relative inline-flex min-w-[96px] items-center justify-center overflow-hidden rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-12px_rgba(98,97,255,0.75)] transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background whitespace-nowrap',
		extraStyle,
	)

	if (isSignedIn && isLoaded) {
		return (
			<Menu as='div' className='relative'>
				<Menu.Button
					className={cn(
						'group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-2 py-1.5 text-slate-700 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.25)] backdrop-blur-xl transition-colors duration-200 hover:border-slate-300 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:border-white/25',
						extraStyle,
					)}
					aria-label='Open account menu'
				>
					<Avatar className='h-9 w-9 border border-white/70 bg-white/40 text-sm font-semibold text-slate-700 transition-colors duration-200 dark:border-white/20 dark:bg-white/10 dark:text-white'>
						{avatarImageUrl ? <AvatarImage src={avatarImageUrl} alt={fullName || 'Account avatar'} /> : null}
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
					<svg
						className='size-4 text-slate-500 transition-transform duration-200 group-data-[headlessui-state=open]:-scale-y-100 dark:text-white/60'
						viewBox='0 0 20 20'
						fill='none'
						xmlns='http://www.w3.org/2000/svg'
					>
						<path
							d='M4.16699 7.5L10.0003 13.3333L15.8337 7.5'
							stroke='currentColor'
							strokeWidth='1.6'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
					</svg>
				</Menu.Button>
				<Transition
					as={Fragment}
					enter='transition-opacity transition-transform duration-150 ease-out'
					enterFrom='opacity-0 -translate-y-2'
					enterTo='opacity-100 translate-y-0'
					leave='transition-opacity transition-transform duration-120 ease-in'
					leaveFrom='opacity-100 translate-y-0'
					leaveTo='opacity-0 -translate-y-2'
				>
					<Menu.Items className='absolute right-0 z-[60] mt-3 w-48 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl focus:outline-none dark:border-white/10 dark:bg-[#0B111B]/95 dark:shadow-[0_24px_60px_-32px_rgba(49,112,255,0.55)]'>
						<Menu.Item>
							{({ active }) => (
								<button
									type='button'
									onClick={handleProfile}
									className={cn(
										'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-150 dark:text-white/80',
										active ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white' : '',
									)}
								>
									Profile
								</button>
							)}
						</Menu.Item>
						<Menu.Item>
							{({ active }) => (
								<button
									type='button'
									onClick={handleSignOut}
									className={cn(
										'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition-colors duration-150 dark:text-rose-400',
										active ? 'bg-rose-100/70 dark:bg-rose-500/20' : '',
									)}
								>
									Sign out
								</button>
							)}
						</Menu.Item>
					</Menu.Items>
				</Transition>
			</Menu>
		)
	}

	return (
		<button
			type='button'
			onClick={handleClick}
			className={gradientButtonClasses}
			aria-label={text}
		>
			<span className='absolute inset-0 bg-gradient-to-r from-[#5D5AF6] via-[#6E62FF] to-[#24C4FF]' />
			<span className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_rgba(255,255,255,0))] opacity-0 transition-opacity duration-200 group-hover:opacity-100' />
			<span className='relative z-[1]'>{text}</span>
		</button>
	)
}

export default ButtonSignin
