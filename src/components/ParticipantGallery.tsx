"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { Maximize2 } from "lucide-react";
import type { Participant } from "@/lib/types";
import { ImageZoomModal } from "./ImageZoomModal";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/thumbs";

interface ParticipantGalleryProps {
  participant: Participant;
  sideLabel: "A" | "B";
  isSelectedWinner?: boolean;
}

export function ParticipantGallery({
  participant,
  sideLabel,
  isSelectedWinner = false,
}: ParticipantGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <div
      className={`flex flex-col gap-2.5 rounded-[25px] border bg-white/[0.04] p-2.5 backdrop-blur-md transition duration-300 sm:gap-3.5 sm:p-4 ${
        isSelectedWinner
          ? "border-white/80 shadow-[0_0_30px_rgba(255,255,255,0.12)]"
          : "border-white/10 hover:border-white/25"
      }`}
    >
      <div className="flex items-start justify-between gap-2 px-1">
        <div className="min-w-0">
          <span className="inline-block text-[10px] font-medium uppercase tracking-widest text-white/45 sm:text-xs">
            Participante {sideLabel}
          </span>
          <h2 className="truncate text-base font-bold tracking-tight text-white sm:text-2xl">
            {participant.name}
          </h2>
          <p className="truncate text-[11px] text-white/55 sm:text-xs">
            {participant.group ?? "Sin grupo"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/85 transition hover:scale-105 hover:bg-white hover:text-black active:scale-95 sm:h-9 sm:w-9"
          aria-label={`Ampliar foto de ${participant.name}`}
          title="Abrir zoom"
        >
          <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {/* Main Image Carousel (Swiper.js) */}
      <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-zinc-950">
        <Swiper
          modules={[Thumbs]}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          spaceBetween={8}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          className="aspect-[3/4] w-full"
        >
          {participant.images.map((src, idx) => (
            <SwiperSlide key={src} className="h-full w-full">
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                className="group relative block h-full w-full cursor-zoom-in focus:outline-none"
                aria-label={`Ver imagen ${idx + 1} de ${participant.name} con zoom`}
              >
                <img
                  src={src}
                  alt={`${participant.name} ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-full border border-white/15 bg-black/65 px-2.5 py-0.5 text-[11px] font-medium text-white/85 backdrop-blur-md">
          {activeIndex + 1}/{participant.images.length}
        </div>
      </div>

      {/* Bottom Thumbnail Strip (Swiper.js) */}
      <Swiper
        onSwiper={setThumbsSwiper}
        modules={[FreeMode, Thumbs]}
        spaceBetween={6}
        slidesPerView={4}
        breakpoints={{
          640: { slidesPerView: 5, spaceBetween: 8 },
          1024: { slidesPerView: 6, spaceBetween: 8 },
        }}
        freeMode
        watchSlidesProgress
        className="w-full"
      >
        {participant.images.map((src, idx) => {
          const isActive = idx === activeIndex;
          return (
            <SwiperSlide key={src} className="cursor-pointer">
              <div
                className={`aspect-square overflow-hidden rounded-[12px] border bg-zinc-950 transition duration-200 ${
                  isActive
                    ? "border-white opacity-100 ring-1 ring-white"
                    : "border-white/10 opacity-50 hover:opacity-85"
                }`}
              >
                <img
                  src={src}
                  alt={`${participant.name} miniatura ${idx + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <ImageZoomModal
        isOpen={zoomOpen}
        images={participant.images}
        initialIndex={activeIndex}
        title={participant.name}
        subtitle={participant.group}
        onClose={() => setZoomOpen(false)}
      />
    </div>
  );
}
