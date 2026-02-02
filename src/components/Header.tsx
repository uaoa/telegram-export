import { Send } from 'lucide-react';

export function Header() {
  return (
    <header className="header">
      <div className="logo">
        <Send size={32} />
        <h1>Telegram Export</h1>
      </div>
      <p className="tagline">
        Експортуйте ваші чати в HTML або JSON за лічені секунди
      </p>
    </header>
  );
}
