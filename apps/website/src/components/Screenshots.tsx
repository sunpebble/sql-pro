import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Screenshots.css';

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

  return (
    <section
      className="screenshots"
      id="screenshots"
      aria-labelledby="screenshots-title"
    >
      <div className="container">
        <header className="screenshots-header">
          <h2 id="screenshots-title" className="screenshots-title">
            <span className="gradient-text">{t('screenshots.title')}</span>
          </h2>
          <p className="screenshots-subtitle">{t('screenshots.subtitle')}</p>
        </header>

        <div
          className="carousel"
          role="region"
          aria-roledescription="carousel"
          aria-label={t('screenshots.title')}
        >
          <button
            className="carousel-btn carousel-prev"
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

          <div className="carousel-track" aria-live="polite">
            {screenshots.map((shot, index) => {
              const offset = index - current;
              return (
                <div
                  key={screenshotKeys[index]}
                  className={`carousel-slide ${offset === 0 ? 'active' : ''}`}
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
                  <div className="screenshot-frame">
                    <div className="screenshot-header" aria-hidden="true">
                      <div className="screenshot-dots">
                        <span className="dot red" />
                        <span className="dot yellow" />
                        <span className="dot green" />
                      </div>
                      <span className="screenshot-title">SQL Pro</span>
                    </div>
                    <img src={shot.src} alt={shot.alt} loading="lazy" />
                  </div>
                  <p className="screenshot-caption">{shot.caption}</p>
                </div>
              );
            })}
          </div>

          <button
            className="carousel-btn carousel-next"
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

        <div
          className="carousel-dots"
          role="tablist"
          aria-label={t('screenshots.title')}
        >
          {screenshots.map((_, index) => (
            <button
              key={screenshotKeys[index]}
              className={`carousel-dot ${index === current ? 'active' : ''}`}
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
