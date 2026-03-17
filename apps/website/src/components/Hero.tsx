import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { t } = useTranslation();

  const tags = [
    'SQLite & SQLCipher',
    'Monaco Editor',
    'Visual Diff',
    'ER Diagrams',
    'AI-Powered',
  ];

  return (
    <section
      className="relative flex min-h-screen items-center overflow-hidden pt-16 pb-16 md:pb-24 lg:pb-32"
      aria-labelledby="hero-title"
    >
      {/* Background decorations */}
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-50" />
      <div className="bg-main/5 pointer-events-none absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
      <div className="bg-main/3 pointer-events-none absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full blur-[100px]" />

      <div className="relative mx-auto flex max-w-[1280px] flex-col items-center px-4 text-center sm:px-5 md:px-12">
        {/* Header Section */}
        <div className="animate-fade-up mb-8 flex max-w-[860px] flex-col items-center gap-5 sm:mb-12 sm:gap-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="bg-main/10 text-main border-main/20 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:gap-2 sm:px-4 sm:py-1.5 sm:text-sm">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Open Source
            </span>
            <span className="text-muted-foreground bg-secondary-background border-border hidden rounded-full border px-3 py-1.5 font-mono text-xs sm:inline-flex">
              MIT License
            </span>
            <span className="text-muted-foreground bg-secondary-background border-border hidden rounded-full border px-3 py-1.5 font-mono text-xs sm:inline-flex">
              v1.0.0
            </span>
          </div>

          {/* Main Heading */}
          <h1
            id="hero-title"
            className="text-foreground m-0 text-3xl leading-[1.1] font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
          >
            {t('hero.title')}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground max-w-[680px] text-base leading-relaxed sm:text-lg md:text-xl">
            {t('hero.description')}
          </p>

          {/* Feature tags */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {tags.map((tag, index) => (
              <span
                key={tag}
                className="animate-fade-up text-foreground/80 bg-secondary-background border-border rounded-full border px-3.5 py-1 text-xs font-medium"
                style={{ animationDelay: `${0.4 + index * 0.08}s` }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div
          className="animate-fade-up mb-10 flex flex-wrap items-center justify-center gap-3 delay-100 sm:mb-16 sm:gap-4"
          role="group"
          aria-label={t('a11y.mainNavigation')}
        >
          <a
            href="#download"
            className="bg-main text-main-foreground rounded-base relative inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold no-underline shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-95 sm:gap-2.5 sm:px-8 sm:py-3.5 sm:text-base"
          >
            <svg
              className="h-5 w-5"
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
            {t('hero.download')}
          </a>
          <a
            href="https://github.com/kunish-homelab/sql-pro"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-background text-foreground border-border rounded-base inline-flex items-center gap-2 border px-5 py-3 text-sm font-medium no-underline shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-95 sm:px-7 sm:py-3.5 sm:text-base"
            aria-label={t('a11y.socialLink', { name: 'GitHub' })}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            {t('hero.github')}
          </a>
        </div>

        {/* Product Video with Window Chrome */}
        <div className="animate-fade-up relative mx-auto w-full max-w-[1000px] delay-200">
          <div className="border-border overflow-hidden rounded-xl border shadow-2xl transition-transform duration-300 hover:scale-[1.005]">
            {/* macOS Window Title Bar */}
            <div className="border-border bg-secondary-background flex items-center gap-2 border-b px-4 py-2.5">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#27ca40]" />
              </div>
              <span className="text-muted-foreground flex-1 text-center text-xs font-medium">
                SQL Pro
              </span>
              <div className="w-14" /> {/* Spacer for centering */}
            </div>
            <video
              src="/promo.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="block h-auto w-full"
              aria-label="SQL Pro product demonstration video showing Monaco SQL editor, inline data editing, ER diagrams, and multi-database management"
            >
              <img
                src="/screenshots/query-dark.png"
                alt="SQL Pro — open-source SQLite database manager with Monaco SQL editor, autocomplete, and database sidebar navigation"
              />
            </video>
          </div>
          {/* Glow effect behind video */}
          <div className="bg-main/10 pointer-events-none absolute inset-0 -z-10 translate-y-4 rounded-xl blur-3xl" />
        </div>
      </div>
    </section>
  );
}
