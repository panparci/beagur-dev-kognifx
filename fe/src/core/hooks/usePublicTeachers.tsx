import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchPublicCampaign, fetchPublicTeachers } from '../api/publicClient';
import { onVisibleOnlineInterval } from '../net/lowSignal';
import { CampaignProgress, TeacherProfile } from '../types';

const REFETCH_INTERVAL_MS = 120_000;

type LandingPublicContextValue = {
  teachers: TeacherProfile[];
  campaign: CampaignProgress | null;
  initialLoading: boolean;
  teachersError: string | null;
  campaignError: string | null;
  lastUpdated: Date | null;
  reload: (silent?: boolean) => Promise<void>;
};

const LandingPublicContext = createContext<LandingPublicContextValue | null>(null);

/** Satu sumber data publik landing: kampanye + guru (sinkron DB, auto-refresh). */
export function PublicTeachersProvider({ children }: { children: React.ReactNode }) {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [campaign, setCampaign] = useState<CampaignProgress | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [teachersError, setTeachersError] = useState<string | null>(null);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const reload = useCallback(async (silent = false) => {
    const [teachersResult, campaignResult] = await Promise.allSettled([
      fetchPublicTeachers(),
      fetchPublicCampaign(),
    ]);

    let hadSuccess = false;

    if (teachersResult.status === 'fulfilled') {
      setTeachers(Array.isArray(teachersResult.value) ? teachersResult.value : []);
      setTeachersError(null);
      hadSuccess = true;
    } else if (!silent) {
      const err = teachersResult.reason;
      setTeachersError(err instanceof Error ? err.message : 'Gagal memuat data guru');
      setTeachers([]);
    }

    if (campaignResult.status === 'fulfilled') {
      setCampaign(campaignResult.value);
      setCampaignError(null);
      hadSuccess = true;
    } else if (!silent) {
      const err = campaignResult.reason;
      setCampaignError(err instanceof Error ? err.message : 'Gagal memuat statistik program');
      setCampaign(null);
    }

    if (hadSuccess) {
      setLastUpdated(new Date());
    }

    if (!silent) {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    reload(false);
    return onVisibleOnlineInterval(() => reload(true), REFETCH_INTERVAL_MS);
  }, [reload]);

  const value = useMemo(
    () => ({
      teachers,
      campaign,
      initialLoading,
      teachersError,
      campaignError,
      lastUpdated,
      reload,
    }),
    [teachers, campaign, initialLoading, teachersError, campaignError, lastUpdated, reload],
  );

  return (
    <LandingPublicContext.Provider value={value}>{children}</LandingPublicContext.Provider>
  );
}

function useLandingPublicContext() {
  const ctx = useContext(LandingPublicContext);
  if (!ctx) {
    throw new Error('usePublicTeachers must be used within PublicTeachersProvider');
  }
  return ctx;
}

export function usePublicTeachers() {
  const { teachers, initialLoading, teachersError, lastUpdated, reload } = useLandingPublicContext();
  return {
    teachers,
    initialLoading,
    error: teachersError,
    lastUpdated,
    reload,
  };
}

export function useLandingCampaign() {
  const { campaign, initialLoading, campaignError, lastUpdated } = useLandingPublicContext();
  return { campaign, initialLoading, campaignError, lastUpdated };
}
