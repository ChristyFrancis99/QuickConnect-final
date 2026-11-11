import { useEffect, useRef, type ReactNode } from "react";
import ContinuitySection from "@/components/ContinuitySection";
import ContinuitySteps from "@/components/sections/ContinuitySteps";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import logo from "@/assets/logo.png";
import PlatformSection from "@/components/PlatformSection";
import HandoverSection from "@/components/HandoverSection";
import ProblemSection from "@/components/ProblemSection";

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      element.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        element.classList.add("is-visible");
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`qc-reveal ${className}`}>{children}</div>;
}

export function HomepageSections() {
  return (
    <>
      <ProblemSection />

      <ContinuitySteps />

      <HandoverSection />

      <PlatformSection />

      <ContinuitySection />

      <section className="qc-cta-section" id="final-cta" aria-labelledby="final-cta-title">
        <div className="qc-cta-orbit qc-cta-orbit--one" aria-hidden="true" />
        <div className="qc-cta-orbit qc-cta-orbit--two" aria-hidden="true" />
        <Reveal className="qc-cta-content">
          <p className="qc-eyebrow">
            <span className="qc-eyebrow-dot" aria-hidden="true" />
            KEEP KNOWLEDGE MOVING
          </p>
          <h2 id="final-cta-title">Don't Let Knowledge Walk Out the Door.</h2>
          <p>Keep your projects moving, your teams informed, and your knowledge connected with QuickConnect.</p>
          <div className="qc-cta-actions">
            <a className="qc-button qc-button--gold" href="#top">Get Started <ArrowRight size={15} strokeWidth={2.4} /></a>
            <a className="qc-button qc-button--outline" href="#platform">Explore Platform <ArrowUpRight size={15} strokeWidth={2} /></a>
          </div>
        </Reveal>
      </section>

      <footer className="qc-footer" id="about">
        <div className="qc-container">
          <div className="qc-footer-main">
            <div className="qc-footer-brand">
              <a href="#top" aria-label="QuickConnect home" className="qc-footer-logo-wrap">
                <img src={logo} alt="QuickConnect" className="qc-footer-logo" />
              </a>
              <p>Keep project knowledge connected, so every team can move forward with context.</p>
            </div>
            <div className="qc-footer-links">
              <div>
                <h3>Platform</h3>
                <a href="#platform">Overview</a>
                <a href="#solution">Capabilities</a>
                <a href="#problem">The Challenge</a>
              </div>
              <div>
                <h3>Explore</h3>
                <a href="#how-it-works">How It Works</a>
                <a href="#use-cases">Use Cases</a>
                <a href="#about">About</a>
              </div>
              <div>
                <h3>Get Started</h3>
                <a href="#final-cta">Log In</a>
                <a href="#final-cta">Get Started <ArrowUpRight size={13} /></a>
              </div>
            </div>
          </div>
          <div className="qc-footer-bottom">
            <span>© {new Date().getFullYear()} QuickConnect. All rights reserved.</span>
            <span>One workspace. Complete context. Seamless transitions.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
