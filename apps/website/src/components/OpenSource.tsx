import { useTranslation } from 'react-i18next';
import { useInView } from '../hooks/useInView';

export default function OpenSource() {
  const { t } = useTranslation();
  const { ref: contentRef, isInView } = useInView<HTMLDivElement>();

  return (
    <section
      className="relative overflow-hidden py-16 md:py-24 lg:py-32"
      id="opensource"
      aria-labelledby="opensource-title"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-5 md:px-12">
        <div
          ref={contentRef}
          className={`grid grid-cols-1 items-center gap-8 transition-all duration-500 ease-out sm:gap-12 md:grid-cols-2 md:gap-16 ${
            isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {/* Info Section */}
          <div className="flex flex-col items-center gap-4 text-center sm:gap-5 md:items-start md:text-left">
            <span className="bg-main/10 text-main border-main/20 inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide uppercase">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {t('opensource.label')}
            </span>

            <h2
              id="opensource-title"
              className="text-3xl leading-tight font-bold md:text-4xl lg:text-5xl"
            >
              {t('opensource.title')}{' '}
              <span className="text-main">
                {t('opensource.titleHighlight')}
              </span>
            </h2>

            <p className="text-muted-foreground max-w-lg text-lg leading-relaxed">
              {t('opensource.description')}
            </p>

            {/* Features */}
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:gap-3 md:justify-start">
              <div className="border-border bg-card hover:bg-secondary-background flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  className={`text-main h-4 w-4 ${isInView ? 'animate-icon-bounce' : ''}`}
                  style={isInView ? { animationDelay: '0ms' } : undefined}
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>{t('opensource.features.secure')}</span>
              </div>
              <div className="border-border bg-card hover:bg-secondary-background flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  className={`text-main h-4 w-4 ${isInView ? 'animate-icon-bounce' : ''}`}
                  style={isInView ? { animationDelay: '100ms' } : undefined}
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>{t('opensource.features.community')}</span>
              </div>
              <div className="border-border bg-card hover:bg-secondary-background flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  className={`text-main h-4 w-4 ${isInView ? 'animate-icon-bounce' : ''}`}
                  style={isInView ? { animationDelay: '200ms' } : undefined}
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                <span>{t('opensource.features.extensible')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <a
                href="https://github.com/anthropics/sql-pro"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-main text-main-foreground rounded-base inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-base font-semibold shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="h-5 w-5"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                {t('opensource.viewOnGithub')}
              </a>
              <a
                href="https://github.com/anthropics/sql-pro/stargazers"
                target="_blank"
                rel="noopener noreferrer"
                className="border-border bg-background rounded-base inline-flex items-center justify-center gap-2.5 border px-6 py-3.5 text-base font-semibold shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  className="h-5 w-5"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {t('opensource.starOnGithub')}
              </a>
            </div>
          </div>

          {/* Visual - Terminal */}
          <div className="flex justify-center">
            <div className="border-border bg-card w-full max-w-lg overflow-hidden rounded-xl border shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
              {/* Terminal Header */}
              <div className="border-border bg-secondary-background flex items-center gap-2 border-b px-4 py-3">
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#27ca40]" />
                </div>
                <span className="text-muted-foreground ml-2 text-xs font-medium">
                  Terminal
                </span>
              </div>
              {/* Terminal Content */}
              <div className="space-y-2.5 overflow-x-auto p-4 font-mono text-xs sm:p-5 sm:text-sm">
                <div className="flex gap-2 whitespace-nowrap">
                  <span className="text-main">$</span>
                  <span>
                    git clone https://github.com/anthropics/sql-pro.git
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Cloning into 'sql-pro'...
                </div>
                <div className="flex gap-2">
                  <span className="text-main">$</span>
                  <span>cd sql-pro && pnpm install</span>
                </div>
                <div className="text-muted-foreground">
                  Packages: +1234 Done in 12.5s
                </div>
                <div className="flex gap-2">
                  <span className="text-main">$</span>
                  <span>pnpm dev:electron</span>
                </div>
                <div className="terminal-cursor font-semibold text-[#22c55e]">
                  SQL Pro is ready!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
