import type { ReactNode } from 'react';

/* ── tiny helpers (server components, zero JS) ── */

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-300 backdrop-blur-sm animate-pulse-slow">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
      </span>
      {children}
    </span>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  delay: string;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-card/60 p-8 backdrop-blur-xl transition-all duration-500 hover:border-brand-500/30 hover:bg-surface-elevated/60 hover:shadow-[0_0_40px_-12px_rgba(92,124,250,0.3)] hover:-translate-y-1"
      style={{ animationDelay: delay }}
    >
      {/* Glassmorphism shine effect */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500/10 via-transparent to-transparent" />
      </div>

      <div className="relative z-10">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-500/10 text-3xl ring-1 ring-brand-500/20 transition-transform duration-500 group-hover:scale-110 group-hover:ring-brand-500/40">
          {icon}
        </div>
        <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-gray-400">{description}</p>
      </div>
    </div>
  );
}

/* ── main page ── */

export default function HomePage() {
  const features: Omit<FeatureCardProps, 'delay'>[] = [
    {
      icon: '♟',
      title: 'Шашки',
      description:
        'Классические русские шашки с рейтинговой системой ELO. Матчмейкинг за секунды, честные поединки.',
    },
    {
      icon: '⚖️',
      title: 'Честная игра',
      description:
        'Криптографически верифицируемый генератор случайности. Каждый ход записан и доказуем.',
    },
    {
      icon: '⚡',
      title: 'Мгновенные выплаты',
      description:
        'Выигрыш зачисляется на баланс мгновенно. Вывод на карту или крипто — без задержек.',
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* ── ambient background glow ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Primary orb */}
        <div className="absolute -top-[40%] left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-brand-700/20 blur-[128px] animate-drift" />
        {/* Secondary orb */}
        <div className="absolute -bottom-[20%] right-[10%] h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-[100px] animate-drift-reverse" />
        {/* Accent orb */}
        <div className="absolute top-[30%] -left-[10%] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px] animate-drift-slow" />
      </div>

      {/* ── noise texture overlay ── */}
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMDAnIGhlaWdodD0nMjAwJz48ZmlsdGVyIGlkPSduJz48ZmVUdXJidWxlbmNlIHR5cGU9J2ZyYWN0YWxOb2lzZScgYmFzZUZyZXF1ZW5jeT0nMC44JyBudW1PY3RhdmVzPSc0JyBzdGl0Y2hUaWxlcz0nc3RpdGNoJy8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgZmlsdGVyPSd1cmwoI24pJyBvcGFjaXR5PScwLjAzJy8+PC9zdmc+')] opacity-50" />

      {/* ── header bar ── */}
      <header className="relative z-20 border-b border-white/[0.04] bg-surface-dark/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-extrabold text-white shadow-lg shadow-brand-500/25">
              R
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              RMG<span className="text-brand-400">.gg</span>
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-400 md:flex">
            <span className="cursor-default transition-colors hover:text-white">Игры</span>
            <span className="cursor-default transition-colors hover:text-white">Рейтинг</span>
            <span className="cursor-default transition-colors hover:text-white">FAQ</span>
          </nav>
          <button
            type="button"
            className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-5 py-2 text-sm font-semibold text-brand-300 transition-all duration-300 hover:bg-brand-500/20 hover:text-white hover:shadow-lg hover:shadow-brand-500/10"
          >
            Войти
          </button>
        </div>
      </header>

      {/* ── hero ── */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center md:py-32 lg:py-40">
        <div className="animate-fade-in-up">
          <Badge>Скоро</Badge>
        </div>

        <h1 className="mt-8 animate-fade-in-up text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl [animation-delay:150ms]">
          <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Skill-Based{' '}
          </span>
          <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-brand-600 bg-clip-text text-transparent">
            Duels
          </span>
        </h1>

        <p className="mt-6 max-w-lg animate-fade-in-up text-lg text-gray-400 sm:text-xl [animation-delay:300ms]">
          Играй 1 на 1. Доказывай мастерство. Побеждай.
        </p>

        {/* CTA area */}
        <div className="mt-10 flex animate-fade-in-up flex-col items-center gap-4 sm:flex-row [animation-delay:450ms]">
          <button
            type="button"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-600/25 transition-all duration-300 hover:shadow-brand-500/40 hover:brightness-110"
          >
            <span>Начать играть</span>
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            {/* Glow ring */}
            <span className="absolute -inset-0.5 -z-10 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 opacity-40 blur-lg transition-opacity duration-500 group-hover:opacity-70" />
          </button>

          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/[0.03] px-8 py-3.5 text-sm font-semibold text-gray-300 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            Узнать больше
          </button>
        </div>

        {/* ── features grid ── */}
        <section className="mt-28 w-full max-w-4xl animate-fade-in-up [animation-delay:600ms]">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={`${700 + i * 120}ms`} />
            ))}
          </div>
        </section>

        {/* ── bottom trust line ── */}
        <p className="mt-20 animate-fade-in-up text-xs font-medium uppercase tracking-widest text-gray-600 [animation-delay:1100ms]">
          Provably fair · ELO rated · Instant payouts
        </p>
      </main>

      {/* ── footer ── */}
      <footer className="relative z-20 border-t border-white/[0.04] py-8">
        <p className="text-center text-xs text-gray-600">
          © {new Date().getFullYear()} RMG Platform. Все права защищены.
        </p>
      </footer>

      {/* ── keyframe animations (CSS-only) ── */}
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(30px); }
        }
        @keyframes drift-reverse {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(-15px); }
        }
        @keyframes drift-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(20px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: .75; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .animate-drift {
          animation: drift 8s ease-in-out infinite;
        }
        .animate-drift-reverse {
          animation: drift-reverse 10s ease-in-out infinite;
        }
        .animate-drift-slow {
          animation: drift-slow 12s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
