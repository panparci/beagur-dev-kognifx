/**
 * MapLibre map primitives (mapcn.dev pattern) — disederhanakan untuk proyek Tailwind CDN.
 * @see https://www.mapcn.dev/docs/installation
 */
import MapLibreGL from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Minus, Plus } from 'lucide-react';

const CARTO_LIGHT = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

type MapContextValue = {
  map: MapLibreGL.Map | null;
  isLoaded: boolean;
};

const MapContext = createContext<MapContextValue | null>(null);

function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a Map component');
  }
  return context;
}

/** Batas geografis Indonesia (SW, NE) — [lng, lat], Aceh hingga Papua */
export const INDONESIA_BOUNDS: [[number, number], [number, number]] = [
  [94.0, -11.8],
  [141.8, 6.8],
];

export const INDONESIA_CENTER: [number, number] = [118.0, -2.5];

type MapProps = {
  children?: ReactNode;
  className?: string;
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: [[number, number], [number, number]];
  /** Fit the map to these bounds on load and resize (pairs well with lockZoom). */
  fitBounds?: [[number, number], [number, number]];
  fitPadding?: number | MapLibreGL.PaddingOptions;
  loading?: boolean;
  /** When true, disables scroll/touch/double-click zoom and locks zoom level. */
  lockZoom?: boolean;
  /** Allow dragging the map. Ignored when lockZoom is true (pan also disabled). */
  allowPan?: boolean;
} & Omit<MapLibreGL.MapOptions, 'container' | 'style' | 'center' | 'zoom'>;

export type MapRef = MapLibreGL.Map;

function scheduleMapResize(map: MapLibreGL.Map) {
  map.resize();
  requestAnimationFrame(() => map.resize());
  window.setTimeout(() => map.resize(), 120);
  window.setTimeout(() => map.resize(), 480);
}

function fitMapToBounds(
  map: MapLibreGL.Map,
  bounds: [[number, number], [number, number]],
  padding: number | MapLibreGL.PaddingOptions,
  lockZoom: boolean,
) {
  if (lockZoom) {
    // ponytail: unlock dulu — refit resize bisa naikkan zoom di atas maxZoom terkunci
    map.setMinZoom(-2);
    map.setMaxZoom(22);
  }
  map.fitBounds(bounds, { padding, duration: 0, animate: false });
  if (lockZoom) {
    const z = map.getZoom();
    map.setMinZoom(z);
    map.setMaxZoom(z);
  }
}

export const Map = forwardRef<MapRef, MapProps>(function Map(
  {
    children,
    className = '',
    center = INDONESIA_CENTER,
    zoom = 4.8,
    minZoom = 4,
    maxZoom = 12,
    maxBounds = INDONESIA_BOUNDS,
    fitBounds,
    fitPadding = 48,
    loading = false,
    lockZoom = false,
    allowPan = true,
    ...props
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreGL.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useImperativeHandle(ref, () => mapRef.current as MapLibreGL.Map, [isLoaded]);

  useEffect(() => {
    if (loading || !hostRef.current || mapRef.current) return;

    const host = hostRef.current;

    const initMap = () => {
      if (mapRef.current || !hostRef.current) return;
      if (hostRef.current.getBoundingClientRect().height < 8) return;

      const map = new MapLibreGL.Map({
        container: hostRef.current,
        style: CARTO_LIGHT,
        center,
        zoom,
        minZoom: lockZoom && !fitBounds ? zoom : minZoom,
        maxZoom: lockZoom && !fitBounds ? zoom : maxZoom,
        maxBounds,
        attributionControl: { compact: true },
        scrollZoom: lockZoom ? false : undefined,
        boxZoom: lockZoom ? false : undefined,
        doubleClickZoom: lockZoom ? false : undefined,
        touchZoomRotate: lockZoom ? false : undefined,
        dragRotate: lockZoom ? false : undefined,
        dragPan: lockZoom ? false : allowPan,
        keyboard: lockZoom ? false : undefined,
        ...props,
      });

      mapRef.current = map;

      map.on('load', () => {
        scheduleMapResize(map);
        if (fitBounds) {
          fitMapToBounds(map, fitBounds, fitPadding, lockZoom);
        }
        setIsLoaded(true);
      });

      map.on('error', (event) => {
        console.error('[MapLibre]', event.error?.message ?? event);
      });
    };

    initMap();

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          initMap();
          if (mapRef.current) scheduleMapResize(mapRef.current);
        }
      },
      { threshold: 0.05, rootMargin: '80px' },
    );
    visibilityObserver.observe(host);

    return () => {
      visibilityObserver.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    const map = mapRef.current;
    const host = hostRef.current;
    if (!map || !host || !isLoaded) return;

    scheduleMapResize(map);

    const refit = () => {
      if (fitBounds) {
        fitMapToBounds(map, fitBounds, fitPadding, lockZoom);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
      refit();
    });
    resizeObserver.observe(host);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          scheduleMapResize(map);
          refit();
        }
      },
      { threshold: 0.05 },
    );
    intersectionObserver.observe(host);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [isLoaded, fitBounds, fitPadding, lockZoom]);

  const contextValue = useMemo(
    () => ({ map: mapRef.current, isLoaded }),
    [isLoaded],
  );

  return (
    <MapContext.Provider value={contextValue}>
      <div ref={hostRef} className={`bea-map-host relative overflow-hidden ${className}`}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bea-ivory/60 backdrop-blur-[2px]">
            <div className="flex gap-1.5">
              <span className="size-2 animate-pulse rounded-full bg-bea-copper/70" />
              <span className="size-2 animate-pulse rounded-full bg-bea-copper/70 [animation-delay:150ms]" />
              <span className="size-2 animate-pulse rounded-full bg-bea-copper/70 [animation-delay:300ms]" />
            </div>
          </div>
        )}
        {isLoaded && children}
      </div>
    </MapContext.Provider>
  );
});

