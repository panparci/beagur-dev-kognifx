const apiInternalURL = process.env.API_INTERNAL_URL ?? 'http://localhost:8080';

export async function notifyAccountCreated(email: string, name: string): Promise<void> {
  const secret = process.env.INTERNAL_NOTIFY_SECRET?.trim();
  if (!secret) return;

  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  try {
    const res = await fetch(`${apiInternalURL}/api/v1/internal/notifications/account-created`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Notify-Secret': secret,
      },
      body: JSON.stringify({ email: normalized, name: name.trim() || normalized.split('@')[0] }),
    });
    if (!res.ok) {
      console.warn('account-created notify failed:', res.status, await res.text());
    }
  } catch (err) {
    console.warn('account-created notify error:', err);
  }
}
