import { useTranslation } from 'react-i18next';
import { useInView } from '../hooks/useInView';
import './Testimonials.css';

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
      className="testimonials"
      id="testimonials"
      aria-labelledby="testimonials-title"
    >
      <div className="container">
        <header
          ref={headerRef}
          className={`testimonials-header ${headerVisible ? 'visible' : ''}`}
        >
          <span className="testimonials-label">
            <svg
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
          <h2 id="testimonials-title" className="testimonials-title">
            {t('testimonials.title')}{' '}
            <span className="testimonials-title-gradient">
              {t('testimonials.titleHighlight')}
            </span>
          </h2>
          <p className="testimonials-subtitle">{t('testimonials.subtitle')}</p>
        </header>

        <div className="testimonials-grid">
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
      className={`testimonial-card ${isInView ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <svg
        className="testimonial-quote-icon"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
      </svg>
      <p className="testimonial-quote">
        {t(`testimonials.quotes.${testimonial.key}`)}
      </p>
      <div className="testimonial-author">
        <img
          src={testimonial.avatar}
          alt=""
          className="testimonial-avatar"
          loading="lazy"
        />
        <div className="testimonial-author-info">
          <span className="testimonial-author-name">{testimonial.name}</span>
          <span className="testimonial-author-role">
            {testimonial.role}, {testimonial.company}
          </span>
        </div>
      </div>
    </div>
  );
}
