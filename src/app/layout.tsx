import { Providers } from '@/components/providers'
import { getSEOTags } from '@/libs/seo'
import { cn } from '@/helpers/utils'
import { Header } from '@/layout'
import '@/assets/styles/globals.css'
import { Viewport } from 'next'
import { Golos_Text } from 'next/font/google'
import { ReactNode } from 'react'

const golos = Golos_Text({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
	variable: '--font-golos',
	display: 'swap',
})

export const viewport: Viewport = {
	themeColor: '#000000',
	width: 'device-width',
	initialScale: 1,
}

export const metadata = getSEOTags()

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body
				className={cn(
					'font-sans bg-background text-foreground antialiased',
					golos.variable,
				)}
			>
				<Providers>
					<Header />
					<main className='relative min-h-screen pt-24'>{children}</main>
				</Providers>
			</body>
		</html>
	)
}
