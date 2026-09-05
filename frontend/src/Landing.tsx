import './landing.css'
import { QuickActions } from './components/QuickActions'

export function Landing({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="hero">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />

      <header className="hero-nav">
        <div className="brand">
          <span className="brand-mark" />
          <p className="brand-name">Vault AI</p>
        </div>

        <span className="offline-pill">100% local</span>
      </header>

      <main className="hero-main">
        <div className="hero-copy">
          <p className="hero-kicker">PRIVATE DOCUMENT INTELLIGENCE</p>

          <h1>Welcome to Vault AI</h1>

          <p>
            Ask your PDFs, slides, and notes. Answers are drawn only from those
            files, cited to the page, and they never leave this machine.
          </p>

          <button type="button" className="hero-cta" onClick={onOpen}>
            Open the vault
          </button>
        </div>

        <QuickActions onOpen={onOpen} />
      </main>

      <div className="hero-stage" aria-hidden="true">
        <svg className="ribbon" viewBox="0 0 720 900" fill="none">
          <defs>
            <linearGradient
              id="ribbon-fill"
              x1="80"
              y1="40"
              x2="640"
              y2="860"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.38" stopColor="#f3f2ee" />
              <stop offset="0.5" stopColor="#cfcbc3" />
              <stop offset="0.62" stopColor="#f7f6f3" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>

            <filter
              id="ribbon-shadow"
              x="-20%"
              y="-10%"
              width="140%"
              height="130%"
            >
              <feDropShadow
                dx="18"
                dy="36"
                stdDeviation="22"
                floodColor="#1b365d"
                floodOpacity="0.14"
              />
            </filter>
          </defs>

          <path
            d="M 520 -40 C 620 120 180 170 260 340 S 680 470 420 620 S 120 760 310 980"
            stroke="url(#ribbon-fill)"
            strokeWidth="92"
            strokeLinecap="round"
            filter="url(#ribbon-shadow)"
          />

          <path
            d="M 508 -20 C 600 130 208 182 278 338 S 652 468 432 612 S 160 750 322 960"
            stroke="#ffffff"
            strokeWidth="18"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>

        <span className="seal">
          <span className="seal-hole" />
        </span>
      </div>
    </div>
  )
}