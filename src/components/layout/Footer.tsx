import { getPageContent, type FooterContent, DEFAULT_FOOTER } from '@/lib/content';
import { FooterClient } from './FooterClient';

export async function Footer() {
  let content: FooterContent;
  try {
    content = await getPageContent<FooterContent>('footer');
  } catch {
    content = DEFAULT_FOOTER;
  }
  return <FooterClient content={content} />;
}
