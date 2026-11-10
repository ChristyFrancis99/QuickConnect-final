import { useRef, type CSSProperties } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  Check,
  ClipboardList,
  Files,
  FolderKanban,
  Gauge,
  ShieldCheck,
  Users,
} from "lucide-react";

const platformCards = [
  {
    title: "Project Management",
    description: "Bring project goals, tasks, owners, and deadlines into one clear view. Everyone can see what needs attention, who is responsible, and what happens next.",
    status: "Active",
    background: "#C69A4D",
    foreground: "#252525",
    icon: FolderKanban,
    image: "01.png",
    imageAlt: "Project dashboard with task list, timeline, and milestone overview",
    highlights: ["Tasks & milestones", "Clear ownership", "Deadline visibility"],
  },
  {
    title: "Knowledge Sources",
    description: "Keep briefs, documents, links, decisions, and reference files connected to the work they support. Find the right information without digging through scattered folders and chats.",
    status: "Completed",
    background: "#7785C5",
    foreground: "#252525",
    icon: Files,
    image: "02.png",
    imageAlt: "Knowledge library with connected project documents and resources",
    highlights: ["Central file library", "Connected references", "Quick document access"],
  },
  {
    title: "AI Analysis",
    description: "Turn lengthy project updates and shared information into concise, useful summaries. Help teammates quickly understand the background, key decisions, and outstanding questions.",
    status: "In Progress",
    background: "#252525",
    foreground: "#FFFFFF",
    icon: BrainCircuit,
    image: "03.png",
    imageAlt: "AI analysis summary highlighting decisions and open questions",
    highlights: ["Key decisions", "Progress summaries", "Open questions"],
  },
  {
    title: "Structured Handovers",
    description: "Create a structured handover with responsibilities, important context, open tasks, and next steps. Give the incoming owner a reliable starting point instead of a rushed verbal update.",
    status: "Active",
    background: "#A87E36",
    foreground: "#171717",
    icon: ClipboardList,
    image: "04.png",
    imageAlt: "Structured handover record showing responsibilities and next steps",
    highlights: ["Role responsibilities", "Pending actions", "Essential context"],
  },
  {
    title: "Verification",
    description: "Use a clear review process to spot missing files, unanswered questions, and incomplete handover details before work changes hands.",
    status: "Completed",
    background: "#5A67A6",
    foreground: "#FFFFFF",
    icon: ShieldCheck,
    image: "05.png",
    imageAlt: "Verification checklist with reviewed and outstanding items",
    highlights: ["File completeness", "Details reviewed", "Owner confirmation"],
  },
  {
    title: "Readiness Tracking",
    description: "See how prepared a project or team member is for a transition. Track what is complete, what still needs review, and where follow-up is required.",
    status: "In Progress",
    background: "#F5F4F0",
    foreground: "#252525",
    border: true,
    icon: Gauge,
    image: "06.png",
    imageAlt: "Readiness dashboard with progress ring and completion indicators",
    highlights: ["Completion overview", "Outstanding items", "Review status"],
  },
  {
    title: "Team Management",
    description: "Make roles, project owners, and collaborators easier to understand. Help each person see who to contact and how their work connects to the wider team.",
    status: "Active",
    background: "#E3C98F",
    foreground: "#252525",
    icon: Users,
    image: "07.png",
    imageAlt: "Team directory showing project roles and collaborators",
    highlights: ["Team directory", "Role visibility", "Project contacts"],
  },
  {
    title: "Activity Tracking",
    description: "Keep a readable trail of key changes, new resources, reviews, and handover activity. Give the team more visibility into what has happened and what needs attention.",
    status: "Pending",
    background: "#EADBBE",
    foreground: "#252525",
    icon: Activity,
    image: "08.png",
    imageAlt: "Activity timeline showing project updates and handover reviews",
    highlights: ["Recent changes", "Resource updates", "Review history"],
  },
] as const;

type PlatformCardData = (typeof platformCards)[number];