type MapControlsProps = {
  className?: string;
  showZoom?: boolean;
};

export function MapControls({ className = '', showZoom = true }: MapControlsProps) {
  const { map } = useMap();
  if (!map || !showZoom) return null;

  return (
    <div className={`absolute bottom-4 right-4 z-10 flex flex-col overflow-hidden rounded-lg border border-bea-line bg-white/95 shadow-soft ${className}`}>
      <button
        type="button"
        aria-label="Perbesar peta"
        className="flex h-9 w-9 items-center justify-center text-bea-ink transition hover:bg-bea-ivory-light"
        onClick={() => map.zoomIn({ duration: 200 })}
      >
        <Plus size={16} />
      </button>
      <div className="h-px bg-bea-line" />
      <button
        type="button"
        aria-label="Perkecil peta"
        className="flex h-9 w-9 items-center justify-center text-bea-ink transition hover:bg-bea-ivory-light"
        onClick={() => map.zoomOut({ duration: 200 })}
      >
        <Minus size={16} />
      </button>
    </div>
  );
}

type MapMarkerProps = {
  longitude: number;
  latitude: number;
  children?: ReactNode;
  onClick?: () => void;
};

export function MapMarker({ longitude, latitude, children, onClick }: MapMarkerProps) {
  const { map } = useMap();
  const markerRef = useRef<MapLibreGL.Marker | null>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!map) return;

    const el = document.createElement('div');
    setMountNode(el);

    const marker = new MapLibreGL.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([longitude, latitude])
      .addTo(map);
    markerRef.current = marker;

    if (onClick) {
      el.addEventListener('click', onClick);
    }

    return () => {
      if (onClick) {
        el.removeEventListener('click', onClick);
      }
      marker.remove();
      markerRef.current = null;
      setMountNode(null);
    };
  }, [map, onClick]);

  useEffect(() => {
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  if (!mountNode || !children) return null;
  return createPortal(children, mountNode);
}

type MapPopupProps = {
  longitude: number;
  latitude: number;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
};

export function MapPopup({ longitude, latitude, onClose, children, className = '' }: MapPopupProps) {
  const { map } = useMap();
  const popupRef = useRef<MapLibreGL.Popup | null>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!map) return;

    const container = document.createElement('div');
    setMountNode(container);

    const popup = new MapLibreGL.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 12,
      className: `bea-map-popup ${className}`.trim(),
    })
      .setDOMContent(container)
      .setLngLat([longitude, latitude])
      .addTo(map);

    popupRef.current = popup;

    if (onClose) {
      popup.on('close', onClose);
    }

    return () => {
      popup.remove();
      popupRef.current = null;
      setMountNode(null);
    };
  }, [map]);

  useEffect(() => {
    popupRef.current?.setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  if (!mountNode) return null;
  return createPortal(children, mountNode);
}
