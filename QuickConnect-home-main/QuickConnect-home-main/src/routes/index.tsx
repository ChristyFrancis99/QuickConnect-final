import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { GlobeGallery } from "@/game/globe/GlobeGallery";
import { HomepageSections } from "@/components/homepage-sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuickConnect — Knowledge that moves with you" },
      { name: "description", content: "Capture scattered information, connect project context and make every handover seamless with QuickConnect." },
      { property: "og:title", content: "QuickConnect — Knowledge that moves with you" },
      { property: "og:description", content: "One workspace. Complete context. Seamless transitions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400..800&display=swap" },
    ],
  }),
  ssr: false,
  component: Index,
});

function Index() {
  const [isScrolled, setIsScrolled] = useState(() => typeof window !== "undefined" && window.scrollY > 24);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const heroStageRef = useRef<HTMLMainElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > 24;
    setIsScrolled((current) => (current === next ? current : next));
  });

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header className={`hero-header${isScrolled ? " is-scrolled" : ""}`}>
        <div className="hero-header__inner">
          <a className="brand-lockup" href="#top" aria-label="QuickConnect home" onClick={closeMenu}>
            <img className="brand-logo" src={logo} alt="QuickConnect" />
          </a>

          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#platform">Platform</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#use-cases">Use Cases</a>
            <a href="#about">About</a>
          </nav>

          <div className="header-actions">
            <a className="header-login" href="#final-cta">Log In</a>
            <a className="header-cta" href="#final-cta">Get Started <ArrowRight size={14} /></a>
          </div>

          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
            <a href="#platform" onClick={closeMenu}>Platform</a>
            <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
            <a href="#use-cases" onClick={closeMenu}>Use Cases</a>
            <a href="#about" onClick={closeMenu}>About</a>
            <div className="mobile-nav__actions">
              <a href="#final-cta" onClick={closeMenu}>Log In</a>
              <a className="header-cta" href="#final-cta" onClick={closeMenu}>Get Started <ArrowRight size={14} /></a>
            </div>
          </nav>
        )}
      </header>

      <main ref={heroStageRef} className="hero-scroll-stage">
        <section className="hero-sticky" aria-labelledby="hero-title">
          <div className="hero-main" id="top">
            <div className="hero-copy">
              <p className="hero-eyebrow">
                <span className="hero-eyebrow__dot" aria-hidden="true" />
                THE KNOWLEDGE HANDOVER PLATFORM
              </p>
              <h1 className="hero-title" id="hero-title">
                <span className="hero-title__line">Don't Let Valuable</span>
                <span className="hero-title__accent">Knowledge Walk Away.</span>
              </h1>
              <p className="hero-description">
                When people leave, projects shouldn't lose their knowledge. QuickConnect captures scattered information, connects project context and makes every handover seamless.
              </p>
              <div className="hero-actions">
                <a className="hero-button hero-button--primary" href="#platform">
                  Explore QuickConnect <ArrowRight size={15} strokeWidth={2.4} />
                </a>
                <a className="hero-button hero-button--secondary" href="#how-it-works">
                  See How It Works <ArrowDown size={14} strokeWidth={2.2} />
                </a>
              </div>
              <p className="hero-support"><span className="hero-support__line" />One workspace. Complete context. Seamless transitions.</p>
            </div>
            <div className="hero-visual" aria-hidden="false">
              <GlobeGallery scrollTarget={heroStageRef} />
            </div>
          </div>
          <div className="hero-footer" aria-hidden="true">
            <div className="scroll-hint">
              <span className="scroll-hint__mouse">
                <span className="scroll-hint__wheel" />
              </span>
              <span>Scroll to explore</span>
            </div>
            <span className="hero-footer__badge">QuickConnect Continuity</span>
          </div>
        </section>
      </main>
      <HomepageSections />
    </>
  );
}
