import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { PasswordInput } from '@core/ui/PasswordInput';
import { PORTAL_FOG_EASE } from '@core/routing/portalTransition';
import { AiAssistantWidget } from '@modules/ai-assistant/components/AiAssistantWidget';
import {
  DEV_DEMO_PASSWORD,
  LOGIN_FORM_SUGGESTIONS,
  REGISTER_FORM_EXAMPLE,
  SUPER_ADMIN_LOGIN,
} from '@modules/auth/devPersonas';
import { PAGE_META } from '@core/constants/siteMeta';
import { usePageMeta } from '@core/hooks/usePageMeta';
import { ArrowLeft, Loader2, Mail, User } from 'lucide-react';
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
  onClearLoginError?: () => void;
  loginLoading?: boolean;
  loginError?: string | null;
  googleEnabled?: boolean;
  authTransitioning?: boolean;
}

const AUTH_MASCOT_BG = '#DFD8CE';
const IS_DEV = import.meta.env.DEV;

const AUTH_CARD_COPY = {
  login: {
    kicker: 'Selamat datang kembali',
    lead: 'Masuk ke ruang kerja Bea Guru untuk mengelola donasi, validasi, dan laporan dalam satu portal tepercaya.',
  },
  register: {
    kicker: 'Buat akun baru',
    lead: 'Daftar gratis — pilih peran sebagai guru, kepala sekolah, atau donatur setelah pendaftaran selesai.',
  },
} as const;

