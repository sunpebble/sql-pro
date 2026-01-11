import { useEffect, useState } from 'react';
import './Screenshots.css';

const screenshots = [
  {
    src: '/screenshots/welcome-dark.png',
    alt: '欢迎界面',
    caption: '简洁优雅的欢迎界面',
  },
  {
    src: '/screenshots/database-dark.png',
    alt: '数据库视图',
    caption: '强大的数据库浏览器',
  },
  {
    src: '/screenshots/table-dark.png',
    alt: '表格视图',
    caption: '高性能数据表格',
  },
  {
    src: '/screenshots/query-dark.png',
    alt: '查询编辑器',
    caption: 'Monaco SQL 编辑器',
  },
];

export default function Screenshots() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % screenshots.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const goTo = (index: number) => {
    setCurrent(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goPrev = () =>
    goTo((current - 1 + screenshots.length) % screenshots.length);
  const goNext = () => goTo((current + 1) % screenshots.length);

  return (
    <section className="screenshots" id="screenshots">
      <div className="container">
        <div className="screenshots-header">
          <h2 className="screenshots-title">
            <span className="gradient-text">界面预览</span>
          </h2>
          <p className="screenshots-subtitle">现代化设计，专业体验</p>
        </div>

        <div className="carousel">
          <button
            className="carousel-btn carousel-prev"
            onClick={goPrev}
            aria-label="上一张"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="carousel-track">
            {screenshots.map((shot, index) => {
              const offset = index - current;
              return (
                <div
                  key={index}
                  className={`carousel-slide ${offset === 0 ? 'active' : ''}`}
                  style={{
                    transform: `translateX(${offset * 100}%) scale(${offset === 0 ? 1 : 0.85})`,
                    opacity: Math.abs(offset) > 1 ? 0 : offset === 0 ? 1 : 0.4,
                    zIndex: offset === 0 ? 10 : 5 - Math.abs(offset),
                  }}
                >
                  <div className="screenshot-frame">
                    <div className="screenshot-header">
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
            aria-label="下一张"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="carousel-dots">
          {screenshots.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === current ? 'active' : ''}`}
              onClick={() => goTo(index)}
              aria-label={`跳转到第 ${index + 1} 张`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
