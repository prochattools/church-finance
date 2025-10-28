/*
 * CUSTOM EDITS MADE:
 * 1. Added ButtonSignin to mobile navigation for dashboard access
 * 2. Fixed responsive layout spacing to prevent overlap
 * 3. Improved alignment with items-center classes
 */
'use client'
import { IconButton, Logo } from '@/components'
import ButtonSignin from '@/components/ButtonSignin'
import NavLinks from '@/components/nav-links'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { Blog, Demo, Moon, OpenNav, Pricing, RightArrow, Sun } from '@/icons'
import { ScrollToSection } from '@/utils/scroll-to-section'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const nav_links = [
	{
		icon: <Demo />,
		title: 'Why',
		link: '/#why',
		sectionId: 'why',
	},
	{
		icon: <Pricing />,
		title: 'What',
		link: '/#what',
		sectionId: 'what',
	},
	{
		icon: <Pricing />,
		title: 'Pricing',
		link: '/#pricing',
		sectionId: 'pricing',
	},
	{
		icon: <Demo />,
		title: 'FAQ',
		link: '/#faq',
		sectionId: 'faq',
	},
	{
		icon: <Blog width={18} height={18} />,
		title: 'App',
		link: '/ledger',
		requiresAuth: true,
	},
]

const ThemeSwitch = () => {
	const { resolvedTheme, theme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	const isDark = ((theme ?? 'system') === 'system' ? resolvedTheme : theme) === 'dark'

	const handleChange = () => {
		if (!mounted) return
		setTheme(isDark ? 'light' : 'dark')
	}

	return (
		<label className='relative inline-flex h-9 w-[68px] items-center rounded-full border border-white/30 bg-white/80 px-2 shadow-[0_6px_24px_-12px_rgba(45,87,255,0.45)] backdrop-blur-xl transition-colors duration-300 ease-out dark:border-white/10 dark:bg-white/10'>
			<input
				type='checkbox'
				onChange={handleChange}
				checked={mounted ? isDark : false}
				className='peer absolute inset-0 h-full w-full cursor-pointer opacity-0'
				aria-label='Toggle theme'
			/>
			<span className='pointer-events-none flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700 transition-colors duration-200 dark:text-slate-200'>
				<Sun />
				<Moon />
			</span>
			<span className='pointer-events-none absolute left-1 top-1 h-7 w-7 rounded-full bg-gradient-to-r from-[#5D5AF6] to-[#24C4FF] shadow-[0_10px_30px_-12px_rgba(36,196,255,0.65)] transition-transform duration-300 ease-out peer-checked:translate-x-[28px]' />
		</label>
	)
}

const MobileNav = ({
	onLogoClick,
}: {
	onLogoClick: (event: ReactMouseEvent<HTMLAnchorElement>) => void
}) => {
	return (
		<Sheet>
			<SheetTrigger>
				<div className='flex items-center justify-center rounded-full border border-white/30 bg-white/80 p-3 text-black1 shadow-[0_6px_24px_-12px_rgba(45,87,255,0.38)] backdrop-blur-xl transition-colors duration-200 ease-out dark:border-white/10 dark:bg-white/10 dark:text-white'>
					<OpenNav />
				</div>
			</SheetTrigger>
			<SheetContent className='min-w-[320px] border-l-0 bg-gradient-to-b from-white/95 via-white/90 to-white/80 px-0 pt-4 backdrop-blur-xl dark:from-[#050916]/95 dark:via-[#050916]/92 dark:to-[#050916]/90'>
				<SheetHeader>
					<SheetTitle className='border-b border-white/20 pb-4 pl-6 text-left text-xl font-semibold text-slate-900 dark:border-white/10 dark:text-white'>
						Menu
					</SheetTitle>
				</SheetHeader>
				<Link href='/' onClick={onLogoClick} className='mx-auto mt-8 flex w-fit items-center gap-2'>
					<Logo />
				</Link>
				<div className='mx-auto my-8 w-fit'>
					<NavLinks nav_links={nav_links} />
				</div>
				{/* CUSTOM EDIT: Added ButtonSignin to mobile navigation for dashboard access */}
				<div className='mx-auto mb-8 w-fit'>
					<ButtonSignin />
				</div>
				<div
					onClick={() => {
						ScrollToSection('pricing')
					}}
					className='mb-8 mx-auto w-fit block'
				>
					<IconButton text='Get OpenFund' icon={<RightArrow />} />
				</div>
			</SheetContent>
		</Sheet>
	)
}

const Header = () => {
	const router = useRouter()
	const pathname = usePathname()

	const handleLogoClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
		event.preventDefault()
		if (pathname === '/') {
			window.scrollTo({ top: 0, behavior: 'smooth' })
		} else {
			router.push('/')
		}
	}

	return (
		<header className='fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 backdrop-blur-sm md:px-6 lg:px-8'>
			<div className='relative flex w-full max-w-[1200px] items-center justify-between gap-4 rounded-full border border-white/30 bg-white/80 px-5 py-3 shadow-[0_18px_65px_-40px_rgba(49,112,255,0.85)] backdrop-blur-2xl transition-colors duration-300 ease-out dark:border-white/10 dark:bg-white/10'>
				<div className='pointer-events-none absolute inset-0 -z-10 rounded-full opacity-[0.06] blur-3xl' />
				<Link href='/' onClick={handleLogoClick}>
					<Logo />
				</Link>
				<div className='hidden lg:block'>
					<NavLinks nav_links={nav_links} />
				</div>

				{/* CUSTOM EDIT: Fixed responsive layout to prevent overlap */}
				<div className='hidden items-center gap-4 lg:flex'>
					<ThemeSwitch />
					<ButtonSignin />
				</div>

				<div className='flex items-center gap-3 lg:hidden'>
					<ThemeSwitch />
					<MobileNav onLogoClick={handleLogoClick} />
				</div>
			</div>
		</header>
	)
}

export default Header
