/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
	typescript: {
	  // ✅ Disable type checking during production builds
	  ignoreBuildErrors: process.env.DISABLE_TS_CHECK === '1',
	},
	eslint: {
	  // ✅ Disable ESLint checks during production builds
	  ignoreDuringBuilds: true,
	},
  };
  
  module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	reactStrictMode: true,
	images: {
		remotePatterns: [
			// NextJS <Image> component needs to whitelist domains for src={}
			{
				protocol: 'https',
				hostname: 'lh3.googleusercontent.com',
			},
			{
				protocol: 'https',
				hostname: 'pbs.twimg.com',
			},
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			},
			{
				protocol: 'https',
				hostname: 'logos-world.net',
			},
			{
				protocol: 'http',
				hostname: 'localhost',
			},
			{
				protocol: 'https',
				hostname: 'localhost',
			},
			{
				protocol: 'https',
				hostname: 'cdn-icons-png.flaticon.com',
			},
			{
				protocol: 'https',
				hostname: 'res.cloudinary.com',
			},
			{
				protocol: 'https',
				hostname: 'blogger.googleusercontent.com',
			},
			{
				protocol: 'https',
				hostname: 'fast-strapi-cms-651b34b82e95.herokuapp.com',
			},
			{
				protocol: 'https',
				hostname: 'secure.gravatar.com',
			},
			{
				protocol: 'https',
				hostname: 'img.clerk.com',
			},
			{
				protocol: 'http',
				hostname: '3.73.130.136',
			},
			{
				protocol: 'https',
				hostname: '3.73.130.136',
			},
		],
	},
}

module.exports = nextConfig
