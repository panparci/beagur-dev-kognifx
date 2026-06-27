import { User } from '@core/types';
import { markPortalEntryFromAuth } from '@core/routing/portalTransition';
import { authClient } from '../auth-client';
import { setAccessToken } from '../auth-token';
import { fetchAppUser } from '../api/appUser';

export const authService = {
  async loginWithEmail(email: string, password: string): Promise<User> {
    const { error } = await authClient.signIn.email({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      throw new Error(error.message ?? 'Email atau password salah.');
    }

    const user = await fetchAppUser();
    if (!user) {
      await authClient.signOut();
      setAccessToken(null);
      throw new Error('Akun belum siap. Coba daftar ulang atau hubungi admin.');
    }
    return user;
  },

  async signUpWithEmail(name: string, email: string, password: string): Promise<User> {
    const { error } = await authClient.signUp.email({
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
    });
    if (error) {
      throw new Error(error.message ?? 'Pendaftaran gagal. Coba lagi.');
    }

    const user = await fetchAppUser();
    if (!user) {
      await authClient.signOut();
      setAccessToken(null);
      throw new Error('Akun dibuat tetapi profil aplikasi belum siap. Coba masuk lagi.');
    }
    return user;
  },

  async loginWithGoogle(): Promise<void> {
    markPortalEntryFromAuth({ localFog: true });
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/portal',
    });
  },

  async logout(): Promise<void> {
    setAccessToken(null);
    try {
      await authClient.signOut();
    } catch {
      /* ignore */
    }
  },

  async restoreSession(): Promise<User | null> {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      setAccessToken(null);
      return null;
    }
    try {
      return await fetchAppUser();
    } catch {
      setAccessToken(null);
      return null;
    }
  },

  async refreshAppUser(): Promise<User | null> {
    return fetchAppUser();
  },
};
