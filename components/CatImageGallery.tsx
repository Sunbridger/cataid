import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CatImageGalleryProps {
  images: string[];
  name: string;
  isAdopted: boolean;
}

const CatImageGallery: React.FC<CatImageGalleryProps> = ({ images, name, isAdopted }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Refs for tracking touch coordinates without triggering re-renders for every pixel
  const touchStartX = useRef<number | null>(null);
  const currentDragOffset = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasMultipleImages = images.length > 1;
  const minSwipeDistance = 50;

  // Handle touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasMultipleImages) return;
    setIsDragging(true);
    touchStartX.current = e.touches[0].clientX;
    currentDragOffset.current = 0;
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || touchStartX.current === null) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;

    // Add resistance at edges if we're not wrapping or to indicate boundary
    // But for now, simple linear movement is fine for smoothness
    currentDragOffset.current = diff;
    setDragOffset(diff); // Trigger render for immediate visual feedback
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);
    touchStartX.current = null;

    const moved = currentDragOffset.current;
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    const threshold = Math.min(containerWidth * 0.2, minSwipeDistance); // 20% or 50px

    if (moved < -threshold) {
      // Swipe Left -> Next Image
      if (activeImageIndex < images.length - 1) {
        setActiveImageIndex(prev => prev + 1);
      } else {
        // Optional: Wrap to start
        setActiveImageIndex(0);
      }
    } else if (moved > threshold) {
      // Swipe Right -> Prev Image
      if (activeImageIndex > 0) {
        setActiveImageIndex(prev => prev - 1);
      } else {
        // Optional: Wrap to end
        setActiveImageIndex(images.length - 1);
      }
    }

    // Reset drag offset
    setDragOffset(0);
    currentDragOffset.current = 0;
  };

  // Helper for manual navigation
  const goToNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setActiveImageIndex(curr => curr === images.length - 1 ? 0 : curr + 1);
  };

  const goToPrev = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setActiveImageIndex(curr => curr === 0 ? images.length - 1 : curr - 1);
  };

  // Reset index if images change
  useEffect(() => {
    setActiveImageIndex(0);
  }, [images.length]);

  return (
    <>
      <div
        className="relative w-full h-full overflow-hidden touch-pan-y select-none"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translate3d(calc(-${activeImageIndex * 100}% + ${dragOffset}px), 0, 0)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              className="w-full h-full flex-shrink-0 relative"
            >
              <img
                src={img}
                alt={`${name} ${idx + 1}`}
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons (Desktop/Overlay) */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveImageIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === activeImageIndex
              ? 'bg-white w-4'
              : 'bg-white/50 hover:bg-white/80'
              }`}
          />
        ))}
      </div>
    </>
  );
};

export default CatImageGallery;
