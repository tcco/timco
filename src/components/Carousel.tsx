import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

interface CarouselProps {
  images: { id: string; img: string; name?: string }[];
  height?: number;
}

export default function Carousel({ images, height = 300 }: CarouselProps) {
  const [width, setWidth] = useState(0);
  const carousel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (carousel.current) {
      setWidth(carousel.current.scrollWidth - carousel.current.offsetWidth);
    }
  }, [images]);

  return (
    <div className="w-full overflow-hidden">
      <motion.div
        ref={carousel}
        className="cursor-grab overflow-hidden active:cursor-grabbing"
      >
        <motion.div
          drag="x"
          dragConstraints={{ right: 0, left: -width }}
          className="flex gap-4"
        >
          {images.map((image) => (
            <motion.div
              key={image.id}
              className="relative shrink-0 overflow-hidden rounded-lg bg-gray-100"
              style={{ height: height, minWidth: height * 0.75 }} // 3:4 aspect ratio-ish base
            >
              <img
                src={image.img}
                alt={image.name || 'Gallery image'}
                className="pointer-events-none h-full w-full object-cover"
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
