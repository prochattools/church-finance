// import Link from "next/link";
// import AuthorAvatar from "@/app/blog/_assets/components/Author";
// import BlogSpotlight from "@/components/BlogSpotlight";
// import FaqsV2 from "@/components/FAQsV2";
// import BlogMoreArticles from "@/components/BlogMoreArticles";
import BlogDetails from '@/components/BlogDetails'
import { wordpressService } from '@/libs/wp'

export async function generateMetadata({
	params,
}: {
	params: { slug: string }
}) {
	const { yoast_head_json, slug } = await wordpressService.getPost(params.slug)

	return {
		title: yoast_head_json.title,
		description: yoast_head_json.og_description,
		openGraph: {
			title: yoast_head_json.og_title,
			description: yoast_head_json.og_description,
			type: yoast_head_json.og_type as 'article',
			url: `${process.env.NEXT_PUBLIC_APP_URL}/blog/${slug}`,
		},
		twitter: {
			card: yoast_head_json.twitter_card as 'summary_large_image',
			title: yoast_head_json.og_title,
			description: yoast_head_json.og_description,
		},
	}
}

export default async function Article({
	params,
}: {
	params: { articleId: string }
}) {
	const slug = params.articleId
	console.log('slug1', slug)
	const article = await wordpressService.getPost(slug)
	const articles = await wordpressService.getAllPosts()

	return (
		<>
			<BlogDetails postDetails={article} allPosts={articles} />
		</>
	)
}
