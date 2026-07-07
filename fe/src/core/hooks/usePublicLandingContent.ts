import { useEffect, useState } from 'react';
import {
  DEFAULT_LANDING_CONTENT,
  LandingContent,
  parseLandingContent,
} from '@core/constants/landingContent';
import { fetchPublicLanding } from '@core/api/publicClient';

export function usePublicLandingContent() {
  const [content, setContent] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicLanding()
      .then((raw) => {
        if (!cancelled) setContent(parseLandingContent(raw));
      })
      .catch(() => {
        if (!cancelled) setContent(DEFAULT_LANDING_CONTENT);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { content, loading };
}
