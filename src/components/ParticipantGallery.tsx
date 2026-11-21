"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { Maximize } from "lucide-react";
import type { Participant } from "@/lib/types";
import {
  shouldOpenLightboxOnImageTap,
  useLightbox,
} from "./GlobalLightbox";

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
  const { openLightbox } = useLightbox();
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const openGalleryLightbox = (index: number) => {
    openLightbox({
      images: participant.images,
      initialIndex: index,
      title: participant.name,
      subtitle: participant.group,
    });
  };

  const handleMainImageClick = (index: number) => {
    if (shouldOpenLightboxOnImageTap()) {
      openGalleryLightbox(index);
    }
  };

  return (
    <div
      className={`flex min-w-0 w-full flex-col gap-2.5 rounded-[25px] border bg-white/[0.04] p-2.5 backdrop-blur-md transition duration-300 sm:gap-3.5 sm:p-4 ${
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
          onClick={() => openGalleryLightbox(activeIndex)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/85 transition hover:scale-105 hover:bg-white hover:text-black active:scale-95 sm:h-9 sm:w-9"
          aria-label={`Pantalla completa de ${participant.name}`}
          title="Ver en pantalla de luz"
        >
          <Maximize className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {/* Main Image Carousel (Swiper.js) */}
      <div className="relative min-w-0 w-full overflow-hidden rounded-[20px] border border-white/10 bg-zinc-950">
        <Swiper
          modules={[Thumbs]}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          observer
          observeParents
          spaceBetween={8}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          onResize={(swiper) => swiper.update()}
          onClick={(swiper) => handleMainImageClick(swiper.activeIndex)}
          className="aspect-[3/4] w-full"
        >
          {participant.images.map((src, idx) => (
            <SwiperSlide key={src} className="h-full w-full">
              <div className="group relative block h-full w-full cursor-pointer sm:cursor-grab sm:active:cursor-grabbing">
                <img
                  src={src}
                  alt={`${participant.name} ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-contain transition duration-300 sm:group-hover:scale-[1.015]"
                />
              </div>
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
        observer
        observeParents
        spaceBetween={6}
        slidesPerView={4}
        breakpoints={{
          640: { slidesPerView: 5, spaceBetween: 8 },
          1024: { slidesPerView: 6, spaceBetween: 8 },
        }}
        freeMode
        watchSlidesProgress
        onResize={(swiper) => swiper.update()}
        className="w-full min-w-0"
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
    </div>
  );
}
