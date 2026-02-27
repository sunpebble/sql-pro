import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const screenshotKeys = ['welcome', 'database', 'table', 'query'] as const;

export default function Screenshots() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const screenshots = screenshotKeys.map((key) => ({
    src: `/screenshots/${key}-dark.png`,
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

  const goTo = (index: number) => {
    setCurrent(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goPrev = () =>
    goTo((current - 1 + screenshots.length) % screenshots.length);
  const goNext = () => goTo((current + 1) % screenshots.length);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
  };

  return (
    <section
      className="bg-secondary-background relative overflow-hidden py-24 md:py-32"
      id="screenshots"
      aria-labelledby="screenshots-title"
    >
      {/* Top decoration bar */}
      <div className="bg-main absolute top-0 left-1/2 h-1 w-30 -translate-x-1/2 rounded-full" />

      <div className="mx-auto max-w-[1280px] px-5 md:px-12">
        <header className="mb-16 text-center">
          <h2
            id="screenshots-title"
            className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            <span className="text-main">{t('screenshots.title')}</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-[500px] text-lg leading-relaxed">
            {t('screenshots.subtitle')}
          </p>
        </header>

        <div
          className="relative flex items-center justify-center gap-8 px-4 md:px-16"
          role="region"
          aria-roledescription="carousel"
          aria-label={t('screenshots.title')}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <button
            className="bg-background border-border rounded-base text-muted-foreground hover:bg-main hover:text-main-foreground absolute left-0 z-20 hidden h-12 w-12 cursor-pointer items-center justify-center border shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:shadow-none md:flex"
            onClick={goPrev}
            aria-label={t('screenshots.prev')}
            type="button"
          >
            <svg
              width="24"
              height="24"
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
            className="relative mb-16 aspect-video w-full max-w-[1000px]"
            aria-live="polite"
          >
            {screenshots.map((shot, index) => {
              const offset = index - current;
              return (
                <div
                  key={screenshotKeys[index]}
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
                    className={`bg-background rounded-base relative overflow-hidden border transition-all duration-300 ${
                      offset === 0
                        ? 'border-main shadow-lg'
                        : 'border-border shadow-sm'
                    }`}
                  >
                    <img
                      src={shot.src}
                      alt={shot.alt}
                      loading="lazy"
                      className="block w-full max-w-[1000px]"
                    />
                  </div>
                  <p
                    className={`text-muted-foreground absolute right-0 -bottom-12 left-0 text-center text-base font-medium transition-all duration-300 ${
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

          <button
            className="bg-background border-border rounded-base text-muted-foreground hover:bg-main hover:text-main-foreground absolute right-0 z-20 hidden h-12 w-12 cursor-pointer items-center justify-center border shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:shadow-none md:flex"
            onClick={goNext}
            aria-label={t('screenshots.next')}
            type="button"
          >
            <svg
              width="24"
              height="24"
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
        <div className="mx-auto mt-6 max-w-[200px]">
          <div className="carousel-progress">
            <div
              key={current}
              className="carousel-progress-bar"
              data-paused={!isAutoPlaying}
            />
          </div>
        </div>

        <div
          className="mt-10 flex justify-center gap-3"
          role="tablist"
          aria-label={t('screenshots.title')}
        >
          {screenshots.map((_, index) => (
            <button
              key={screenshotKeys[index]}
              className={`border-border h-2.5 cursor-pointer rounded-full border transition-all duration-150 ${
                index === current
                  ? 'bg-main w-8'
                  : 'bg-secondary-background hover:bg-muted-foreground w-2.5'
              }`}
              onClick={() => goTo(index)}
              role="tab"
              aria-selected={index === current}
              aria-label={t('screenshots.goTo', { number: index + 1 })}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
