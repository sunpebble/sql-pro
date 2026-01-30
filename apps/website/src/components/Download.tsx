import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../hooks/useInView';
import './Download.css';

type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

const detectPlatform = (): Platform => {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('win')) return 'windows';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
};

const platformIcons: Record<Platform, ReactNode> = {
  mac: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  ),
  windows: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  ),
  linux: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139z" />
    </svg>
  ),
  unknown: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

export default function Download() {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState<Platform>('unknown');
  const { ref: contentRef, isInView } = useInView<HTMLDivElement>();

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const platformName = t(`download.platforms.${platform}`);
  const platformArch = t(`download.arch.${platform}`);

  const otherPlatforms = (['mac', 'windows', 'linux'] as const).filter(
    (p) => p !== platform
  );

  return (
    <section
      className="download"
      id="download"
      aria-labelledby="download-title"
    >
      <div className="container">
        <div
          ref={contentRef}
          className={['download-content', isInView && 'visible']
            .filter(Boolean)
            .join(' ')}
        >
          {/* Title */}
          <h2 id="download-title" className="download-title">
            {t('download.title')}{' '}
            <span className="download-title-gradient">
              {t('download.titleHighlight')}
            </span>
          </h2>

          {/* Main Download Button */}
          <a
            href="https://github.com/kunish-homelab/sql-pro/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="download-main"
            aria-describedby="download-arch"
          >
            {platformIcons[platform]}
            <span className="download-main-text">
              {t('download.downloadFor', { platform: platformName })}
              <small id="download-arch">{platformArch}</small>
            </span>
          </a>

          {/* Other Platforms */}
          <nav
            className="download-other"
            aria-label={t('download.otherPlatforms')}
          >
            <span className="download-other-label">
              {t('download.otherPlatforms')}
            </span>
            {otherPlatforms.map((p) => (
              <a
                key={p}
                href="https://github.com/kunish-homelab/sql-pro/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="download-link"
                title={t(`download.arch.${p}`)}
              >
                {platformIcons[p]}
                {t(`download.platforms.${p}`)}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
