import { Shield, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="privacy-notice">
        <Shield size={18} />
        <span>
          Всі дані обробляються локально у вашому браузері. Ми не зберігаємо та не надсилаємо ваші дані.
        </span>
      </div>
      <div className="footer-links">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
        >
          <Github size={18} />
          <span>Код на GitHub</span>
        </a>
      </div>
    </footer>
  );
}
