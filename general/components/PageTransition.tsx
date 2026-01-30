import React, { useEffect, useState } from 'react';

interface PageTransitionProps {
    children: React.ReactNode;
    isVisible: boolean;
    onExited?: () => void;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, isVisible, onExited }) => {
    const [shouldRender, setShouldRender] = useState(isVisible);
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            setAnimationClass('animate-fade-in-up');
        } else {
            setAnimationClass('animate-fade-out-down');
            // Wait for animation to finish before unmounting
            const timer = setTimeout(() => {
                setShouldRender(false);
                if (onExited) onExited();
            }, 300); // Match this with CSS duration
            return () => clearTimeout(timer);
        }
    }, [isVisible, onExited]);

    if (!shouldRender) return null;

    return (
        <div className={`relative z-40 w-full ${animationClass}`}>
            {children}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes fadeOutDown {
                    from {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(20px) scale(0.98);
                    }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fade-out-down {
                    animation: fadeOutDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};
