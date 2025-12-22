import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CatImageGalleryProps {
  images: string[];
  name: string;
  isAdopted: boolean;
}

const CatImageGallery: React.FC<CatImageGalleryProps> = ({ images, name, isAdopted }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const hasMultipleImages = images.length > 1;

  return (
    <>
      <div
        className="relative w-full h-full overflow-hidden touch-pan-y"
        onTouchStart={(e) => {
          setTouchEnd(null);
          setTouchStart(e.targetTouches[0].clientX);
        }}
        onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
        onTouchEnd={() => {
          if (!touchStart || !touchEnd) return;
          const distance = touchStart - touchEnd;
          const isLeftSwipe = distance > minSwipeDistance;
          const isRightSwipe = distance < -minSwipeDistance;

          if (isLeftSwipe && activeImageIndex < images.length - 1) {
            setActiveImageIndex(prev => prev + 1);
          } else if (isRightSwipe && activeImageIndex > 0) {
            setActiveImageIndex(prev => prev - 1);
          }
          else if (isLeftSwipe && activeImageIndex === images.length - 1) {
            // Optional: wrap around or bounce effect
            setActiveImageIndex(0);
          }
          else if (isRightSwipe && activeImageIndex === 0) {
            // Optional: wrap around or bounce effect
            setActiveImageIndex(images.length - 1);
          }
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out h-full"
          style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
        >
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${name} ${idx + 1}`}
              className={`w-full h-full object-cover flex-shrink-0 ${isAdopted ? 'grayscale-[0.8]' : ''}`}
            />
          ))}
        </div>
      </div>

      {hasMultipleImages && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              setActiveImageIndex(curr => curr === 0 ? images.length - 1 : curr - 1);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setActiveImageIndex(curr => curr === images.length - 1 ? 0 : curr + 1);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"
          >
            <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === activeImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'
                  }`}
              />
            ))}
          </div>
        </>
      )}

      {isAdopted && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-20 pointer-events-none">
          <div className="bg-white/90 px-6 py-3 rounded-2xl transform -rotate-12 shadow-2xl border-4 border-slate-800">
            <span className="text-3xl font-black text-slate-800 uppercase tracking-widest">已领养</span>
          </div>
        </div>
      )}
    </>
  );
};

export default CatImageGallery;
