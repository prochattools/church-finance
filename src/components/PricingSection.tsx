'use client'

import { Check } from 'lucide-react'
import CheckoutButton from './CheckoutButton'
import config from '@/config'

export default function PricingSection() {
	const products = config.stripe.products

	return (
		<section className='py-16'>
			<div className='container mx-auto px-4'>
				<h2 className='text-3xl font-bold text-center mb-12 dark:text-white text-black1'>
					Choose Your Plan
				</h2>
				<div className='grid md:grid-cols-2 gap-8 max-w-4xl mx-auto'>
					{products.map((product, index) => (
						<div
							key={product.priceId}
							className={`dark:bg-[#131211] bg-white rounded-lg shadow-md p-8 ${product.isBest ? 'border-4 border-blue-500 relative' : ''
								}`}
						>
							{product.isBest && (
								<div className='absolute top-0 right-0 bg-blue-500 text-white py-1 px-4 rounded-bl-lg text-sm font-semibold'>
									Best Value
								</div>
							)}
							<h3 className='text-2xl font-semibold mb-4'>{product.title}</h3>
							<p className='text-4xl font-bold mb-6'>
								${product.price}
								<span className='text-xl dark:text-gray-500 text-black1/70 font-normal'>
									/{product.type === 'subscription' ? product.period : 'once'}
								</span>
							</p>
							{product.type === 'subscription' && product.period === 'year' && (
								<p className='text-green-600 font-semibold mb-6'>
									Save 20% compared to monthly
								</p>
							)}
							<ul className='space-y-3 mb-8'>
								{product.features.map((feature, featureIndex) => (
									<li key={featureIndex} className='flex items-center'>
										<Check className='text-green-500 mr-2' />
										<span className={feature.disabled ? 'line-through opacity-50' : ''}>
											{feature.title}
										</span>
									</li>
								))}
							</ul>
							<CheckoutButton priceId={product.priceId} />
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
