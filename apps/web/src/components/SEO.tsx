import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
}

export function SEO({
  title,
  description = 'FlowRaze unifies sales, marketing, and team performance into one clear system. Stop juggling dashboards. Start making decisions that move the number.',
  keywords = 'CRM, Operations Analytics, Sales tracking, Marketing attribution, Revenue operations',
  ogImage = '/og-image.png',
  ogType = 'website',
  canonical,
}: SEOProps) {
  useEffect(() => {
    // Update Title
    const fullTitle = `${title} | FlowRaze`;
    document.title = fullTitle;

    // Update Meta Tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Update OG Tags
    updateMetaTag('og:title', fullTitle, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', ogImage, 'property');
    updateMetaTag('og:type', ogType, 'property');
    
    // Update Twitter Tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);

    // Update Canonical
    if (canonical) {
      let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
      if (link) {
        link.setAttribute('href', canonical);
      } else {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', canonical);
        document.head.appendChild(link);
      }
    }
  }, [title, description, keywords, ogImage, ogType, canonical]);

  return null;
}

function updateMetaTag(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attr}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}
