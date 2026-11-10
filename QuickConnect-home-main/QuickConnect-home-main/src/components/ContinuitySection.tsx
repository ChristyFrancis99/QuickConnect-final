import { type CSSProperties, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type ContinuityCard = {
  index: string;
  title: string;
  description: string;
  icon: "offboarding" | "roles" | "ownership" | "onboarding";
};

type ContinuitySectionProps = {
  onViewClick?: ((card: ContinuityCard) => void) | undefined;
};

const continuityCards: ContinuityCard[] = [
  {
    index: "01",
    title: "Employee Offboarding",
    description: "Preserve valuable knowledge when employees leave the organization.",
    icon: "offboarding",
  },
  {
    index: "02",
    title: "Role Transitions",
    description: "Make it easier for employees to transfer responsibilities when changing roles.",
    icon: "roles",
  },
  {
    index: "03",
    title: "Project Ownership Changes",
    description: "Keep projects moving when ownership shifts between team members.",
    icon: "ownership",
  },
  {
    index: "04",
    title: "Team Onboarding",
    description: "Help new team members understand existing projects, decisions, and workflows faster.",
    icon: "onboarding",
  },
];

const cardTints: Record<ContinuityCard["icon"], string> = {
  offboarding: "var(--qc-lavender-tint)",
  roles: "var(--qc-gold-tint)",
  ownership: "var(--qc-sage-tint)",
  onboarding: "var(--qc-blend-tint)",
};

function ContinuityIcon({
  name,
  className,
}: {
  name: ContinuityCard["icon"];
  className?: string;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 32 32"
      width="28"
      height="28"
      {...common}
    >
      {name === "offboarding" && (
        <>
          <path d="M7 27V5h13v22" />
          <path d="M20 16h8m-4-4 4 4-4 4" />
          <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "roles" && (
        <>
          <path d="M7 11h18l-4-4m4 4-4 4" />
          <path d="M25 21H7l4-4m-4 4 4 4" />
        </>
      )}
      {name === "ownership" && (
        <>
          <path d="M5 10h15l-4-4m4 4-4 4" />
          <path d="M27 22H12l4-4m-4 4 4 4" />
          <path d="M21 10h6v12" opacity=".65" />
        </>
      )}
      {name === "onboarding" && (
        <>
          <circle cx="13" cy="10" r="4" />
          <path d="M5 26c.7-4.4 3.6-7 8-7 2.2 0 4 .7 5.3 2" />
          <path d="M24 13v10m-5-5h10" />
        </>
      )}
    </svg>
  );
}

function ContinuityCardView({
  card,
  position,
  reduceMotion,
  onViewClick,
}: {
  card: ContinuityCard;
  position: number;
  reduceMotion: boolean;
  onViewClick?: (card: ContinuityCard) => void;
}) {
  return (
    <motion.article
      className="qc-continuity__card"
      aria-labelledby={`qc-continuity-title-${card.index}`}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.18 }}
      transition={{ duration: 0.55, delay: reduceMotion ? 0 : position * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduceMotion ? undefined : { y: -6, transition: { duration: 0.22 } }}
    >
      <div className="qc-continuity__frame">
        <div
          className="qc-continuity__panel"
          style={{ "--qc-card-tint": cardTints[card.icon] } as CSSProperties}
        >
          <div className="qc-continuity__panel-top">
            <span className="qc-continuity__caption">TRANSITION {card.index}</span>
            <span className="qc-continuity__top-icon">
              <ContinuityIcon name={card.icon} />
            </span>
          </div>

          <div className="qc-continuity__panel-middle">
            <h3 id={`qc-continuity-title-${card.index}`}>{card.title}</h3>
            <span className="qc-continuity__arrow" aria-hidden="true">→</span>
          </div>

          <div className="qc-continuity__dots" aria-label={`Card ${position + 1} of ${continuityCards.length}`}>
            {continuityCards.map((item, dotIndex) => (
              <span
                key={item.index}
                className={dotIndex === position ? "is-active" : ""}
              />
            ))}
          </div>
        </div>

        <div className="qc-continuity__footer">
          <div className="qc-continuity__scenario">
            <span className="qc-continuity__scenario-icon">
              <ContinuityIcon name={card.icon} />
            </span>
            <p>{card.description}</p>
          </div>
          <button
            type="button"
            className="qc-continuity__view"
            onClick={() => {
              if (onViewClick) {
                onViewClick(card);
                return;
              }
              document.getElementById("how-it-works")?.scrollIntoView({
                behavior: reduceMotion ? "auto" : "smooth",
                block: "start",
              });
            }}
          >
            View
          </button>
        </div>
      </div>
    </motion.article>
  );
}


export default function ContinuitySection({ onViewClick }: ContinuitySectionProps) {
  const reduceMotionPreference = useReducedMotion();
  const reduceMotion = Boolean(reduceMotionPreference);
  const listRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === "undefined") return;

    const media = window.matchMedia("(max-width: 640px)");
    let observer: IntersectionObserver | undefined;

    const connectObserver = () => {
      observer?.disconnect();
      if (!media.matches) {
        setActiveIndex(0);
        return;
      }

      const cards = Array.from(list.querySelectorAll<HTMLElement>(".qc-continuity__card"));
      observer = new IntersectionObserver(
        (entries) => {
          const mostVisible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

          if (mostVisible) {
            const index = cards.indexOf(mostVisible.target as HTMLElement);
            if (index >= 0) setActiveIndex((current) => current === index ? current : index);
          }
        },
        { root: list, threshold: [0.35, 0.55, 0.75] },
      );

      cards.forEach((card) => observer?.observe(card));
    };

    connectObserver();
    media.addEventListener("change", connectObserver);
    return () => {
      observer?.disconnect();
      media.removeEventListener("change", connectObserver);
    };
  }, []);

  return (
    <section
      id="use-cases"
      className="qc-continuity"
      aria-labelledby="qc-continuity-heading"
    >
      <style>{`
        .qc-continuity {
          --qc-gold: #C69A4D;
          --qc-lavender: #7785C5;
          --qc-cream: #F4E9D5;
          --qc-off-white: #F5F4F0;
          --qc-charcoal: #252525;
          --qc-lavender-tint: #ECEFF9;
          --qc-gold-tint: #F9F1E2;
          --qc-sage-tint: #F3F1E7;
          --qc-blend-tint: #F2EEF8;
          position: relative;
          isolation: isolate;
          border-radius: 28px;
          background: var(--qc-cream);
          color: var(--qc-charcoal);
          padding: clamp(52px, 7vw, 88px) clamp(20px, 4vw, 48px) clamp(48px, 6vw, 72px);
          font-family: "Plus Jakarta Sans", sans-serif;
        }

        .qc-continuity::before,
        .qc-continuity::after {
          content: "";
          position: absolute;
          z-index: -1;
          width: min(780px, 78vw);
          aspect-ratio: 1;
          border-radius: 50%;
          pointer-events: none;
          background: repeating-radial-gradient(
            circle,
            transparent 0 49px,
            rgba(198, 154, 77, .105) 50px 51px,
            transparent 52px 91px
          );
        }

        .qc-continuity::before {
          top: -42%;
          right: -23%;
        }

        .qc-continuity::after {
          bottom: -62%;
          left: -28%;
          opacity: .72;
        }

        .qc-continuity__inner {
          width: min(100%, 1200px);
          margin-inline: auto;
          position: relative;
        }

        .qc-continuity__header {
          max-width: 760px;
          margin: 0 0 clamp(30px, 4vw, 48px);
        }

        .qc-continuity__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px;
          color: #745522;
          font-size: 11px;
          line-height: 1.4;
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .qc-continuity__header h2 {
          margin: 0;
          max-width: 740px;
          color: var(--qc-charcoal);
          font-size: clamp(34px, 4.2vw, 48px);
          line-height: 1.08;
          letter-spacing: -.055em;
          font-weight: 700;
          text-wrap: balance;
        }

        .qc-continuity__header p {
          margin: 18px 0 0;
          max-width: 650px;
          color: #4f4a42;
          font-size: 16px;
          line-height: 1.7;
          font-weight: 400;
        }

        .qc-continuity__list {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .qc-continuity__card {
          min-width: 0;
          height: 100%;
        }

        .qc-continuity__frame {
          height: 100%;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 6px;
          border-radius: 24px;
          background: var(--qc-off-white);
          box-shadow: 0 10px 40px rgba(198, 154, 77, .15);
          transition: box-shadow .25s ease;
        }

        .qc-continuity__card:hover .qc-continuity__frame {
          box-shadow: 0 18px 46px rgba(112, 83, 35, .2);
        }

        .qc-continuity__panel {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 240px;
          height: 240px;
          padding: 19px 18px 15px;
          overflow: hidden;
          border-radius: 18px;
          background: var(--qc-card-tint);
          transition: filter .25s ease, background-color .25s ease;
        }

        .qc-continuity__panel::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(198, 154, 77, .075);
          opacity: 0;
          transition: opacity .25s ease;
          pointer-events: none;
        }

        .qc-continuity__card:hover .qc-continuity__panel::after {
          opacity: 1;
        }

        .qc-continuity__panel-top,
        .qc-continuity__panel-middle {
          position: relative;
          z-index: var(--qc-z-content);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .qc-continuity__caption {
          padding-top: 5px;
          color: #625a50;
          font-size: 11px;
          line-height: 1.3;
          font-weight: 700;
          letter-spacing: .12em;
        }

        .qc-continuity__top-icon {
          display: grid;
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          place-items: center;
          border: 1px solid rgba(198, 154, 77, .42);
          border-radius: 50%;
          color: #9b702c;
          background: rgba(255, 255, 255, .48);
        }

        .qc-continuity__top-icon svg {
          width: 21px;
          height: 21px;
        }

        .qc-continuity__panel-middle {
          align-items: center;
          margin-top: 17px;
        }

        .qc-continuity__panel-middle h3 {
          margin: 0;
          max-width: 235px;
          color: var(--qc-charcoal);
          font-size: clamp(24px, 2.15vw, 30px);
          line-height: 1.12;
          letter-spacing: -.045em;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .qc-continuity__arrow {
          flex: 0 0 auto;
          align-self: center;
          color: var(--qc-charcoal);
          font-size: 25px;
          line-height: 1;
          transition: transform .22s ease;
        }

        .qc-continuity__card:hover .qc-continuity__arrow {
          transform: translateX(4px);
        }

        .qc-continuity__mobile-pagination {
          display: none;
        }

        .qc-continuity__dots {
          position: relative;
          z-index: var(--qc-z-content);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          padding-top: 17px;
        }

        .qc-continuity__dots span {
          width: 5px;
          height: 5px;
          border-radius: 99px;
          background: rgba(37, 37, 37, .28);
          transition: width .2s ease, background-color .2s ease;
        }

        .qc-continuity__dots span.is-active {
          width: 17px;
          background: var(--qc-charcoal);
        }

        .qc-continuity__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 137px;
          padding: 18px 12px 13px;
          border-radius: 0 0 18px 18px;
          background: #fff;
        }

        .qc-continuity__scenario {
          display: flex;
          min-width: 0;
          align-items: flex-start;
          gap: 10px;
        }

        .qc-continuity__scenario-icon {
          display: grid;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          place-items: center;
          border-radius: 50%;
          background: #f5eddf;
          color: #8d672d;
        }

        .qc-continuity__scenario-icon svg {
          width: 19px;
          height: 19px;
        }

        .qc-continuity__scenario p {
          display: -webkit-box;
          min-width: 0;
          margin: 0;
          overflow: hidden;
          color: #4c4944;
          font-size: 12px;
          line-height: 1.55;
          font-weight: 500;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        }

        .qc-continuity__view {
          flex: 0 0 auto;
          min-width: 62px;
          min-height: 38px;
          padding: 0 17px;
          border: 1px solid var(--qc-charcoal);
          border-radius: 999px;
          background: var(--qc-charcoal);
          color: #fff;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: color .2s ease, background-color .2s ease, border-color .2s ease, transform .2s ease;
        }

        .qc-continuity__view:hover {
          border-color: var(--qc-gold);
          background: var(--qc-gold);
          color: #fff;
        }

        .qc-continuity__view:focus-visible {
          outline: 3px solid var(--qc-lavender);
          outline-offset: 3px;
        }

        @media (max-width: 1024px) {
          .qc-continuity__list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px;
          }

          .qc-continuity__panel-middle h3 {
            font-size: clamp(26px, 3.2vw, 32px);
          }

          .qc-continuity__frame {
            min-height: 370px;
          }
        }

        @media (max-width: 640px) {
          .qc-continuity {
            border-radius: 22px;
            padding: 48px 0 44px;
          }

          .qc-continuity__header {
            padding-inline: 22px;
            margin-bottom: 28px;
          }

          .qc-continuity__header h2 {
            font-size: clamp(32px, 9vw, 40px);
          }

          .qc-continuity__header p {
            margin-top: 14px;
            font-size: 15px;
            line-height: 1.65;
          }

          .qc-continuity__mobile-pagination {
            display: flex;
            align-items: center;
            gap: 7px;
            margin-top: 20px;
          }

          .qc-continuity__mobile-pagination span {
            width: 6px;
            height: 6px;
            border-radius: 99px;
            background: rgba(37, 37, 37, .28);
            transition: width .2s ease, background-color .2s ease;
          }

          .qc-continuity__mobile-pagination span.is-active {
            width: 20px;
            background: var(--qc-charcoal);
          }

          .qc-continuity__list {
            display: flex;
            gap: 14px;
            overflow-x: auto;
            padding: 12px 22px 22px;
            scroll-snap-type: x mandatory;
            scroll-padding-inline: 22px;
            overscroll-behavior-x: contain;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }

          .qc-continuity__list::-webkit-scrollbar {
            display: none;
          }

          .qc-continuity__list > li {
            flex: 0 0 min(84vw, 360px);
            scroll-snap-align: center;
          }

          .qc-continuity__frame {
            min-height: 380px;
          }

          .qc-continuity__panel {
            min-height: 240px;
            padding: 20px 20px 16px;
          }

          .qc-continuity__panel-middle h3 {
            max-width: 255px;
            font-size: 30px;
          }

          .qc-continuity__footer {
            min-height: 134px;
            padding-inline: 14px;
          }

          .qc-continuity__scenario p {
            font-size: 13px;
            -webkit-line-clamp: 3;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .qc-continuity *,
          .qc-continuity *::before,
          .qc-continuity *::after {
            scroll-behavior: auto !important;
            transition-duration: .01ms !important;
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div className="qc-continuity__inner">
        <header className="qc-continuity__header">
          <span className="qc-continuity__eyebrow">
            Knowledge continuity
          </span>
          <h2 id="qc-continuity-heading">Knowledge Continuity Across Every Transition.</h2>
          <p>
            Keep work moving through the moments when people, roles, and responsibilities change.
          </p>
          <div className="qc-continuity__mobile-pagination" aria-label={`Card ${activeIndex + 1} of 4`}>
            {continuityCards.map((card, index) => (
              <span key={card.index} className={index === activeIndex ? "is-active" : ""} />
            ))}
          </div>
        </header>

        <ul className="qc-continuity__list" ref={listRef}>
          {continuityCards.map((card, index) => (
            <li key={card.index}>
              <ContinuityCardView
                card={card}
                position={index}
                reduceMotion={reduceMotion}
                onViewClick={onViewClick}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
