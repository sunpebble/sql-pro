import { useTranslation } from 'react-i18next';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section
      className="relative flex min-h-screen items-center overflow-hidden py-24 md:py-32"
      aria-labelledby="hero-title"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-center px-5 text-center md:px-12">
        {/* Header Section */}
        <div className="animate-fade-up mb-12 flex max-w-[860px] flex-col items-center gap-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="animate-float bg-main text-main-foreground border-border rounded-base shadow-shadow-sm inline-flex items-center gap-2 border-2 px-4 py-2.5 text-sm font-semibold tracking-wide uppercase">
              <svg
                className="h-4 w-4"
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
            <span className="text-muted-foreground bg-secondary-background border-border rounded-base border-2 px-3 py-1.5 font-mono text-xs">
              MIT License
            </span>
            <span className="text-muted-foreground bg-secondary-background border-border rounded-base border-2 px-3 py-1.5 font-mono text-xs">
              v1.0.0
            </span>
          </div>

          {/* Main Heading - keyword-rich for SEO */}
          <h1
            id="hero-title"
            className="text-foreground m-0 text-4xl leading-tight font-extrabold tracking-tight md:text-5xl lg:text-6xl"
          >
            {t('hero.title')}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground max-w-[680px] text-lg leading-relaxed md:text-xl">
            {t('hero.description')}
          </p>

          {/* Key highlights as inline tags */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              'SQLite & SQLCipher',
              'Monaco Editor',
              'Visual Diff',
              'ER Diagrams',
              'AI-Powered',
            ].map((tag, index) => (
              <span
                key={tag}
                className="animate-slide-up-fade text-foreground bg-secondary-background border-border rounded-base border px-3 py-1 text-xs font-medium"
                style={{ animationDelay: `${0.4 + index * 0.08}s` }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div
          className="animate-fade-up mb-16 flex flex-wrap items-center justify-center gap-4 delay-100"
          role="group"
          aria-label={t('a11y.mainNavigation')}
        >
          <span className="relative">
            <span className="animate-pulse-ring bg-main/30 rounded-base absolute inset-0" />
            <a
              href="#download"
              className="bg-main text-main-foreground border-border rounded-base shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY relative inline-flex items-center gap-2.5 border-2 px-8 py-4 text-base font-semibold no-underline transition-all duration-150 hover:shadow-none"
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
          </span>
          <a
            href="https://github.com/anthropics/sql-pro"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-background text-foreground border-border rounded-base shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY inline-flex items-center gap-2 border-2 px-7 py-4 text-base font-medium no-underline transition-all duration-150 hover:shadow-none"
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

        {/* Product Video */}
        <div className="animate-fade-up relative mx-auto w-full max-w-[1000px] transition-transform delay-200 duration-300 hover:scale-[1.01]">
          <video
            src="/promo.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="border-border rounded-base shadow-shadow-lg h-auto w-full border-2"
            aria-label="SQL Pro product demonstration video showing Monaco SQL editor, inline data editing, ER diagrams, and multi-database management"
          >
            {/* Fallback for browsers that don't support video */}
            <img
              src="/screenshots/query-dark.png"
              alt="SQL Pro — open-source SQLite database manager with Monaco SQL editor, autocomplete, and database sidebar navigation"
            />
          </video>
        </div>
      </div>
    </section>
  );
}
