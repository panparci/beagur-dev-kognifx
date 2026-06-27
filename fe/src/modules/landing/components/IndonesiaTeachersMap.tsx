import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Map, MapMarker, INDONESIA_BOUNDS } from '@core/ui/map';
import { clusterTeachersByLocation } from '@core/geo/resolveTeacherLocation';
import { usePublicTeachers } from '@core/hooks/usePublicTeachers';

function ClusterMarker({ count }: { count: number }) {
  return (
    <div
      className="flex flex-col items-center pointer-events-none"
      aria-hidden
    >
      <span className="flex min-w-8 h-8 px-1.5 items-center justify-center rounded-full border-2 border-white shadow-md bg-bea-copper text-[11px] font-bold text-white">
        {count > 1 ? count : <MapPin size={14} strokeWidth={2.5} aria-hidden />}
      </span>
      <span className="mt-0.5 size-1.5 rounded-full bg-bea-copper/80" />
    </div>
  );
}

export function IndonesiaTeachersMap() {
  const { teachers, initialLoading, error } = usePublicTeachers();

  const clusters = useMemo(() => clusterTeachersByLocation(teachers), [teachers]);

  const trackedTeacherCount = useMemo(
    () => clusters.reduce((sum, cluster) => sum + cluster.teachers.length, 0),
    [clusters],
  );

  const fitPadding = { top: 130, bottom: 40, left: 24, right: 24 };

  return (
    <section
      id="sebaran-guru"
      className="bea-map-section-wrap border-t border-bea-line"
      aria-label="Sebaran guru penerima bantuan di Indonesia"
    >
      <div className="bea-map-section">
        <Map
          className="bea-map-section__map"
          loading={initialLoading}
          lockZoom
          fitBounds={INDONESIA_BOUNDS}
          fitPadding={fitPadding}
        >
          {clusters.map((cluster) => (
            <MapMarker
              key={cluster.key}
              longitude={cluster.longitude}
              latitude={cluster.latitude}
            >
              <ClusterMarker count={cluster.teachers.length} />
            </MapMarker>
          ))}
        </Map>

        <div className="bea-map-section__overlay">
          <div className="bea-map-section__copy">
            <h2 className="bea-map-section__title">Sebaran guru di Indonesia</h2>
            <p className="bea-map-section__desc">
              Peta wilayah mengajar guru penerima bantuan — koordinat diambil dari pilihan kota/kabupaten
              pada formulir pendaftaran guru.
            </p>

            {error && (
              <p className="bea-map-section__meta text-red-700" role="alert">
                {error}
              </p>
            )}

            {!initialLoading && !error && clusters.length === 0 && (
              <p className="bea-map-section__meta">Belum ada lokasi guru yang bisa ditampilkan.</p>
            )}

            {!initialLoading && clusters.length > 0 && (
              <p className="bea-map-section__meta">
                <span className="font-semibold text-bea-copper-dark">{trackedTeacherCount}</span> guru
                {' · '}
                <span className="font-semibold text-bea-copper-dark">{clusters.length}</span> titik wilayah
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
