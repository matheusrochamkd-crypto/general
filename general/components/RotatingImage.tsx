import React, { useState, useEffect } from 'react';

interface RotatingImageProps {
    images: string[];
    interval?: number;
    className?: string;
    alt?: string;
}

export const RotatingImage: React.FC<RotatingImageProps> = ({
    images,
    interval = 5000,
    className = "",
    alt = "Rotating image"
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [opacity, setOpacity] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (images.length <= 1) return;

        const timer = setInterval(() => {
            setIsTransitioning(true);
            setOpacity(0);

            setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
                setOpacity(1);
                setIsTransitioning(false);
            }, 500); // 500ms fade out duration

        }, interval);

        return () => clearInterval(timer);
    }, [images, interval]);

    if (images.length === 0) return null;

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <img
                src={images[currentIndex]}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out`}
                style={{ opacity: opacity }}
            />
        </div>
    );
};
