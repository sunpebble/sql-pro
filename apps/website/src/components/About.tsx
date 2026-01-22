import './About.css';

export default function About() {
  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <div className="container">
        <div className="about-container">
          {/* Left Column - Content */}
          <div className="about-content">
            <span className="about-label">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              About Us
            </span>

            <h2 id="about-title" className="about-title">
              Database companion,
              <br />
              offering power and
              <br />
              precision in your work.
            </h2>

            <p className="about-description">
              SQL Pro was born to bridge the gap between complex database
              operations and simple, confident workflows. We're a team of
              developers who understand the frustration of juggling multiple
              database clients.
            </p>

            <div className="about-stats">
              <div className="about-stat">
                <span className="about-stat-value">
                  325<sup>+</sup>
                </span>
                <span className="about-stat-label">Trusted Users</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-value">
                  125<sup>+</sup>
                </span>
                <span className="about-stat-label">Database Engines</span>
              </div>
            </div>
          </div>

          {/* Right Column - Feature Cards */}
          <div className="about-cards">
            <div className="about-card">
              <div className="about-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="about-card-content">
                <h3 className="about-card-title">Full Confidence</h3>
                <p className="about-card-description">
                  Comprehensive AI guidance, expert-level insights and complete
                  query monitoring.
                </p>
              </div>
            </div>

            <div className="about-card">
              <div className="about-card-icon">
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
              </div>
              <div className="about-card-content">
                <h3 className="about-card-title">Human-Centric</h3>
                <p className="about-card-description">
                  Database management should focus on people and empathy, not
                  just numbers.
                </p>
              </div>
            </div>

            <div className="about-card">
              <div className="about-card-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <div className="about-card-content">
                <h3 className="about-card-title">The Mission</h3>
                <p className="about-card-description">
                  To offer steadfast assistance, remarkable accuracy, and a deep
                  sense of calmness in your everyday routine.
                </p>
              </div>
            </div>
          </div>

          {/* Floating Badge */}
          <div className="about-float-badge">
            <div className="about-float-badge-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div className="about-float-badge-content">
              <span className="about-float-badge-title">AI-Powered</span>
              <span className="about-float-badge-subtitle">
                Smart assistance built-in
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
