import { useCallback, useEffect, useState } from 'react';
import { ProgramAnalytics } from '@core/types';
import { adminAnalyticsService } from '../services/adminAnalyticsService';

export function useAdminAnalytics(active: boolean) {
  const [data, setData] = useState<ProgramAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminAnalyticsService.getMonthly(12));
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(
        message && message !== 'Permintaan API gagal'
          ? `Gagal memuat analitik program: ${message}`
          : 'Gagal memuat analitik program. Pastikan migrasi database sudah dijalankan.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) void load();
  }, [active, load]);

  const importFile = async (file: File) => {
    const rows = await adminAnalyticsService.parseImportFile(file);
    if (rows.length === 0) {
      throw new Error('File kosong atau format tidak dikenali. Gunakan CSV, Excel (.xlsx), atau PDF tabel.');
    }
    await adminAnalyticsService.importSnapshots(rows);
    await load();
  };

  return { data, loading, error, reload: load, importFile };
}
