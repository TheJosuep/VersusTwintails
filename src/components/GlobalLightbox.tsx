"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  FreeMode,
  Keyboard,
  Navigation,
  Pagination,
  Thumbs,
  Zoom,
} from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";
import "swiper/css/zoom";

export interface LightboxPayload {
  images: string[];
  initialIndex?: number;
  title: string;
  subtitle?: string | null;
}

/**
 * Returns true on mobile/touch viewports where tapping an image directly opens the lightbox.
 * Desktop viewports require clicking the dedicated [ ] fullscreen button.
 */
export function shouldOpenLightboxOnImageTap(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(
    "(max-width: 639px), ((hover: none) and (pointer: coarse))"
  ).matches;
}

interface LightboxContextValue {
  openLightbox: (payload: LightboxPayload) => void;
  closeLightbox: () => void;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

export function useLightbox(): LightboxContextValue {
  const ctx = useContext(LightboxContext);
  if (!ctx) {
    throw new Error("useLightbox must be used inside LightboxProvider");
  }
  return ctx;
}

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<LightboxPayload | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openLightbox = useCallback((next: LightboxPayload) => {
    setPayload(next);
  }, []);

  const closeLightbox = useCallback(() => {
    setPayload(null);
  }, []);

  return (
    <LightboxContext.Provider value={{ openLightbox, closeLightbox }}>
      {children}
      {mounted && payload
        ? createPortal(
            <GlobalLightboxOverlay payload={payload} onClose={closeLightbox} />,
            document.body
          )
        : null}
    </LightboxContext.Provider>
  );
}

function GlobalLightboxOverlay({
  payload,
  onClose,
}: {
  payload: LightboxPayload;
  onClose: () => void;
}) {
  const mainSwiperRef = useRef<SwiperType | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(payload.initialIndex ?? 0);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const { images, title, subtitle, initialIndex = 0 } = payload;

  return (
    <div
      className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen flex-col bg-black/95 backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
      aria-label={`Pantalla de luz de ${title}`}
    >
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate text-base font-bold tracking-tight text-white sm:text-xl">
              {title}
            </h3>
            <span className="shrink-0 text-xs font-medium text-white/50">
              {activeIndex + 1}/{images.length}
            </span>
          </div>
          {subtitle ? (
            <p className="truncate text-xs text-white/55">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => mainSwiperRef.current?.zoom.out()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 sm:h-10 sm:w-10"
            aria-label="Alejar"
            title="Alejar"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => mainSwiperRef.current?.zoom.in()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 sm:h-10 sm:w-10"
            aria-label="Acercar"
            title="Acercar"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (mainSwiperRef.current && zoomScale > 1) {
                mainSwiperRef.current.zoom.out();
              }
            }}
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 sm:flex"
            aria-label="Restablecer zoom"
            title="Restablecer zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90 active:scale-95 sm:h-10 sm:w-10"
            aria-label="Cerrar pantalla de luz"
            title="Cerrar (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Zoomable Stage */}
      <div className="relative min-h-0 flex-1 overflow-hidden px-2 py-3 sm:px-6 sm:py-4">
        <Swiper
          modules={[Zoom, Navigation, Pagination, Thumbs, Keyboard]}
          initialSlide={initialIndex}
          observer
          observeParents
          zoom={{ maxRatio: 4, minRatio: 1, toggle: true }}
          navigation
          keyboard={{ enabled: true }}
          pagination={{ clickable: true }}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          onSwiper={(swiper) => {
            mainSwiperRef.current = swiper;
            setZoomScale(1);
          }}
          onZoomChange={(_swiper, scale) => setZoomScale(scale)}
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.activeIndex);
            setZoomScale(1);
          }}
          className="vt-zoom-swiper h-full w-full"
        >
          {images.map((src, idx) => (
            <SwiperSlide key={src} className="flex items-center justify-center">
              <div className="swiper-zoom-container flex h-full w-full items-center justify-center">
                <img
                  src={src}
                  alt={`${title} ${idx + 1}`}
                  className="max-h-full max-w-full rounded-[16px] object-contain select-none"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Bottom Thumbnail Strip + Hint */}
      <div className="border-t border-white/10 bg-black/70 px-3 pb-3 pt-2.5 backdrop-blur-md sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Swiper
            onSwiper={setThumbsSwiper}
            modules={[FreeMode, Thumbs]}
            initialSlide={initialIndex}
            observer
            observeParents
            spaceBetween={8}
            slidesPerView={5}
            breakpoints={{
              640: { slidesPerView: 7 },
              1024: { slidesPerView: 10 },
            }}
            freeMode
            watchSlidesProgress
            className="w-full"
          >
            {images.map((src, idx) => {
              const isActive = idx === activeIndex;
              return (
                <SwiperSlide key={src} className="cursor-pointer">
                  <div
                    className={`aspect-square overflow-hidden rounded-[10px] border bg-zinc-950 transition duration-200 ${
                      isActive
                        ? "border-white opacity-100 ring-1 ring-white"
                        : "border-white/10 opacity-45 hover:opacity-85"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${title} miniatura ${idx + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>

        <p className="mt-2 text-center text-[11px] text-white/45">
          Zoom {zoomScale.toFixed(1)}x · Doble toque o pellizco para acercar · Desliza para cambiar foto
        </p>
      </div>
    </div>
  );
}
