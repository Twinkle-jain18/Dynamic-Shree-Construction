import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { MediaItem } from '@/types/service';
import { BackButton } from './BackButton';

interface MediaModalProps {
  media: MediaItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaModal({ media, initialIndex, isOpen, onClose }: MediaModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, initialIndex]);

  const handlePrevious = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  }, [media.length]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  }, [media.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrevious, handleNext]);

  if (!isOpen || !media.length) return null;

  const currentItem = media[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white animate-fade-in"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {/* Navigation Buttons */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[10000] inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-md text-primary font-body font-bold text-sm shadow-lg border border-primary/20 hover:bg-primary hover:text-white transition-all duration-300"
        >
          ✕ Close
        </button>

        {/* Index Indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <span className="text-primary font-body text-xs font-bold tracking-widest bg-primary/5 px-4 py-1.5 rounded-full border border-primary/20 backdrop-blur-sm">
            {currentIndex + 1} / {media.length}
          </span>
        </div>

        {/* Navigation Areas */}
        {media.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 z-50 p-2.5 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-full backdrop-blur-md transition-all border border-primary/10 hover:scale-110"
              onClick={handlePrevious}
            >
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
            </button>

            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 z-50 p-2.5 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-full backdrop-blur-md transition-all border border-primary/10 hover:scale-110"
              onClick={handleNext}
            >
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          </>
        )}

        {/* Media Container */}
        <div className="relative w-full h-full flex items-center justify-center p-0 select-none animate-zoom-in">
          {currentItem.type === 'video' ? (
            <video
              key={currentItem.src}
              src={currentItem.src}
              autoPlay
              controls
              loop
              className="w-full h-full object-contain rounded-none shadow-none transition-opacity duration-300 bg-white"
            />
          ) : (
            <img
              src={currentItem.src}
              alt={`Gallery view ${currentIndex + 1}`}
              className="w-full h-full object-contain rounded-none shadow-none transition-opacity duration-300 bg-white"
              draggable={false}
              onError={(e) => {
                e.currentTarget.src = "/assets/logo.jpg";
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