const AuthPage: React.FC<AuthPageProps> = ({
  onLoginWithEmail,
  onSignUpWithEmail,
  onLoginWithGoogle,
  onSwitchToLanding,
  onClearLoginError,
  loginLoading = false,
  loginError = null,
  googleEnabled = false,
  authTransitioning = false,
}) => {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(IS_DEV ? SUPER_ADMIN_LOGIN.email : '');
  const [password, setPassword] = useState(IS_DEV ? DEV_DEMO_PASSWORD : '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [devInstantOpen, setDevInstantOpen] = useState(false);
  const [mascotSrc, setMascotSrc] = useState(MASCOT_URL);
  const [mascotUseVideo, setMascotUseVideo] = useState(!MASCOT_IS_GIF);
  const mascotRef = useRef<HTMLVideoElement>(null);

  usePageMeta(mode === 'login' ? PAGE_META.login : PAGE_META.register);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || !password || loginLoading) return;

    if (mode === 'register') {
      if (!name.trim()) {
        setLocalError('Nama lengkap wajib diisi.');
        return;
      }
      if (password.length < 8) {
        setLocalError('Password minimal 8 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Konfirmasi password tidak cocok.');
        return;
      }
      onSignUpWithEmail(name.trim(), email.trim(), password);
      return;
    }

    onLoginWithEmail(email.trim(), password);
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setLocalError(null);
    onClearLoginError?.();
    if (IS_DEV && next === 'login') {
      setEmail(SUPER_ADMIN_LOGIN.email);
      setPassword(DEV_DEMO_PASSWORD);
    }
  };

  const applyLoginSuggestion = (suggestedEmail: string) => {
    setLocalError(null);
    setEmail(suggestedEmail);
    setPassword(DEV_DEMO_PASSWORD);
  };

  const applyRegisterExample = () => {
    setLocalError(null);
    setName(REGISTER_FORM_EXAMPLE.name);
    setEmail(REGISTER_FORM_EXAMPLE.email);
    setPassword(REGISTER_FORM_EXAMPLE.password);
    setConfirmPassword(REGISTER_FORM_EXAMPLE.password);
  };

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
                Masuk dengan Google atau email, lalu pilih peran sebagai guru, kepala sekolah, atau donatur.
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
                  <p className="auth-card-kicker">{AUTH_CARD_COPY[mode].kicker}</p>
                </div>
                <p className="auth-card-sub">{AUTH_CARD_COPY[mode].lead}</p>
              </header>

              {(loginError || localError) && (
                <div role="alert" className="portal-banner portal-banner--error auth-card-alert">
                  <p className="auth-card-alert-text">{localError ?? loginError}</p>
                  {mode === 'login' && !localError ? (
                    <p className="auth-card-alert-hint">
                      Belum punya akun?{' '}
                      <button type="button" className="auth-mode-link" onClick={() => switchMode('register')}>
                        Daftar sekarang
                      </button>
                    </p>
                  ) : null}
                  {mode === 'register' && !localError ? (
                    <p className="auth-card-alert-hint">
                      Sudah punya akun?{' '}
                      <button type="button" className="auth-mode-link" onClick={() => switchMode('login')}>
                        Masuk
                      </button>
                    </p>
                  ) : null}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form auth-form--underline">
                {mode === 'register' && (
                  <div className="auth-underline-field">
                    <label htmlFor="register-name" className="auth-underline-label">
                      Nama :
                    </label>
                    <div className="auth-underline-control">
                      <User className="auth-underline-icon" size={18} aria-hidden />
                      <input
                        id="register-name"
                        type="text"
                        autoComplete="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama lengkap"
                        className="auth-underline-input"
                      />
                    </div>
                  </div>
                )}

                <div className="auth-underline-field">
                  <label htmlFor="login-email" className="auth-underline-label">
                    Email :
                  </label>
                  <div className="auth-underline-control">
                    <Mail className="auth-underline-icon" size={18} aria-hidden />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={mode === 'login' ? 'nama@email.com' : 'nama@sekolah.sch.id'}
                      className="auth-underline-input"
                    />
                  </div>
                </div>

                <div className="auth-underline-field">
                  <label htmlFor="login-password" className="auth-underline-label">
                    Password :
                  </label>
                  <PasswordInput
                    id="login-password"
                    variant="underline"
                    value={password}
                    onChange={setPassword}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    placeholder={mode === 'register' ? 'Min. 8 karakter' : '••••••••'}
                  />
                </div>

                {mode === 'register' && (
                  <div className="auth-underline-field">
                    <label htmlFor="register-confirm" className="auth-underline-label">
                      Konfirmasi :
                    </label>
                    <PasswordInput
                      id="register-confirm"
                      variant="underline"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      autoComplete="new-password"
                      placeholder="Ulangi password"
                    />
                  </div>
                )}

                <div className="auth-submit-row">
                  <button type="submit" disabled={loginLoading} className="auth-submit-btn">
                    {loginLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" aria-hidden />
                        {mode === 'login' ? 'Memverifikasi…' : 'Mendaftar…'}
                      </>
                    ) : mode === 'login' ? (
                      'Masuk'
                    ) : (
                      'Daftar'
                    )}
                  </button>
                </div>
              </form>

              <p className="auth-mode-toggle auth-mode-toggle--under-submit">
                {mode === 'login' ? (
                  <>
                    Belum punya akun?{' '}
                    <button type="button" className="auth-mode-link" onClick={() => switchMode('register')}>
                      Daftar sekarang
                    </button>
                  </>
                ) : (
                  <>
                    Sudah punya akun?{' '}
                    <button type="button" className="auth-mode-link" onClick={() => switchMode('login')}>
                      Masuk
                    </button>
                  </>
                )}
              </p>

              {googleEnabled ? (
                <>
                  <div className="auth-or-divider" role="separator" aria-label="atau">
                    <span>atau lanjutkan dengan Google</span>
                  </div>
                  <div className="auth-google-panel">
                    <button
                      type="button"
                      disabled={loginLoading}
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
                  </div>
                </>
              ) : null}

              {IS_DEV && mode === 'login' ? (
                <div className="auth-admin-sticky">
                  <button
                    type="button"
                    className="auth-form-suggestion-chip auth-form-suggestion-chip--solo"
                    disabled={loginLoading}
                    onClick={() => {
                      applyLoginSuggestion(SUPER_ADMIN_LOGIN.email);
                      onLoginWithEmail(SUPER_ADMIN_LOGIN.email, DEV_DEMO_PASSWORD);
                    }}
                  >
                    Masuk sebagai {SUPER_ADMIN_LOGIN.label}
                  </button>
                  <p className="auth-field-hint">
                    {SUPER_ADMIN_LOGIN.email} · password sudah terisi
                  </p>
                </div>
              ) : null}

              {IS_DEV ? (
                <div className="auth-card-foot">
                  <div className="auth-dev-instant">
                    <button
                      type="button"
                      className="auth-dev-instant-toggle"
                      aria-expanded={devInstantOpen}
                      onClick={() => setDevInstantOpen((open) => !open)}
                    >
                      Mode development instan
                    </button>
                    {devInstantOpen && (
                      <div className="auth-form-suggestions auth-form-suggestions--dev">
                        <p className="auth-form-suggestions-label">
                          {mode === 'login' ? 'Isi cepat akun demo' : 'Contoh pengisian'}
                        </p>
                        {mode === 'login' ? (
                          <div className="auth-form-suggestion-chips">
                            {LOGIN_FORM_SUGGESTIONS.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className="auth-form-suggestion-chip"
                                disabled={loginLoading}
                                onClick={() => applyLoginSuggestion(item.email)}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="auth-form-suggestion-chip auth-form-suggestion-chip--solo"
                            disabled={loginLoading}
                            onClick={applyRegisterExample}
                          >
                            Isi contoh pendaftaran
                          </button>
                        )}
                        <p className="auth-field-hint">
                          Password demo: <strong>{DEV_DEMO_PASSWORD}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
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
