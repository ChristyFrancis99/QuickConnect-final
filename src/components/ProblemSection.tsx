import { useEffect, useRef, useState, type KeyboardEvent, type FocusEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, FileText, MessageCircle, Sheet, Link2, CircleHelp, UserRound, StickyNote } from "lucide-react";

const cards = [
  { number: "01", title: "Scattered Information", description: "Important files, conversations, and decisions are spread across different tools and locations." },
  { number: "02", title: "Lost Project Context", description: "Teams struggle to understand why decisions were made and how work reached its current state." },
  { number: "03", title: "Unstructured Handovers", description: "Critical information gets transferred through incomplete documents, rushed meetings, and informal conversations." },
];

function ScatteredArt() {
  return <div className="qc-problem-art qc-art-scattered" aria-hidden="true">
    <i className="qc-orbit qc-orbit-a" /><i className="qc-orbit qc-orbit-b" />
    <span className="qc-float qc-float-a"><FileText /></span>
    <span className="qc-float qc-float-b"><MessageCircle /></span>
    <span className="qc-float qc-float-c"><Sheet /></span>
    <i className="qc-spark qc-spark-a" /><i className="qc-spark qc-spark-b" /><i className="qc-spark qc-spark-c" />
  </div>;
}
function ContextArt() {
  return <div className="qc-problem-art qc-art-context" aria-hidden="true">
    <div className="qc-context-track"><i /><i className="qc-missing-node" /><i /></div>
    <span className="qc-question"><CircleHelp /></span>
    <div className="qc-context-paper"><i /><i /><i /></div><span className="qc-broken-link"><Link2 /></span>
  </div>;
}
function HandoverArt() {
  return <div className="qc-problem-art qc-art-handover" aria-hidden="true">
    <div className="qc-avatar qc-avatar-a"><UserRound /></div>
    <div className="qc-paper-stack"><span className="qc-paper qc-paper-a" /><span className="qc-paper qc-paper-b" /><span className="qc-paper qc-paper-c"><StickyNote /></span><i>?</i></div>
    <div className="qc-avatar qc-avatar-b"><UserRound /></div><span className="qc-transfer-arrow"><ArrowUpRight /></span>
  </div>;
}
const art = [ScatteredArt, ContextArt, HandoverArt];

