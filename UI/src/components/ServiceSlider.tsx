import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay, Pagination, Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Play } from 'lucide-react';
import { MediaItem } from '@/types/service';
import { MediaModal } from './MediaModal';

interface ServiceSliderProps {
  media: MediaItem[];
  title: string;
}

export function ServiceSlider({ media, title }: ServiceSliderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);

  if (!media || media.length === 0) return null;

  const handleMediaClick = (idx: number) => {
    setCurrentIdx(idx);
    setModalOpen(true);
    // Pause autoplay when modal opens
    if (swiperRef) swiperRef.autoplay.stop();
  };

  const handleModalClose = () => {
    setModalOpen(false);
    // Resume autoplay when modal closes
    if (swiperRef) swiperRef.autoplay.start();
  };

  return (
    <>
      <div className="relative w-full h-56 sm:h-72 md:h-96 rounded-2xl overflow-hidden shadow-2xl group">
        <Swiper
          modules={[EffectFade, Autoplay, Pagination, Navigation]}
          effect="fade"
          autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          loop={true}
          pagination={{ clickable: true, dynamicBullets: true }}
          navigation={true}
          className="w-full h-full"
          onSwiper={setSwiperRef}
        >
          {media.map((item, idx) => (
            <SwiperSlide
              key={idx}
              className="w-full h-full cursor-pointer group-hover:brightness-105 transition-all"
              onClick={() => handleMediaClick(idx)}
            >
              {item.type === 'video' ? (
                <div className="relative w-full h-full">
                  <video
                    src={item.src}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={item.src}
                  alt={`${title} slide ${idx + 1}`}
                  className="w-full h-full object-cover bg-muted"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/logo.jpg";
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg border border-border">
          <span className="text-sm font-semibold text-foreground tracking-widest uppercase">{title}</span>
        </div>
      </div>

      <MediaModal
        media={media}
        initialIndex={currentIdx}
        isOpen={modalOpen}
        onClose={handleModalClose}
      />
    </>
  );
}
