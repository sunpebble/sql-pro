import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/icon.svg" alt="SQL Pro" width="40" height="40" />
            <span>SQL Pro</span>
          </div>

          <nav className="footer-links">
            <a
              href="https://kunish-homelab.github.io/sql-pro/"
              target="_blank"
              rel="noopener noreferrer"
            >
              文档
            </a>
            <a
              href="https://github.com/kunish-homelab/sql-pro"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://github.com/kunish-homelab/sql-pro/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              发布记录
            </a>
            <a
              href="https://github.com/kunish-homelab/sql-pro/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              问题反馈
            </a>
            <a
              href="https://github.com/kunish-homelab/sql-pro/discussions"
              target="_blank"
              rel="noopener noreferrer"
            >
              讨论区
            </a>
          </nav>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} SQL Pro Team. 基于 MIT 协议开源。
          </p>

          <div className="footer-tech">
            <span>技术栈：</span>
            <a
              href="https://www.electronjs.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Electron
            </a>
            <a
              href="https://react.dev/"
              target="_blank"
              rel="noopener noreferrer"
            >
              React
            </a>
            <a
              href="https://www.typescriptlang.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              TypeScript
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
