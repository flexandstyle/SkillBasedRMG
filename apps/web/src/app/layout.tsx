import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RMG Platform — Skill-Based Duels',
  description: 'Play 1v1 skill-based games for real stakes. Checkers, chess, backgammon and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-surface-dark">{children}</body>
    </html>
  );
}
