import { getPageContent, type AboutContent } from '@/lib/content'
import { Footer } from '@/components/layout'
import AboutPageClient from './AboutPageClient'

export default async function AboutPage() {
  const content = await getPageContent<AboutContent>('about')
  return <AboutPageClient content={content} footer={<Footer />} />
}
