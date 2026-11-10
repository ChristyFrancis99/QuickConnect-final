import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

type Step = {
  number: string;
  title: string;
  description: string;
  tint: string;
  accent: string;
  pin: string;
  tilt: number;
  side: "left" | "right";
};

const steps: Step[] = [
  { number: "01", title: "Centralized Knowledge", description: "Bring project information, documents, decisions, and resources into one organized space.", tint: "#FBEBD3", accent: "#A8742D", pin: "#C69A4D", tilt: -3, side: "left" },
  { number: "02", title: "AI-Powered Analysis", description: "Support teams in understanding, summarizing, and organizing project knowledge with AI-assisted analysis.", tint: "#E6E9F7", accent: "#596AAE", pin: "#7785C5", tilt: 2.5, side: "right" },
  { number: "03", title: "Structured Handovers", description: "Create clear handover records that help incoming team members understand responsibilities and context.", tint: "#EFE6F3", accent: "#80628F", pin: "#A58AB4", tilt: -2, side: "left" },
  { number: "04", title: "Verification & Readiness", description: "Track handover progress and identify missing information before responsibilities are transferred.", tint: "#F3E4C8", accent: "#966B2E", pin: "#B7833C", tilt: 3, side: "right" },
];

type Connector = { paths: string[]; width: number; height: number };

function measureConnectors(list: HTMLOListElement): Connector {
  const cards = Array.from(list.querySelectorAll<HTMLElement>("[data-step-card]"));
  const bounds = list.getBoundingClientRect();
  const paths = cards.slice(0, -1).map((card, index) => {
    const next = cards[index + 1];
    const a = card.getBoundingClientRect();
    const b = next.getBoundingClientRect();
    const x1 = a.left + a.width / 2 - bounds.left;
    const y1 = a.bottom - bounds.top + 2;
    const x2 = b.left + b.width / 2 - bounds.left;
    const y2 = b.top - bounds.top - 2;
    const mid = (y1 + y2) / 2;
    const bend = Math.max(34, Math.abs(x2 - x1) * 0.2);
    const sign = x2 >= x1 ? 1 : -1;
    return "M " + x1 + " " + y1 + " C " + (x1 + bend * sign) + " " + mid + ", " + (x2 - bend * sign) + " " + mid + ", " + x2 + " " + y2;
  });
  return { paths, width: list.clientWidth, height: list.clientHeight };
}

function Pin({ progress, index, reduced }: { progress: MotionValue<number>; index: number; reduced: boolean }) {
  const start = index * 0.235 + 0.075;
  const y = useTransform(progress, [start, start + 0.035, start + 0.07], [-25, 4, 0]);
  const scale = useTransform(progress, [start, start + 0.035, start + 0.07], [0.55, 1.08, 1]);
  const rotate = useTransform(progress, [start, start + 0.035, start + 0.07], [-12, 5, 0]);
  return (
    <motion.span
      aria-hidden="true"
      className="absolute left-1/2 top-[-18px] z-10 h-[30px] w-[30px] -translate-x-1/2 rounded-full border border-white/80 shadow-[0_5px_10px_rgba(77,57,27,.22),0_0_18px_rgba(198,154,77,.27),inset_-3px_-4px_7px_rgba(65,45,20,.24),inset_2px_2px_4px_rgba(255,255,255,.82)]"
      style={{
        background: "radial-gradient(circle at 31% 24%,rgba(255,255,255,.98) 0 5%,rgba(255,255,255,.5) 7% 13%,transparent 25%),radial-gradient(circle at 38% 30%,#fff4d9 0," + steps[index].pin + " 35%,#8f672f 100%)",
        y: reduced ? 0 : y,
        scale: reduced ? 1 : scale,
        rotate: reduced ? 0 : rotate,
      }}
    />
  );
}

