import React, { useState, useRef } from 'react';

const MediaCarousel = ({ media }) => {
  if (!media || media.length === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollLeft = containerRef.current.scrollLeft;
    const width = containerRef.current.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    setActiveIndex(newIndex);
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black/5 aspect-video mt-3 group">
      <div
        ref={containerRef}
        className="w-full h-full flex overflow-x-auto snap-x snap-mandatory custom-scrollbar"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // hide scrollbar
      >
        {media.map((item, idx) => (
          <div key={idx} className="w-full h-full shrink-0 snap-center flex items-center justify-center">
            {item.type === 'video' ? (
              <video
                src={item.url}
                controls
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <img
                src={item.url}
                alt="Post media"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        ))}
      </div>

      {/* Dotted Indicator */}
      {media.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
          {media.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === activeIndex ? 'bg-white w-3' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
