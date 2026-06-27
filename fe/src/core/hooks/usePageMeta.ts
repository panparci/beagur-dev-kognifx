import { useEffect } from 'react';
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, OG_IMAGE_PATH } from '@core/constants/siteMeta';

type PageMetaOptions = {
  title: string;
  description?: string;
  noIndex?: boolean;
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function absoluteOgImage(): string {
  if (typeof window === 'undefined') return OG_IMAGE_PATH;
  try {
    return new URL(OG_IMAGE_PATH, window.location.origin).href;
  } catch {
    return OG_IMAGE_PATH;
  }
}

export function usePageMeta({ title, description = SITE_DESCRIPTION, noIndex = false }: PageMetaOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', SITE_KEYWORDS);
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:locale', 'id_ID');
    upsertMeta('property', 'og:image', absoluteOgImage());

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, noIndex]);
}
