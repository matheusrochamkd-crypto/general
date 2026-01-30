import React, { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

const quotes = [
    "A sorte segue os audazes.",
    "Qualquer missão, em qualquer lugar, a qualquer hora, de qualquer maneira.",
    "Ousar, Lutar, Querer, Vencer.",
    "O único dia fácil foi ontem.",
    "Quem ousa, vence.",
    "Homem não dá desculpa. Homem só precisa fazer dinheiro."
];

export const QuoteBanner: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * quotes.length));
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            // Start fade out
            setIsVisible(false);

            // After fade out completes, change quote and fade in
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % quotes.length);
                setIsVisible(true);
            }, 500); // Match this with CSS transition duration
        }, 7000); // Change every 7 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-card rounded-xl p-5 mb-8 flex items-center gap-4 relative overflow-hidden">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-yellow/5 rounded-full blur-3xl"></div>

            {/* Quote Icon */}
            <div className="w-10 h-10 rounded-lg bg-accent-yellow/10 border border-accent-yellow/20 flex items-center justify-center flex-shrink-0">
                <Quote className="w-5 h-5 text-accent-yellow" />
            </div>

            {/* Quote Text with Fade Animation */}
            <p
                className={`text-sm italic text-text-secondary leading-relaxed transition-all duration-500 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                    }`}
            >
                "{quotes[currentIndex]}"
            </p>

            {/* Progress Dots */}
            <div className="absolute bottom-2 right-4 flex gap-1">
                {quotes.map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-accent-yellow' : 'bg-white/10'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};
