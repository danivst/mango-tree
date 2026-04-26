/**
 * @file PostImageCarousel.tsx
 * @description Image carousel component for post galleries.
 */

import React from "react";

/**
 * @component
 * @description Renders carousel navigation and image indicators for a post gallery.
 * @param {PostImageCarouselProps} props - Component props.
 */
interface PostImageCarouselProps {
  images: string[];
  currentIndex: number;
  displayTitle: string;
  handlePrev: () => void;
  handleNext: () => void;
  setIndex: (index: number) => void;
}

const PostImageCarousel: React.FC<PostImageCarouselProps> = ({
  images,
  currentIndex,
  displayTitle,
  handlePrev,
  handleNext,
  setIndex,
}) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="image-carousel">
        <img src={images[currentIndex]} alt={`${displayTitle} - image ${currentIndex + 1}`} className="post-image" />
        {images.length > 1 && (
          <>
            <button onClick={handlePrev} className="carousel-nav-btn carousel-prev">
              <span className="material-icons">chevron_left</span>
            </button>
            <button onClick={handleNext} className="carousel-nav-btn carousel-next">
              <span className="material-icons">chevron_right</span>
            </button>
            <div className="image-indicators">
              {images.map((_: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setIndex(index)}
                  className="image-indicator"
                  style={{ background: index === currentIndex ? "white" : "rgba(255,255,255,0.5)" }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PostImageCarousel;