const statusColors: Record<string, string> = {
  Active: "#C69A4D",
  "In Progress": "#7785C5",
  Completed: "#7CB342",
  Pending: "#8A8A8A",
};

function StatusChip({ status }: { status: string }) {
  return (
    <span className="qcp__status">
      <span
        className="qcp__status-dot"
        style={{ backgroundColor: statusColors[status] }}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}


function PlatformCard({
  item,
  index,
  progress,
  reducedMotion,
}: {
  item: PlatformCardData;
  index: number;
  progress: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const total = platformCards.length;
  const enter = index / total;
  const exit = (index + 1) / total;
  const isLast = index === total - 1;
  const settleStart = index === 0 ? 0 : Math.max(0, enter - 0.035);
  const settlePoint = index === 0 ? 0.035 : enter;
  const exitEnd = isLast ? 1.01 : Math.min(1, exit + 0.10);

  const scale = useTransform(
    progress,
    [settleStart, settlePoint, exit, exitEnd],
    reducedMotion ? [1, 1, 1, 1] : index === 0 ? [1, 1, 1, 0.93] : [0.97, 1, 1, 0.93]
  );
  const rotateX = useTransform(
    progress,
    [settleStart, settlePoint, exit, exitEnd],
    reducedMotion ? [0, 0, 0, 0] : [0, 0, 0, 5]
  );
  const y = useTransform(
    progress,
    [exit, exitEnd],
    reducedMotion ? [0, 0] : [0, -8]
  );
  const brightnessValue = useTransform(
    progress,
    [exit, exitEnd],
    reducedMotion ? [1, 1] : [1, 0.88]
  );
  const filter = useTransform(
    brightnessValue,
    (value) => `brightness(${value})`
  );

  const Icon = item.icon;

  return (
    <motion.li
      className="qcp__card-slot"
      style={{ "--qc-stack-index": index } as CSSProperties}
    >
      <motion.article
        className={`qcp__card${
          item.border ? " qcp__card--border" : ""
        }`}
        style={{
          backgroundColor: item.background,
          color: item.foreground,
          scale: isLast ? 1 : scale,
          rotateX: isLast ? 0 : rotateX,
          y: isLast ? 0 : y,
          filter: isLast ? "none" : filter,
        }}
      >
        <div className="qcp__orbit" aria-hidden="true" />

        <div className="qcp__card-top">
          <div className="qcp__card-heading">
            <div className="qcp__icon" aria-hidden="true">
              <Icon size={24} strokeWidth={1.5} />
            </div>
            <h3>{item.title}</h3>
          </div>

          <span className="qcp__index">
            [{String(index + 1).padStart(2, "0")}]
          </span>
        </div>

        <div className="qcp__card-content">
          <p>{item.description}</p>
          <StatusChip status={item.status} />
          <div className="qcp__highlights">
            <span className="qcp__highlights-label">WHAT YOU CAN MANAGE</span>
            <div className="qcp__highlight-list">
              {item.highlights.map((highlight) => (
                <span className="qcp__highlight" key={highlight}>
                  <Check size={12} strokeWidth={2} />
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="qcp__card-meta" aria-hidden="true">
          <span>QUICKCONNECT</span>
          <span>PLATFORM / {String(index + 1).padStart(2, "0")}</span>
        </div>

        <div className="qcp__visual-panel">
          <img
            className="qcp__visual-image"
            src={`/images/platform/${item.image}`}
            alt={item.imageAlt}
            loading="lazy"
            decoding="async"
          />
        </div>

        <a
          className="qcp__learn"
          href="#platform"
          aria-label={`Return to The Platform section: ${item.title}`}
        >
          Learn More <ArrowUpRight size={15} />
        </a>
      </motion.article>
    </motion.li>
  );
}

export default function PlatformSection() {
  const stackRef = useRef<HTMLOListElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      id="platform"
      className="qcp"
      aria-labelledby="qcp-heading"
    >
      <div className="qcp__intro">
        <span className="qcp__eyebrow">
          <span aria-hidden="true" />
          THE PLATFORM
        </span>

        <h2 id="qcp-heading">
          Everything Your Team Needs
          <br />
          to Stay Connected.
        </h2>

        <p>
          QuickConnect brings your project information, people, and processes
          into one connected workspace. From the first task to the final
          handover, everyone gets the context they need to keep work moving.
        </p>
        <div className="qcp__value-points" aria-label="What your team gains">
          <div className="qcp__value-point">
            <span className="qcp__value-number">01</span>
            <div><strong>Find the full picture</strong><span>Keep files, decisions, and updates connected to each project.</span></div>
          </div>
          <div className="qcp__value-point">
            <span className="qcp__value-number">02</span>
            <div><strong>Know what happens next</strong><span>Make ownership, progress, and pending actions easier to see.</span></div>
          </div>
          <div className="qcp__value-point">
            <span className="qcp__value-number">03</span>
            <div><strong>Make transitions smoother</strong><span>Pass work forward with the context and resources people need.</span></div>
          </div>
        </div>
      </div>

      <ol ref={stackRef} className="qcp__stack">
        {platformCards.map((item, index) => (
          <PlatformCard
            key={item.title}
            item={item}
            index={index}
            progress={scrollYProgress}
            reducedMotion={Boolean(reducedMotion)}
          />
        ))}
      </ol>

      <style>{`
        .qcp {
          --qc-gold: #C69A4D;
          --qc-lavender: #7785C5;
          --qc-cream: #F4E9D5;
          --qc-off-white: #F5F4F0;
          --qc-charcoal: #252525;
          --qc-green: #7CB342;
          --qc-gray: #8A8A8A;
          --qc-shadow: 0 10px 40px rgba(198,154,77,.15);
          position: relative;
          isolation: isolate;
          width: 100%;
          padding: clamp(80px, 10vw, 140px) 20px 8svh;
          color: var(--qc-charcoal);
          font-family: "Plus Jakarta Sans", sans-serif;
          scroll-margin-top: 20px;
        }

        .qcp *,
        .qcp *::before,
        .qcp *::after {
          box-sizing: border-box;
        }

        .qcp__intro {
          width: min(100%, 900px);
          margin: 0 auto 70px;
          text-align: center;
        }

        .qcp__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          color: var(--qc-gold);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .18em;
        }

        .qcp__eyebrow > span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--qc-gold);
        }

        .qcp__intro h2 {
          margin: 0;
          font-size: clamp(34px, 5.3vw, 64px);
          font-weight: 700;
          line-height: 1.12;
          letter-spacing: -.055em;
        }

        .qcp__intro p {
          max-width: 620px;
          margin: 22px auto 0;
          color: #77736c;
          font-size: 16px;
          line-height: 1.8;
          font-weight: 400;
        }

        .qcp__value-points {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin: 34px auto 0;
          text-align: left;
        }

        .qcp__value-point {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          min-width: 0;
          padding: 15px 14px;
          border: 1px solid rgba(37,37,37,.09);
          border-radius: 14px;
          background: rgba(255,255,255,.58);
        }

        .qcp__value-number {
          display: grid;
          width: 27px;
          height: 27px;
          flex: 0 0 27px;
          place-items: center;
          border-radius: 50%;
          background: rgba(198,154,77,.16);
          color: #8d682b;
          font-size: 9px;
          font-weight: 800;
        }

        .qcp__value-point div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .qcp__value-point strong {
          color: var(--qc-charcoal);
          font-size: 11px;
          line-height: 1.35;
          font-weight: 700;
        }

        .qcp__value-point div span {
          color: #77736c;
          font-size: 10px;
          line-height: 1.5;
        }

        .qcp__stack {
          position: relative;
          width: min(100%, 1100px);
          margin: 0 auto;
          padding: 0 0 30svh;
          list-style: none;
        }

        .qcp__card-slot {
          position: sticky;
          z-index: calc(var(--qc-z-sticky) + var(--qc-stack-index));
          top: calc(var(--qc-nav-height) + 16px);
          height: min(70svh, 760px);
          min-height: min(70svh, 460px);
          margin-bottom: 30svh;
          perspective: 1200px;
        }

        .qcp__card-slot:last-child {
          margin-bottom: 0;
        }

        .qcp__card {
          position: relative;
          display: flex;
          width: 100%;
          height: 100%;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 24px;
          padding: clamp(26px, 4.2vw, 56px);
          box-shadow: var(--qc-shadow);
          transition: box-shadow .22s ease;
          transform-origin: center top;
          transform-style: preserve-3d;
        }

        .qcp__card:hover { box-shadow: 0 24px 56px rgba(37,37,37,.2); }

        .qcp__card--border {
          border: 1px solid var(--qc-gold);
        }

        .qcp__orbit {
          position: absolute;
          top: -35%;
          right: -10%;
          width: 75%;
          aspect-ratio: 1;
          border: 1px solid currentColor;
          border-radius: 50%;
          opacity: .10;
          pointer-events: none;
        }

        .qcp__orbit::before,
        .qcp__orbit::after {
          position: absolute;
          content: "";
          inset: 12%;
          border: 1px solid currentColor;
          border-radius: 50%;
        }

        .qcp__orbit::after {
          inset: 25%;
        }

        .qcp__card-top {
          position: relative;
          z-index: var(--qc-z-content);
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .qcp__card-heading {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .qcp__icon {
          display: grid;
          width: 58px;
          height: 58px;
          flex: 0 0 58px;
          place-items: center;
          border: 1px solid currentColor;
          border-radius: 17px;
          background: rgba(255,255,255,.10);
          color: var(--qc-gold);
        }

        .qcp__card h3 {
          margin: 0;
          font-size: clamp(23px, 3vw, 32px);
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: -.04em;
        }

        .qcp__index {
          padding-top: 7px;
          color: inherit;
          font-size: 15px;
          font-weight: 600;
          opacity: .6;
        }

        .qcp__card-content {
          position: relative;
          z-index: var(--qc-z-content);
          max-width: 530px;
          margin-top: 28px;
        }

        .qcp__card-content p {
          margin: 0 0 20px;
          font-size: 16px;
          line-height: 1.75;
          font-weight: 400;
          opacity: .9;
        }

        .qcp__status {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          border: 1px solid currentColor;
          border-radius: 999px;
          padding: 9px 15px;
          background: rgba(255,255,255,.13);
          font-size: 12px;
          font-weight: 600;
        }

        .qcp__status-dot {
          width: 8px;
          height: 8px;
          flex: 0 0 8px;
          border-radius: 50%;
        }

        .qcp__highlights {
          margin-top: 27px;
        }

        .qcp__highlights-label {
          display: block;
          margin-bottom: 12px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .15em;
          opacity: .62;
        }

        .qcp__highlight-list {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          max-width: 560px;
        }

        .qcp__highlight {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid currentColor;
          border-color: color-mix(in srgb, currentColor 18%, transparent);
          border-radius: 999px;
          padding: 9px 12px;
          background: rgba(255,255,255,.13);
          font-size: 10px;
          font-weight: 600;
          line-height: 1.2;
        }

        .qcp__highlight svg {
          flex: 0 0 auto;
          opacity: .75;
        }

        .qcp__card-bottom {
          position: relative;
          z-index: var(--qc-z-content);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-top: 30px;
        }

        .qcp__card-meta {
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding-bottom: 5px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .13em;
          opacity: .7;
        }

        .qcp__visual-panel {
          position: absolute;
          z-index: var(--qc-z-content);
          top: 12%;
          right: 3.5%;
          bottom: 12%;
          display: grid;
          width: 53%;
          place-items: center;
          overflow: visible;
          border-radius: 22px;
          background: radial-gradient(ellipse at center, rgba(255,255,255,.30), transparent 70%);
          pointer-events: none;
        }

        .qcp__visual-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          filter: drop-shadow(0 14px 22px rgba(37,37,37,.13));
          animation: qcp-image-float 6s ease-in-out infinite;
          animation-delay: calc(var(--qc-stack-index) * -0.65s);
        }

        @keyframes qcp-image-float {
          0%, 100% { transform: translateY(-8px); }
          50% { transform: translateY(8px); }
        }

        .qcp__learn {
          position: absolute;
          z-index: var(--qc-z-content);
          right: clamp(26px, 4.2vw, 56px);
          bottom: clamp(26px, 4.2vw, 56px);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 12px 17px;
          background: var(--qc-off-white);
          color: var(--qc-charcoal);
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
          transition: transform .25s ease, box-shadow .25s ease;
        }

        .qcp__learn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(37,37,37,.14);
        }

        .qcp__learn:hover svg { transform: translate(2px,-2px); }

        .qcp__learn svg {
          transition: transform .25s ease;
        }

        .qcp__learn:focus-visible {
          outline: 3px solid var(--qc-lavender);
          outline-offset: 4px;
        }

        @media (max-width: 760px) {
          .qcp { padding: 75px 14px 5svh; }
          .qcp__intro { margin-bottom: 45px; }
          .qcp__intro h2 br { display: none; }
          .qcp__intro p { font-size: 14px; }

          .qcp__value-points {
            grid-template-columns: 1fr;
            gap: 9px;
            margin-top: 24px;
          }

          .qcp__value-point {
            padding: 12px 13px;
          }

          .qcp__value-point strong { font-size: 12px; }
          .qcp__value-point div span { font-size: 11px; }

          .qcp__stack { padding-bottom: 0; }

          .qcp__card-slot {
            position: relative;
            top: auto;
            height: auto;
            min-height: 0;
            margin-bottom: 20px;
            perspective: none;
          }

          .qcp__card {
            height: auto;
            min-height: 0;
            padding: 25px;
            border-radius: 20px;
            transform: none !important;
            filter: none !important;
          }

          .qcp__card-heading { gap: 13px; }

          .qcp__icon {
            width: 46px;
            height: 46px;
            flex-basis: 46px;
            border-radius: 13px;
          }

          .qcp__card h3 { font-size: 22px; }
          .qcp__card-content { margin-top: 24px; }
          .qcp__card-content { max-width: 100%; padding-bottom: 0; }
          .qcp__card-content p { font-size: 14px; }
          .qcp__highlights { margin-top: 20px; }
          .qcp__highlight-list { gap: 7px; }
          .qcp__highlight { padding: 8px 10px; font-size: 9px; }
          .qcp__visual-panel {
            position: relative;
            top: auto;
            right: auto;
            bottom: auto;
            width: 100%;
            height: 210px;
            margin-top: 22px;
          }
          .qcp__visual-image { animation: none; }
          .qcp__card-meta { margin-top: 22px; }
          .qcp__learn { position: relative; right: auto; bottom: auto; align-self: flex-start; margin-top: 16px; }

          .qcp__card-bottom {
            align-items: flex-start;
            flex-direction: column;
            margin-top: 28px;
          }

          .qcp__preview-wrap {
            width: 100%;
            align-items: stretch;
            flex-direction: column;
          }

          .qcp__learn { align-self: flex-start; }
        }

        @media (max-width: 420px) {
          .qcp__card-top { gap: 10px; }
          .qcp__index { font-size: 12px; }
          .qcp__card h3 { font-size: 19px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .qcp__stack {
            padding-bottom: 0;
          }

          .qcp__card-slot {
            position: relative;
            top: auto;
            height: auto;
            min-height: 0;
            margin-bottom: 20px;
            perspective: none;
          }

          .qcp__card-slot:last-child {
            margin-bottom: 0;
          }

          .qcp__card {
            height: auto;
            min-height: 390px;
            transform: none !important;
            filter: none !important;
          }

          .qcp__visual-image { animation: none !important; }
          .qcp__learn,
          .qcp__learn svg {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
