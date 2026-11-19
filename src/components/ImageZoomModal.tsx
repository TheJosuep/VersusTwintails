"use client";

import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Zoom } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/zoom";

interface ImageZoomModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex: number;
  title: string;
  subtitle: string | null;
  onClose: () => void;
}

export function ImageZoomModal({
  isOpen,
  images,
  initialIndex,
  title,
  subtitle,
  onClose,
}: ImageZoomModalProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de ${title}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold tracking-tight text-white">
            {title}
          </h3>
          {subtitle ? (
            <p className="truncate text-xs text-white/60">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => swiperRef.current?.zoom.out()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
            aria-label="Alejar"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => swiperRef.current?.zoom.in()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
            aria-label="Acercar"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (swiperRef.current && zoomScale > 1) {
                swiperRef.current.zoom.out();
              }
            }}
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 active:scale-95 sm:flex"
            aria-label="Restablecer zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90 active:scale-95"
            aria-label="Cerrar galería"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden p-2 sm:p-6">
        <Swiper
          modules={[Zoom, Navigation, Pagination]}
          initialSlide={initialIndex}
          zoom={{ maxRatio: 3, minRatio: 1, toggle: true }}
          navigation
          pagination={{ clickable: true }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            setZoomScale(1);
          }}
          onZoomChange={(_swiper, scale) => setZoomScale(scale)}
          onSlideChange={() => setZoomScale(1)}
          className="vt-zoom-swiper h-full w-full"
        >
          {images.map((src, idx) => (
            <SwiperSlide key={src} className="flex items-center justify-center">
              <div className="swiper-zoom-container flex h-full w-full items-center justify-center">
                <img
                  src={src}
                  alt={`${title} ${idx + 1}`}
                  className="max-h-full max-w-full rounded-[18px] object-contain select-none"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <p className="pb-3 text-center text-xs text-white/50">
        Doble toque o pellizco para zoom ({zoomScale.toFixed(1)}x) · Desliza para cambiar foto
      </p>
    </div>
  );
}
