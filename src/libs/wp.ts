import axios from 'axios'
import WPAPI from 'wpapi'
//http://localhost:8080/wp-json/wp/v2/posts?_fields=id,slug,title,featured_media,_embedded&_embed=true
class WordpressService {
	private wp: any

	constructor() {
		const endpoint = process.env.WP_REST_ENDPOINT || ''
		this.wp = endpoint ? new WPAPI({ endpoint }) : null
	}

	public async getAllPosts() {
		try {
			const wpEndpoint = process.env.WP_REST_ENDPOINT
			if (!wpEndpoint) {
				console.warn('WP_REST_ENDPOINT not configured. Skipping WordPress fetch.')
				return []
			}
			const appPostsResp = await axios.get(
				`${wpEndpoint}/wp/v2/posts?_fields=id,slug,title,featured_media,date,author`,
				{ method: 'GET' }
			)
			const parsedResp: WPPost[] = appPostsResp.data
			let finalList = []
			for (const post of parsedResp) {
				let imageUrl = ''
				if (post.featured_media > 0) {
					const image = await this.getImageURLById(post.featured_media)
					imageUrl = image?.guid?.rendered
				}

				finalList.push({
					...post,
					image_url: imageUrl,
				})
			}

			return finalList
		} catch (e) {
			console.error(e)
			return []
		}
	}

	public async getPostsForSitemap(): Promise<
		{
			slug: string
			date: string
		}[]
	> {
		if (!process.env.WP_REST_ENDPOINT) {
			console.warn('WP_REST_ENDPOINT not configured. Returning empty sitemap post list.')
			return []
		}
		const appPostsResp = await fetch(
			`${process.env.WP_REST_ENDPOINT}/wp/v2/posts?_fields=slug,date`,
			{ method: 'GET' }
		)
		return appPostsResp.json()
	}

	public async getImageURLById(id: number) {
		if (!this.wp) {
			return null
		}
		return this.wp.media().id(id)
	}

	public async getPost(slug: string): Promise<WPDetailedPost | null> {
		if (!this.wp) {
			console.warn('WP_REST_ENDPOINT not configured. Unable to fetch post.')
			return null
		}
		try {
			const resp = await this.wp.posts().slug(slug)
			return resp?.[0] ?? null
		} catch (error) {
			console.error('Failed to fetch WordPress post', error)
			return null
		}
	}
}

export const wordpressService = new WordpressService()