export default function ProblemSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches);
  const reduceMotion = useReducedMotion();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = reduceMotion ?? false;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced || mobile || hasInteracted || paused) return;
    const timer = window.setInterval(() => setActiveIndex((i) => (i + 1) % cards.length), 4000);
    return () => window.clearInterval(timer);
  }, [reduced, mobile, hasInteracted, paused]);

  const choose = (index: number, userAction = false) => {
    setActiveIndex(index);
    if (userAction) setHasInteracted(true);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | undefined;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % cards.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + cards.length - 1) % cards.length;
    if (next !== undefined) {
      event.preventDefault();
      setHasInteracted(true);
      choose(next);
      buttons.current[next]?.focus();
    }
  };
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
  };

  return <section id="problem" className="qc-problem" aria-labelledby="qc-problem-title"
    onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={onBlur}>
    <style>{`
      .qc-problem{--qc-gold:#C69A4D;--qc-lavender:#7785C5;--qc-cream:#F4E9D5;--qc-off-white:#F5F4F0;--qc-charcoal:#252525;width:100%;padding:clamp(72px,9vw,120px) 24px;color:var(--qc-charcoal);font-family:"Plus Jakarta Sans",sans-serif;background:#F5F4F0}
      .qc-problem *,.qc-problem *:before,.qc-problem *:after{box-sizing:border-box}
      .qc-problem__inner{width:min(100%,1180px);margin:0 auto}
      .qc-problem__header{display:flex;align-items:flex-end;justify-content:space-between;gap:36px;margin-bottom:44px}
      .qc-problem__heading{max-width:760px;min-width:0}
      .qc-problem__eyebrow{display:inline-flex;align-items:center;gap:8px;margin:0 0 16px;color:#8F6B28;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
      .qc-problem__eyebrow-dot{width:6px;height:6px;border-radius:50%;background:var(--qc-gold)}
      .qc-problem__title{margin:0;font-size:clamp(34px,4.4vw,50px);line-height:1.12;letter-spacing:-.045em;font-weight:700;color:var(--qc-charcoal)}
      .qc-problem__accent{display:inline;color:var(--qc-gold)}
      .qc-problem__intro{max-width:680px;margin:18px 0 0;color:rgba(37,37,37,.74);font-size:16px;line-height:1.75;font-weight:400}
      .qc-problem__cards{display:flex;gap:18px;width:100%;align-items:stretch}
      .qc-problem-card{position:relative;display:flex;flex:1 1 0%;min-width:0;height:340px;overflow:hidden;padding:26px 24px;border:1.5px solid rgba(37,37,37,.09);border-radius:24px;background:#FFFFFF;color:var(--qc-charcoal);text-align:left;cursor:pointer;isolation:isolate;box-shadow:0 6px 20px rgba(37,37,37,.04);transition:transform .22s ease,opacity .22s ease}
      .qc-problem-card:hover{border-color:rgba(198,154,77,.45);box-shadow:0 10px 28px rgba(198,154,77,.12)}
      .qc-problem-card[data-active=true]{border-color:var(--qc-gold);background:#FFFFFF;box-shadow:0 16px 42px -6px rgba(198,154,77,.22),0 4px 14px rgba(37,37,37,.04)}
      .qc-problem-card:focus-visible{outline:3px solid var(--qc-lavender);outline-offset:4px}
      .qc-problem-card__wash{position:absolute;z-index:-1;width:240px;height:240px;right:-80px;bottom:-90px;border-radius:50%;background:radial-gradient(circle,rgba(244,233,213,.45) 0%,transparent 70%)}
      .qc-problem-card__inner{position:relative;z-index:var(--qc-z-content);display:flex;flex-direction:column;width:100%;min-width:0;height:100%}
      .qc-problem-card__top{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .qc-problem-card__index{color:var(--qc-gold);font-size:13px;font-weight:700;letter-spacing:.1em}
      .qc-problem-card__collapsed{display:block;overflow:hidden;margin-top:24px;max-width:100%;font-size:20px;line-height:1.3;font-weight:650;white-space:nowrap;text-overflow:ellipsis;color:var(--qc-charcoal)}
      .qc-problem-card__expanded{display:flex;flex:1;align-items:center;gap:18px;min-width:0;min-height:0;padding-top:12px}
      .qc-problem-card__copy{display:flex;flex:1 1 48%;flex-direction:column;align-items:flex-start;min-width:0}
      .qc-problem-card__title{margin:0;max-width:100%;font-size:clamp(18px,1.8vw,22px);line-height:1.22;letter-spacing:-.03em;font-weight:700;color:var(--qc-charcoal);white-space:nowrap}
      .qc-problem-card__description{margin:12px 0 0;max-width:340px;color:rgba(37,37,37,.74);font-size:15px;line-height:1.68;font-weight:400}
      .qc-problem-card__action{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;margin-top:20px;border-radius:50%;background:var(--qc-gold);color:#252525;transition:transform .2s ease}
      .qc-problem-card__action:hover{transform:scale(1.06)}
      .qc-problem-card__small-action{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--qc-off-white);color:var(--qc-charcoal);transition:transform .2s ease}
      .qc-problem-art{position:relative;display:block;flex:0 1 48%;min-width:145px;height:220px;overflow:hidden;border-radius:20px;background:var(--qc-cream);box-shadow:inset 0 0 0 1px rgba(198,154,77,.18)}
      .qc-problem-art svg{width:24px;height:24px;stroke-width:1.65}
      .qc-orbit{position:absolute;border:1px solid rgba(198,154,77,.32);border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%)}
      .qc-orbit-a{width:205px;height:205px}.qc-orbit-b{width:145px;height:145px;border-style:dashed}
      .qc-float{position:absolute;display:grid;place-items:center;width:60px;height:60px;border:1px solid rgba(198,154,77,.25);border-radius:16px;background:var(--qc-off-white);color:var(--qc-gold);box-shadow:0 8px 22px rgba(37,37,37,.08)}
      .qc-float-a{left:16%;top:18%;transform:rotate(-10deg)}.qc-float-b{right:13%;top:24%;color:var(--qc-lavender);transform:rotate(8deg)}.qc-float-c{left:39%;bottom:13%;transform:rotate(5deg)}
      .qc-spark{position:absolute;width:6px;height:6px;border-radius:50%;background:var(--qc-gold)}.qc-spark-a{left:18%;bottom:24%}.qc-spark-b{right:18%;bottom:18%;background:var(--qc-lavender)}.qc-spark-c{right:30%;top:13%;width:5px;height:5px}
      .qc-context-track{position:absolute;left:12%;right:12%;top:48%;display:flex;align-items:center;height:2px;background:linear-gradient(90deg,var(--qc-gold) 0 38%,transparent 38% 44%,var(--qc-lavender) 44% 100%)}
      .qc-context-track i{position:absolute;left:0;width:17px;height:17px;border:4px solid var(--qc-cream);border-radius:50%;background:var(--qc-gold);box-shadow:0 0 0 1px var(--qc-gold)}
      .qc-context-track i:nth-child(2){left:48%;width:21px;height:21px;background:var(--qc-off-white);box-shadow:0 0 0 1px var(--qc-lavender)}
      .qc-context-track i:nth-child(3){left:auto;right:0}
      .qc-question{position:absolute;left:43%;top:16%;display:grid;place-items:center;width:45px;height:45px;border-radius:15px;background:var(--qc-off-white);color:var(--qc-lavender);box-shadow:0 7px 18px rgba(37,37,37,.08)}
      .qc-context-paper{position:absolute;left:13%;bottom:13%;display:flex;flex-direction:column;gap:7px;width:76px;padding:12px;border-radius:12px;background:rgba(255,255,255,.85);transform:rotate(-7deg)}
      .qc-context-paper i{height:4px;width:100%;border-radius:4px;background:rgba(119,133,197,.35)}.qc-context-paper i:first-child{width:88%;background:rgba(198,154,77,.65)}.qc-context-paper i:last-child{width:56%}
      .qc-broken-link{position:absolute;right:15%;bottom:13%;display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:var(--qc-off-white);color:var(--qc-gold);transform:rotate(12deg)}
      .qc-avatar{position:absolute;bottom:26px;display:grid;place-items:center;width:48px;height:48px;border:1px solid rgba(198,154,77,.5);border-radius:50%;background:var(--qc-off-white);color:var(--qc-gold)}
      .qc-avatar-a{left:7%}.qc-avatar-b{right:7%;color:var(--qc-lavender);border-color:rgba(119,133,197,.5)}
      .qc-paper-stack{position:absolute;left:50%;top:49%;width:118px;height:120px;transform:translate(-50%,-50%)}
      .qc-paper{position:absolute;display:flex;flex-direction:column;justify-content:center;gap:7px;width:86px;height:76px;padding:12px;border:1px solid rgba(198,154,77,.3);border-radius:9px;background:var(--qc-off-white);box-shadow:0 6px 14px rgba(37,37,37,.08)}
      .qc-paper:before,.qc-paper:after{content:"";display:block;width:100%;height:4px;border-radius:5px;background:rgba(37,37,37,.15)}.qc-paper:after{width:68%}
      .qc-paper-a{left:22px;top:2px;transform:rotate(12deg);background:#EADBBE}.qc-paper-b{left:5px;top:15px;transform:rotate(-9deg);border-color:rgba(119,133,197,.4)}
      .qc-paper-c{left:18px;top:30px;transform:rotate(3deg);color:var(--qc-gold)}.qc-paper-c svg{width:17px;height:17px}
      .qc-paper-stack>i{position:absolute;right:0;top:0;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--qc-lavender);color:white;font-size:13px;font-style:normal;font-weight:700}
      .qc-transfer-arrow{position:absolute;left:50%;bottom:12px;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--qc-gold);color:#252525;transform:translateX(-50%)}
      @media(max-width:900px){.qc-problem-card{padding:22px 18px}.qc-problem-card__expanded{gap:12px}.qc-problem-card__title{font-size:21px}.qc-problem-card__description{font-size:14px}.qc-problem-art{min-width:120px;height:190px}}
      @media(max-width:767px){
        .qc-problem{padding:68px 18px}.qc-problem__header{align-items:flex-start;flex-direction:column;gap:18px;margin-bottom:28px}
        .qc-problem__title{font-size:clamp(32px,8.5vw,42px)}.qc-problem__intro{margin-top:14px;font-size:15px;line-height:1.7}
        .qc-problem__cards{flex-direction:column;gap:12px}.qc-problem-card{flex:0 0 auto;width:100%;height:74px;min-height:74px;padding:17px 20px}
        .qc-problem-card[data-active=true]{height:auto;min-height:330px}.qc-problem-card__collapsed{margin-top:8px;font-size:16px}
        .qc-problem-card[data-active=true] .qc-problem-card__collapsed{display:none}
        .qc-problem-card__expanded{gap:12px;padding-top:9px}.qc-problem-card__copy{flex-basis:54%}
        .qc-problem-card__copy{flex-basis:58%}.qc-problem-card__title{font-size:clamp(16px,4.5vw,18px)}.qc-problem-card__description{margin-top:9px;font-size:13px;line-height:1.55}
        .qc-problem-card__action{width:34px;height:34px;margin-top:14px}.qc-problem-art{flex-basis:38%;min-width:0;height:180px;border-radius:17px}
        .qc-problem-art svg{width:20px;height:20px}.qc-problem-card__small-action{width:34px;height:34px}
      }
      @media(max-width:390px){.qc-problem-card[data-active=true]{min-height:360px}.qc-problem-card__expanded{align-items:flex-start;flex-direction:column;justify-content:center}.qc-problem-card__copy{flex:0 0 auto;width:100%}.qc-problem-card__title{font-size:19px}.qc-problem-art{flex:0 0 auto;width:100%;height:112px}.qc-problem-card__action{position:absolute;right:0;bottom:0;margin:0}}
      @media(prefers-reduced-motion:reduce){.qc-problem *,.qc-problem *:before,.qc-problem *:after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important}}


    `}</style>
    <div className="qc-problem__inner">
      <header className="qc-problem__header">
        <div className="qc-problem__heading">
          <p className="qc-problem__eyebrow">
            <span className="qc-problem__eyebrow-dot" aria-hidden="true" />
            THE PROBLEM
          </p>
          <h2 id="qc-problem-title" className="qc-problem__title">
            When People Leave, <span className="qc-problem__accent">Knowledge Shouldn't.</span>
          </h2>
          <p className="qc-problem__intro">
            Teams lose important knowledge during employee departures, role changes, and project transitions. QuickConnect prevents scattered context and broken handovers.
          </p>
        </div>
      </header>
      <div className="qc-problem__cards" role="group" aria-label="Knowledge handover challenges">
        {cards.map((card,index)=>{
          const active=activeIndex===index;
          const Illustration=art[index];
          return <motion.button key={card.number} ref={node=>{buttons.current[index]=node}} type="button"
            className="qc-problem-card" data-active={active} aria-expanded={active}
            aria-label={card.number+": "+card.title}
            aria-describedby={active?"qc-problem-description-"+index:undefined}
            onMouseEnter={()=>{setPaused(true);choose(index)}}
            onFocus={()=>setPaused(true)} onClick={()=>choose(index,true)}
            onKeyDown={event=>onKeyDown(event,index)}
            animate={{ flexGrow: mobile ? 0 : active ? 2.2 : 1, height: mobile ? (active ? "auto" : 74) : 340 }}
            transition={reduced?{duration:0}:{duration:.6,ease:[.22,1,.36,1]}}>
            <span className="qc-problem-card__wash" /><div className="qc-problem-card__inner">
              <span className="qc-problem-card__top"><span className="qc-problem-card__index">{card.number}</span>
                {!active&&<span className="qc-problem-card__small-action"><ArrowUpRight size={18}/></span>}
              </span>
              <AnimatePresence initial={false} mode="wait">
                {active?<motion.div key="open" className="qc-problem-card__expanded"
                  initial={reduced?false:{opacity:0,y:12}} animate={{opacity:1,y:0}}
                  exit={reduced?undefined:{opacity:0,y:-7}}
                  transition={reduced?{duration:0}:{duration:.32,ease:[.22,1,.36,1]}}>
                  <span className="qc-problem-card__copy">
                    <span className="qc-problem-card__title">{card.title}</span>
                    <span className="qc-problem-card__description" id={"qc-problem-description-"+index}>{card.description}</span>
                    <span className="qc-problem-card__action"><ArrowUpRight size={19}/></span>
                  </span><div className="qc-problem-art"><Illustration/></div>
                </motion.div>:<motion.span key="closed" className="qc-problem-card__collapsed"
                  initial={reduced?false:{opacity:0}} animate={{opacity:1}} exit={reduced?undefined:{opacity:0}}
                  transition={{duration:reduced?0:.14}}>{card.title}</motion.span>}
              </AnimatePresence>
            </div>
          </motion.button>;
        })}
      </div>
    </div>
  </section>;
}
