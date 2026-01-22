import './Testimonials.css';

const testimonials = [
  {
    id: 1,
    quote: 'SQL Pro has transformed our database workflow.',
    highlight: 'Their expertise has been invaluable.',
    author: 'Sarah Chen',
    role: 'Senior Developer, TechCorp',
    initials: 'SC',
    featured: true,
    rating: 5,
  },
  {
    id: 2,
    quote:
      'The AI-powered suggestions save us hours every week. Highly recommend for any development team.',
    author: 'Michael Park',
    role: 'CTO, StartupXYZ',
    initials: 'MP',
    featured: false,
    rating: 5,
  },
  {
    id: 3,
    quote:
      'Finally, a database tool that understands what developers actually need.',
    author: 'Emily Rodriguez',
    role: 'Lead Engineer, DataFlow',
    initials: 'ER',
    featured: false,
    rating: 5,
  },
];

const stats = [
  { value: '100', suffix: '%', label: 'Customer Satisfaction' },
  { value: '92.7', suffix: '%', label: 'Retention Rate' },
  { value: '700', suffix: '+', label: 'Client Supported' },
  { value: '24/7', suffix: '', label: 'Support Available' },
];

export default function Testimonials() {
  return (
    <section
      className="testimonials"
      id="testimonials"
      aria-labelledby="testimonials-title"
    >
      <div className="container">
        <div className="testimonials-container">
          {/* Left Column - Content & Stats */}
          <div className="testimonials-content">
            <span className="testimonials-label">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Client Testimonials
            </span>

            <h2 id="testimonials-title" className="testimonials-title">
              We're here to connect
              <br />
              clarity and compliance,
              <br />
              so you can breathe easy.
            </h2>

            <p className="testimonials-description">
              Join thousands of developers who trust SQL Pro for their database
              management needs.
            </p>

            <div className="testimonials-stats">
              {stats.map((stat) => (
                <div key={stat.label} className="testimonials-stat">
                  <span className="testimonials-stat-value">
                    {stat.value}
                    {stat.suffix && <sup>{stat.suffix}</sup>}
                  </span>
                  <span className="testimonials-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Testimonial Cards */}
          <div className="testimonials-cards">
            {testimonials.map((testimonial) => (
              <div
                key={`testimonial-${testimonial.id}`}
                className={`testimonial-card ${testimonial.featured ? 'featured' : ''}`}
              >
                <div className="testimonial-rating">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <svg
                      key={`star-${testimonial.id}-${i}`}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>

                <p className="testimonial-quote">
                  "{testimonial.quote}"
                  {testimonial.highlight && (
                    <>
                      {' '}
                      <span className="testimonial-quote-highlight">
                        {testimonial.highlight}
                      </span>
                    </>
                  )}
                </p>

                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {testimonial.initials}
                  </div>
                  <div className="testimonial-author-info">
                    <span className="testimonial-author-name">
                      {testimonial.author}
                    </span>
                    <span className="testimonial-author-role">
                      {testimonial.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
