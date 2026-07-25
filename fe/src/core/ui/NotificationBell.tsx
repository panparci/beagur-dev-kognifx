import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { portalPathForTab } from '@core/routing/tabRoutes';
import { AppNotification, notificationService } from '@core/services/notificationService';

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const reload = async () => {
    const [list, count] = await Promise.all([
      notificationService.list(),
      notificationService.unreadCount(),
    ]);
    setItems(list);
    setUnread(count.count);
  };

  useEffect(() => {
    void reload().catch(() => {
      /* bell is best-effort */
    });
    const t = window.setInterval(() => {
      void notificationService.unreadCount().then((c) => setUnread(c.count)).catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    void reload().catch(() => undefined);
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const onClickItem = async (n: AppNotification) => {
    if (!n.isRead) {
      await notificationService.markRead(n.id).catch(() => undefined);
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    if (n.linkTab) {
      navigate(portalPathForTab(n.linkTab));
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-bea-line bg-white text-bea-ink hover:bg-bea-ivory-light"
        aria-label="Notifikasi"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={17} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-bea-copper px-1 text-[10px] font-bold leading-4 text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-bea-line bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-bea-line px-3 py-2">
            <p className="text-sm font-semibold text-bea-ink">Notifikasi</p>
            <button
              type="button"
              className="text-xs text-bea-copper underline"
              onClick={() =>
                void notificationService
                  .markAllRead()
                  .then(() => {
                    setUnread(0);
                    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
                  })
                  .catch(() => undefined)
              }
            >
              Tandai semua dibaca
            </button>
          </div>
          <ul className="max-h-80 overflow-auto">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-bea-sage-muted">Belum ada notifikasi.</li>
            ) : (
              items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2.5 text-left hover:bg-bea-ivory-light ${n.isRead ? '' : 'bg-bea-ivory-light/60'}`}
                    onClick={() => void onClickItem(n)}
                  >
                    <p className="text-sm font-medium text-bea-ink">{n.title}</p>
                    {n.body ? <p className="mt-0.5 text-xs text-bea-sage-muted line-clamp-2">{n.body}</p> : null}
                    <p className="mt-1 text-[10px] text-bea-sage-muted">
                      {new Date(n.createdAt).toLocaleString('id-ID')}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
