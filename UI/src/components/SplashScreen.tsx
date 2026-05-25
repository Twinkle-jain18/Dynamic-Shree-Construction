import { useState, useEffect } from 'react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [showTagline, setShowTagline] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show tagline after 1.5s
    const taglineTimer = setTimeout(() => {
      setShowTagline(true);
    }, 1500);

    // Fade out everything after 3.5s
    const fadeOutTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3500);

    // Call onComplete after 4s to unmount
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ease-in-out ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center animate-fade-in group">
        <img
          src="/assets/logo.jpg"
          alt="Shree Construction Logo"
          className="w-32 h-32 md:w-48 md:h-48 object-cover mb-8 rounded-full shadow-2xl transition-transform duration-1000 ease-out group-hover:scale-105"
          onError={(e) => {
            // Fallback if they provide logo.png instead of logo.jpg
            if (!e.currentTarget.src.includes("logo.png")) {
              e.currentTarget.src = "/assets/logo.png";
            } else {
              e.currentTarget.style.display = 'none';
            }
          }}
        />
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 tracking-wide text-center drop-shadow-sm">
          Shree Construction
        </h1>
        <div className="h-10 overflow-hidden flex items-center justify-center">
          <p
            className={`font-body text-xl md:text-2xl text-primary font-medium tracking-widest transition-all duration-1000 ease-in-out text-center ${
              showTagline ? 'opacity-100 translate-y-0 filter-none' : 'opacity-0 translate-y-8 blur-sm'
            }`}
          >
            Your Vision, Our Artistry
          </p>
        </div>
      </div>
    </div>
  );
}
