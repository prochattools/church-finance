import axios from 'axios'
import WPAPI from 'wpapi'
//http://localhost:8080/wp-json/wp/v2/posts?_fields=id,slug,title,featured_media,_embedded&_embed=true
class WordpressService {
	private wp: any

	constructor() {
		this.wp = new WPAPI({ endpoint: process.env.WP_REST_ENDPOINT || '' })
	}

	public async getAllPosts() {
		try {
			const wpEndpoint = process.env.WP_REST_ENDPOINT
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
		}
	}

	public async getPostsForSitemap(): Promise<
		{
			slug: string
			date: string
		}[]
	> {
		const appPostsResp = await fetch(
			`${process.env.WP_REST_ENDPOINT}/wp/v2/posts?_fields=slug,date`,
			{ method: 'GET' }
		)
		return appPostsResp.json()
	}

	public async getImageURLById(id: number) {
		return this.wp.media().id(id)
	}

	public async getPost(slug: string): Promise<WPDetailedPost> {
		const resp = await this.wp.posts().slug(slug)

		return resp[0]
	}
}

export const wordpressService = new WordpressService()