function StepCard({ step, index, progress, reduced }: { step: Step; index: number; progress: MotionValue<number>; reduced: boolean }) {
  const start = index * 0.235;
  const appear = start + 0.115;
  const settle = start + 0.205;
  const sideOffset = step.side === "right" ? 48 : -48;
  const opacity = useTransform(progress, [start, appear, settle], [0, 0.15, 1]);
  const y = useTransform(progress, [start, appear, settle], [60, 30, 0]);
  const x = useTransform(progress, [start, appear, settle], [sideOffset, sideOffset * 0.45, 0]);
  const scale = useTransform(progress, [start, appear, settle], [0.94, 0.97, 1]);
  const rotate = useTransform(progress, [start, appear, settle], [step.tilt - 2, step.tilt - 0.8, step.tilt]);

  return (
    <motion.li
      data-step-card
      className={"relative z-10 w-full max-w-[340px] " + (step.side === "left" ? "self-start md:ml-[3%]" : "self-end md:mr-[3%]")}
      style={reduced ? undefined : { opacity, y, x, scale, rotate }}
    >
      <article className="rounded-[28px] border border-[#8F744C]/[0.12] bg-white/95 p-[14px] shadow-[0_18px_48px_rgba(91,72,43,.105),0_3px_10px_rgba(91,72,43,.055)]" aria-labelledby={"continuity-step-" + step.number}>
        <div className="relative flex min-h-[280px] flex-col justify-between rounded-[20px] px-[25px] py-[27px]" style={{ backgroundColor: step.tint }}>
          <span className="text-[48px] font-light leading-none tracking-[-.08em]" style={{ color: step.accent }}>{step.number}</span>
          <Pin progress={progress} index={index} reduced={reduced} />
          <div className="pt-10">
            <h3 id={"continuity-step-" + step.number} className="text-[23px] font-semibold leading-tight tracking-[-.04em] text-[#252525] md:text-2xl">{step.title}</h3>
            <p className="mt-[13px] text-[15.5px] font-normal leading-[1.7] text-[#252525]/75">{step.description}</p>
          </div>
        </div>
      </article>
    </motion.li>
  );
}

function ConnectorLine({ path, index, progress, reduced }: { path: string; index: number; progress: MotionValue<number>; reduced: boolean }) {
  const start = index * 0.235 + 0.205;
  const pathLength = useTransform(progress, [start, start + 0.105], [0, 1]);
  return (
    <motion.path
      d={path}
      fill="none"
      stroke={index % 2 === 0 ? "#A98751" : "#777FAD"}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeDasharray="6 8"
      pathLength={reduced ? 1 : pathLength}
      opacity={0.72}
    />
  );
}

export default function ContinuitySteps() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const reduced = Boolean(useReducedMotion());
  const [connector, setConnector] = useState<Connector>({ paths: [], width: 0, height: 0 });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 25, mass: 0.35 });

  const updateConnectors = useCallback(() => {
    if (!listRef.current) return;
    const next = measureConnectors(listRef.current);
    setConnector((current) =>
      current.width === next.width && current.height === next.height && current.paths.join("|") === next.paths.join("|")
        ? current
        : next,
    );
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    updateConnectors();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateConnectors);
    observer.observe(list);
    list.querySelectorAll<HTMLElement>("[data-step-card]").forEach((card) => observer.observe(card));
    window.addEventListener("resize", updateConnectors);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateConnectors);
    };
  }, [updateConnectors]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="continuity-steps-heading"
      className="relative isolate overflow-clip bg-[#F5F4F0] px-[18px] py-16 text-[#252525] md:px-[5vw] md:py-28"
      style={{
        backgroundImage: "radial-gradient(ellipse at 78% 12%,rgba(198,154,77,.105),transparent 42%),repeating-linear-gradient(to bottom,transparent 0 31px,rgba(37,37,37,.05) 31px 32px)",
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}
    >
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="relative z-10 mx-auto mb-[66px] max-w-[780px] text-left md:mb-28 md:text-center">
          <h2 id="continuity-steps-heading" className="text-[clamp(34px,4.1vw,48px)] font-bold leading-[1.1] tracking-[-.055em] text-[#252525]">
            Turn Knowledge Into Continuity.
          </h2>
          <p className="mx-auto mt-4 max-w-[690px] text-[15px] font-normal leading-[1.75] text-[#252525]/75 md:mt-5 md:text-base">
            QuickConnect brings scattered project knowledge together and transforms it into structured, actionable handovers.
          </p>
        </header>

        <div className="relative mx-auto w-full max-w-[1000px]">
          {connector.width > 0 && connector.height > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
              viewBox={"0 0 " + connector.width + " " + connector.height}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {connector.paths.map((path, index) => (
                <ConnectorLine key={"continuity-line-" + index} path={path} index={index} progress={progress} reduced={reduced} />
              ))}
            </svg>
          )}
          <ol ref={listRef} className="relative z-[1] flex list-none flex-col gap-[106px] p-0 md:gap-[clamp(280px,40vh,380px)] md:px-[8%]">
            {steps.map((step, index) => (
              <StepCard key={step.number} step={step} index={index} progress={progress} reduced={reduced} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
