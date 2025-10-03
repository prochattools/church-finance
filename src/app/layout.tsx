import { Providers } from '@/components/providers'
import { getSEOTags } from '@/libs/seo'
import { ClerkProvider } from '@clerk/nextjs'
import { Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ReactNode } from 'react'

import '@/assets/styles/globals.scss'
import { Header } from '@/layout'

const font = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
	themeColor: '#000000',
	width: 'device-width',
	initialScale: 1,
}

export const metadata = getSEOTags()

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body className={font.className}>
				<Providers>
					<ClerkProvider>
						<Header />
						<main className='min-h-screen pt-24 bg-background'>{children}</main>
					</ClerkProvider>
				</Providers>
			</body>
		</html>
	)
}
