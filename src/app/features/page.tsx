import { getPageContent, type FeaturesContent } from '@/lib/content'
import { Footer } from '@/components/layout'
import FeaturesPageClient from './FeaturesPageClient'

export default async function FeaturesPage() {
  const content = await getPageContent<FeaturesContent>('features')
  return <FeaturesPageClient content={content} footer={<Footer />} />
}
