import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { PORTAL_FOG_EASE } from '@core/routing/portalTransition';
import { AiAssistantWidget } from '@modules/ai-assistant/components/AiAssistantWidget';
import { PAGE_META } from '@core/constants/siteMeta';
import { usePageMeta } from '@core/hooks/usePageMeta';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  MASCOT_FALLBACK_URL,
  MASCOT_IS_GIF,
  MASCOT_LOCAL_URL,
  MASCOT_URL,
} from '@core/constants/mediaUrls';

interface AuthPageProps {
  onLoginWithEmail: (email: string, password: string) => void;
  onSignUpWithEmail: (name: string, email: string, password: string) => void;
  onLoginWithGoogle: () => void;
  onSwitchToLanding: () => void;
  loginLoading?: boolean;
  loginError?: string | null;
  googleEnabled?: boolean;
  authTransitioning?: boolean;
}

const AUTH_MASCOT_BG = '#DFD8CE';

const AuthPage: React.FC<AuthPageProps> = ({
  onLoginWithGoogle,
  onSwitchToLanding,
  loginLoading = false,
  loginError = null,
  googleEnabled = false,
  authTransitioning = false,
}) => {
  const reduce = useReducedMotion();
  const [mascotSrc, setMascotSrc] = useState(MASCOT_URL);
  const [mascotUseVideo, setMascotUseVideo] = useState(!MASCOT_IS_GIF);
  const mascotRef = useRef<HTMLVideoElement>(null);

  usePageMeta(PAGE_META.login);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.backgroundColor;
    const prevBody = body.style.backgroundColor;
    html.style.backgroundColor = AUTH_MASCOT_BG;
    body.style.backgroundColor = AUTH_MASCOT_BG;
    return () => {
      html.style.backgroundColor = prevHtml;
      body.style.backgroundColor = prevBody;
    };
  }, []);

  useEffect(() => {
    if (!mascotUseVideo) return;
    const video = mascotRef.current;
    if (!video) return;

    video.muted = true;
    const play = () => {
      void video.play().catch(() => {
        /* autoplay blocked until user gesture */
      });
    };
    play();
    video.addEventListener('loadeddata', play);
    return () => video.removeEventListener('loadeddata', play);
  }, [mascotUseVideo]);

  return (
    <>
      <motion.div
        className="auth-page"
        animate={
          reduce
            ? undefined
            : authTransitioning
              ? { opacity: 0.15, filter: 'blur(10px) saturate(1.08)' }
              : { opacity: 1, filter: 'blur(0px)' }
        }
        transition={{ duration: 0.55, ease: PORTAL_FOG_EASE }}
      >
      <div className="auth-page-grid">
        <aside className="auth-brand" aria-label="Identitas Bea Guru">
          <div className="auth-brand-top">
            <button type="button" onClick={onSwitchToLanding} className="auth-back auth-back--on-light">
              <ArrowLeft size={16} aria-hidden />
              Beranda
            </button>
          </div>

          <div className="auth-brand-body">
            <div className="auth-brand-mascot-wrap">
              {!mascotUseVideo ? (
                <img
                  src={mascotSrc}
                  className="auth-brand-mascot"
                  alt=""
                  aria-hidden
                  decoding="async"
                  loading="lazy"
                  onError={() => {
                    if (mascotSrc !== MASCOT_LOCAL_URL) {
                      setMascotSrc(MASCOT_LOCAL_URL);
                      return;
                    }
                    setMascotSrc(MASCOT_FALLBACK_URL);
                    setMascotUseVideo(true);
                  }}
                />
              ) : (
                <video
                  ref={mascotRef}
                  className="auth-brand-mascot"
                  src={mascotSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={false}
                  controlsList="nodownload nofullscreen noremoteplayback"
                  preload="none"
                  disablePictureInPicture
                  aria-hidden
                />
              )}
            </div>
            <div className="auth-brand-copy">
              <p className="auth-brand-kicker">Portal resmi yayasan</p>
              <h1 className="auth-brand-title">Bea Guru Indonesia</h1>
              <p className="auth-brand-lead">
                Platform penyaluran bantuan transparan untuk guru honorer di seluruh Indonesia.
                Masuk dengan Google, lalu pilih peran sebagai guru, kepala sekolah, atau donatur.
              </p>
            </div>
          </div>

          <p className="auth-brand-foot">© {new Date().getFullYear()} Yayasan Bea Guru Indonesia</p>
        </aside>

        <main className="auth-panel" aria-label="Masuk portal">
          <div className="auth-panel-inner">
            <div className="auth-card auth-card--underline">
              <header className="auth-card-head">
                <div className="auth-card-kicker-row">
                  <span className="auth-card-kicker-line" aria-hidden />
                  <p className="auth-card-kicker">Selamat datang kembali</p>
                </div>
                <p className="auth-card-sub">
                  Masuk ke ruang kerja Bea Guru untuk mengelola donasi, validasi, dan laporan dalam satu portal tepercaya.
                </p>
              </header>

              {loginError && (
                <div role="alert" className="portal-banner portal-banner--error auth-card-alert">
                  {loginError}
                </div>
              )}

              <div className="auth-google-panel">
                <p className="auth-google-eyebrow">Akses aman dengan Google</p>
                <button
                  type="button"
                  disabled={loginLoading || !googleEnabled}
                  className="auth-google-btn"
                  onClick={onLoginWithGoogle}
                >
                  <span className="auth-google-mark" aria-hidden>
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path
                        fill="#4285F4"
                        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.37a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.52Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 22c2.7 0 4.97-.9 6.61-2.43l-3.23-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.12H3.08v2.59A9.99 9.99 0 0 0 12 22Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M6.41 13.89a6.01 6.01 0 0 1 0-3.78V7.52H3.08a10.01 10.01 0 0 0 0 8.96l3.33-2.59Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.99c1.47 0 2.79.51 3.83 1.5l2.86-2.86C16.96 3.01 14.7 2 12 2a9.99 9.99 0 0 0-8.92 5.52l3.33 2.59C7.2 7.75 9.4 5.99 12 5.99Z"
                      />
                    </svg>
                  </span>
                  <span>{loginLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
                  {loginLoading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
                </button>
                <p className="auth-google-note">
                  Kami akan menyiapkan akun Anda otomatis, lalu mengarahkan Anda memilih peran yang sesuai.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <AiAssistantWidget />
      </motion.div>
    </>
  );
};

export default AuthPage;
