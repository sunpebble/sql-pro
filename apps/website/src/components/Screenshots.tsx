import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';

const screenshotKeys = ['welcome', 'database', 'table', 'query'] as const;

export default function Screenshots() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const screenshots = screenshotKeys.map((key) => ({
    src: `/screenshots/${key}${resolvedTheme === 'dark' ? '-dark' : ''}.png`,
    alt: t(`screenshots.${key}`),
    caption: t(`screenshots.${key}`),
  }));

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % screenshots.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, screenshots.length]);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
    setIsAutoPlaying(false);
    setTimeout(setIsAutoPlaying, 10000, true);
  }, []);

  const goPrev = useCallback(
    () => goTo((current - 1 + screenshots.length) % screenshots.length),
    [current, screenshots.length, goTo]
  );
  const goNext = useCallback(
    () => goTo((current + 1) % screenshots.length),
    [current, screenshots.length, goTo]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
  };

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  return (
    <section
      className="relative overflow-hidden py-16 md:py-24 lg:py-32"
      id="screenshots"
      aria-labelledby="screenshots-title"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-5 md:px-12">
        <header className="mb-10 text-center sm:mb-16">
          <span className="bg-main/10 text-main border-main/20 mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            {t('screenshots.title')}
          </span>
          <h2
            id="screenshots-title"
            className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            <span className="text-main">{t('screenshots.title')}</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-[500px] text-base leading-relaxed sm:text-lg">
            {t('screenshots.subtitle')}
          </p>
        </header>

        <div
          ref={containerRef}
          className="relative flex items-center justify-center gap-4 px-0 sm:gap-8 sm:px-4 md:px-16"
          role="region"
          aria-roledescription="carousel"
          aria-label={t('screenshots.title')}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          tabIndex={0}
        >
          {/* Prev button — visible on all screen sizes */}
          <button
            className="bg-background border-border text-muted-foreground hover:bg-main hover:text-main-foreground absolute left-0 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-all duration-150 hover:shadow-md active:scale-95 sm:h-11 sm:w-11"
            onClick={goPrev}
            aria-label={t('screenshots.prev')}
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div
            className="relative mb-12 aspect-video w-full max-w-[1000px] sm:mb-16"
            aria-live="polite"
          >
            {screenshots.map((shot, index) => {
              const offset = index - current;
              return (
                <div
                  key={`${screenshotKeys[index]}-${resolvedTheme}`}
                  className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
                    offset === 0 ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
                  style={{
                    transform: `translateX(${offset * 100}%) scale(${offset === 0 ? 1 : 0.85})`,
                    opacity: Math.abs(offset) > 1 ? 0 : offset === 0 ? 1 : 0.4,
                    zIndex: offset === 0 ? 10 : 5 - Math.abs(offset),
                  }}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} / ${screenshots.length}`}
                  aria-hidden={offset !== 0}
                >
                  <div
                    className={`bg-card overflow-hidden rounded-xl border transition-all duration-300 ${
                      offset === 0
                        ? 'border-main/50 shadow-lg'
                        : 'border-border shadow-sm'
                    }`}
                  >
                    {/* macOS Window Title Bar */}
                    <div className="border-border bg-secondary-background flex items-center gap-2 border-b px-3 py-1.5 sm:px-4 sm:py-2">
                      <div className="flex gap-1.5 sm:gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#ff5f56] sm:h-2.5 sm:w-2.5" />
                        <span className="h-2 w-2 rounded-full bg-[#ffbd2e] sm:h-2.5 sm:w-2.5" />
                        <span className="h-2 w-2 rounded-full bg-[#27ca40] sm:h-2.5 sm:w-2.5" />
                      </div>
                      <span className="text-muted-foreground flex-1 text-center text-[10px] font-medium sm:text-xs">
                        Quarry
                      </span>
                      <div className="w-8 sm:w-12" />
                    </div>
                    <img
                      src={shot.src}
                      alt={shot.alt}
                      loading="lazy"
                      className="block w-full max-w-[1000px]"
                    />
                  </div>
                  <p
                    className={`text-muted-foreground absolute right-0 -bottom-10 left-0 text-center text-sm font-medium transition-all duration-300 sm:-bottom-12 sm:text-base ${
                      offset === 0
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-3 opacity-0'
                    }`}
                  >
                    {shot.caption}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Next button — visible on all screen sizes */}
          <button
            className="bg-background border-border text-muted-foreground hover:bg-main hover:text-main-foreground absolute right-0 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-all duration-150 hover:shadow-md active:scale-95 sm:h-11 sm:w-11"
            onClick={goNext}
            aria-label={t('screenshots.next')}
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Autoplay progress bar */}
        <div className="mx-auto mt-4 max-w-[200px] sm:mt-6">
          <div className="carousel-progress">
            <div
              key={current}
              className="carousel-progress-bar"
              data-paused={!isAutoPlaying}
            />
          </div>
        </div>

        {/* Dot indicators — increased touch targets with padding */}
        <div
          className="mt-6 flex justify-center gap-2 sm:mt-10 sm:gap-3"
          role="tablist"
          aria-label={t('screenshots.title')}
        >
          {screenshots.map((_, index) => (
            <button
              key={screenshotKeys[index]}
              className={`cursor-pointer rounded-full border-none p-1.5 transition-all duration-150 ${
                index === current ? 'bg-main/20' : 'bg-transparent'
              }`}
              onClick={() => goTo(index)}
              role="tab"
              aria-selected={index === current}
              aria-label={t('screenshots.goTo', { number: index + 1 })}
              type="button"
            >
              <span
                className={`border-border block rounded-full border transition-all duration-150 ${
                  index === current
                    ? 'bg-main h-2.5 w-8'
                    : 'bg-secondary-background hover:bg-muted-foreground h-2.5 w-2.5'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
