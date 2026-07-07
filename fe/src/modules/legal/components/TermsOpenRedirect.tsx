import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** /terms → beranda + modal S&K (tanpa halaman terpisah). */
export function TermsOpenRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/', { replace: true, state: { openTerms: true } });
  }, [navigate]);
  return null;
}
