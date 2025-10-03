import { MetadataRoute } from 'next'
import {wordpressService} from "@/libs/wp";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const currentUrl = process.env.NEXT_PUBLIC_APP_URL || ''

    const posts = await wordpressService.getPostsForSitemap().then(resp => resp).catch(():any[] => [])

    const blogPostsMaps: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${currentUrl}/blog/${post.slug}`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.4,
    }))

    return [
        {
            url: currentUrl,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 1,
        },
        {
            url: `${currentUrl}/privacy-policy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.8,
        },
        {
            url: `${currentUrl}/tos`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.7,
        },
        {
            url: `${currentUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.6,
        },
        ...blogPostsMaps
    ]
}