import { getPageContent, type PricingContent } from '@/lib/content';
import { Footer } from '@/components/layout';
import { PricingPageClient } from './PricingPageClient';

export default async function PricingPage() {
  const content = await getPageContent<PricingContent>('pricing');
  return <PricingPageClient content={content} footer={<Footer />} />;
}
