import { useTranslation } from 'react-i18next';
import { useInView } from '../hooks/useInView';

interface Testimonial {
  key: string;
  avatar: string;
  name: string;
  role: string;
  company: string;
}

const testimonials: Testimonial[] = [
  {
    key: 'developer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    name: 'John Chen',
    role: 'Senior Developer',
    company: 'TechCorp',
  },
  {
    key: 'datascientist',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    name: 'Sarah Miller',
    role: 'Data Scientist',
    company: 'DataLabs',
  },
  {
    key: 'indie',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    name: 'Mike Johnson',
    role: 'Indie Developer',
    company: 'Solo Studio',
  },
];

export default function Testimonials() {
  const { t } = useTranslation();
  const { ref: headerRef, isInView: headerVisible } = useInView<HTMLElement>();

  return (
    <section
      className="bg-secondary-background relative overflow-hidden py-24 md:py-32"
      id="testimonials"
      aria-labelledby="testimonials-title"
    >
      <div className="mx-auto max-w-[1280px] px-5 md:px-12">
        <header
          ref={headerRef}
          className={`mb-16 text-center transition-all duration-500 ${
            headerVisible
              ? 'translate-y-0 opacity-100'
              : 'translate-y-8 opacity-0'
          }`}
        >
          <span className="bg-main text-main-foreground border-border rounded-base mb-5 inline-flex items-center gap-2 border px-4 py-2 text-sm font-semibold tracking-wide uppercase shadow-sm">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {t('testimonials.label')}
          </span>
          <h2
            id="testimonials-title"
            className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            {t('testimonials.title')}{' '}
            <span className="text-main">
              {t('testimonials.titleHighlight')}
            </span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-[600px] text-lg leading-relaxed">
            {t('testimonials.subtitle')}
          </p>
        </header>

        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.key}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  const { t } = useTranslation();
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`group bg-card border-border rounded-base border p-6 transition-all duration-300 ${
        isInView
          ? 'card-neo-lift translate-y-0 opacity-100 shadow-sm'
          : 'translate-y-8 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <svg
        className={`text-main mb-4 h-8 w-8 ${isInView ? 'animate-scale-bounce' : 'opacity-0'}`}
        style={
          isInView ? { animationDelay: `${index * 100 + 200}ms` } : undefined
        }
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>
      <p className="text-foreground mb-6 text-base leading-relaxed">
        {t(`testimonials.quotes.${testimonial.key}`)}
      </p>
      <div className="border-border flex items-center gap-3 border-t pt-4">
        <img
          src={testimonial.avatar}
          alt=""
          className="rounded-base border-border group-hover:ring-main h-12 w-12 border transition-all duration-300 group-hover:ring-2 group-hover:ring-offset-2"
          loading="lazy"
        />
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-semibold">
            {testimonial.name}
          </span>
          <span className="text-muted-foreground text-xs">
            {testimonial.role}, {testimonial.company}
          </span>
        </div>
      </div>
    </div>
  );
}
