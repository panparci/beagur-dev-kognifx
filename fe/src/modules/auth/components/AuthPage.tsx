import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import Button from '@core/ui/Button';
import { PasswordInput } from '@core/ui/PasswordInput';
import { PORTAL_FOG_EASE } from '@core/routing/portalTransition';
import { AiAssistantWidget } from '@modules/ai-assistant/components/AiAssistantWidget';
import {
  DEV_DEMO_PASSWORD,
  LOGIN_FORM_SUGGESTIONS,
  REGISTER_FORM_EXAMPLE,
} from '@modules/auth/devPersonas';
import { PAGE_META } from '@core/constants/siteMeta';
import { usePageMeta } from '@core/hooks/usePageMeta';
import { ArrowLeft, Loader2, Mail, User } from 'lucide-react';

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

const AUTH_MASCOT_SRC = '/maskot.mp4';
const AUTH_MASCOT_BG = '#E5DED2';
const IS_DEV = import.meta.env.DEV;

const AUTH_CARD_COPY = {
  login: {
    kicker: 'Masuk',
    lead: 'Masuk dengan email untuk membuka portal Bea Guru Anda.',
  },
  register: {
    kicker: 'Daftar',
    lead: 'Buat akun gratis — pilih peran setelah pendaftaran selesai.',
  },
} as const;

function AuthFieldHint({ children }: { children: React.ReactNode }) {
  return <p className="auth-field-hint">{children}</p>;
}

const AuthPage: React.FC<AuthPageProps> = ({
  onLoginWithEmail,
  onSignUpWithEmail,
  onLoginWithGoogle,
  onSwitchToLanding,
  loginLoading = false,
  loginError = null,
  googleEnabled = false,
  authTransitioning = false,
}) => {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [devInstantOpen, setDevInstantOpen] = useState(false);
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
  }, []);

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
          <button type="button" onClick={onSwitchToLanding} className="auth-back auth-back--on-light">
            <ArrowLeft size={16} aria-hidden />
            Beranda
          </button>

          <div className="auth-brand-body">
            <div className="auth-brand-mascot-wrap">
              <video
                ref={mascotRef}
                className="auth-brand-mascot"
                src={AUTH_MASCOT_SRC}
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                controlsList="nodownload nofullscreen noremoteplayback"
                preload="auto"
                disablePictureInPicture
                aria-hidden
              />
            </div>
            <div className="auth-brand-copy">
              <p className="auth-brand-kicker">Portal resmi yayasan</p>
              <h1 className="auth-brand-title">Bea Guru Indonesia</h1>
              <p className="auth-brand-lead">
                Platform penyaluran bantuan transparan untuk guru honorer di seluruh Indonesia.
                Daftar atau masuk dengan email Anda — lalu pilih peran sebagai guru, kepala sekolah,
                atau donatur.
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
                  {localError ?? loginError}
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
                      list={mode === 'register' ? 'auth-email-suggestions' : undefined}
                    />
                  </div>
                  {mode === 'register' && (
                    <datalist id="auth-email-suggestions">
                      <option value="nama@sekolah.sch.id" />
                      <option value="nama@gmail.com" />
                      <option value="nama@yahoo.com" />
                    </datalist>
                  )}
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

              <div className="auth-card-foot">
              <p className="auth-mode-toggle">
                {mode === 'login' ? (
                  <>
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      className="auth-mode-link"
                      onClick={() => {
                        setMode('register');
                        setLocalError(null);
                      }}
                    >
                      Daftar sekarang
                    </button>
                  </>
                ) : (
                  <>
                    Sudah punya akun?{' '}
                    <button
                      type="button"
                      className="auth-mode-link"
                      onClick={() => {
                        setMode('login');
                        setLocalError(null);
                      }}
                    >
                      Masuk
                    </button>
                  </>
                )}
              </p>

              {IS_DEV && (
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
                      <AuthFieldHint>
                        Password demo: <strong>{DEV_DEMO_PASSWORD}</strong>
                      </AuthFieldHint>
                    </div>
                  )}
                </div>
              )}

              {googleEnabled && mode === 'login' && (
                <div className="auth-oauth">
                  <div className="auth-oauth-divider" aria-hidden>
                    <span>atau</span>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    disabled={loginLoading}
                    className="w-full auth-google-btn"
                    onClick={onLoginWithGoogle}
                  >
                    Masuk dengan Google
                  </Button>
                </div>
              )}
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
