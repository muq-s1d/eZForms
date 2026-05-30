"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Users, Lock, BarChart3, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { TEMPLATES } from "@/lib/templates";

/* ─── Helpers ─── */
function useMagnet(ref: React.RefObject<HTMLElement | null>, strength = 0.12) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    const onLeave = () => { el.style.transform = "translate(0,0)"; };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [ref, strength]);
}

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.72, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Feature cards data ─── */
const features = [
  {
    icon: <Users className="w-5 h-5" />,
    title: "No accounts for voters",
    body: "Your friends just open a link, pick their name, and vote. Zero friction — no signups required.",
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Password protected",
    body: "Keep your form private with a custom access code only your group knows.",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Live results",
    body: "Watch votes roll in with real-time charts. See who's winning before the last vote is even cast.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Self-vote proof",
    body: "The core mechanic: every participant's own name is automatically hidden from their choices.",
  },
];

/* ─── Component ─── */
export default function LandingPage() {
  const router = useRouter();
  // Removed mouse-tracking mesh gradient as requested
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  useMagnet(primaryBtnRef);

  return (
    <div className="flex flex-col min-h-screen text-white overflow-x-hidden">

      <Navbar />

      {/* ══════════ HERO ══════════ */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-5 pt-32 pb-20 md:pt-48 md:pb-32 w-full overflow-hidden">
        
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 md:mb-12"
        >
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#262626] bg-[#050505]/50 backdrop-blur-md hover:bg-white/[0.03] hover:border-[#444] transition-all duration-300 shadow-xl"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] pulse-live inline-block" />
            <span className="text-[11px] font-semibold text-[#A1A1A1] tracking-widest uppercase">
              Live voting rooms
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#A1A1A1]" />
          </Link>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-[110px] font-bold tracking-tighter leading-[0.95] mb-8"
          style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
        >
          Settle the debate. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#A1A1A1] to-[#333333]">
            Instantly.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-[#A1A1A1] max-w-2xl leading-relaxed mb-12 font-medium"
        >
          Create a room, share the link, watch the results roll in. 
          No accounts required for your friends. It just works.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4 z-20"
        >
          <button
            ref={primaryBtnRef}
            className="btn-obsidian-primary inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-[15px] font-bold shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            onClick={() => router.push("/signup")}
            style={{ transition: "transform 0.2s cubic-bezier(0.33,1,0.68,1), box-shadow 0.2s ease" }}
          >
            Start your room
          </button>
        </motion.div>

        {/* ══════════ TEMPLATE CAROUSEL ══════════ */}
        <section className="relative w-full pt-16 pb-8 overflow-hidden z-20">
          <h2 className="text-sm uppercase tracking-widest text-[#A1A1A1] text-center font-bold mb-8">
            Or start with a template in seconds
          </h2>
          <div className="flex overflow-x-auto pb-8 hide-scrollbar px-5 md:px-0 md:max-w-6xl md:mx-auto gap-4 snap-x snap-mandatory">
            {TEMPLATES.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="snap-start shrink-0 w-[280px] md:w-[320px] glass-panel rounded-2xl p-6 flex flex-col h-full hover:border-[#444] transition-colors group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] blur-xl rounded-full pointer-events-none transition-colors group-hover:bg-white/[0.05]" />
                <h3 className="text-lg font-bold text-white mb-2">{t.title}</h3>
                <p className="text-sm text-[#A1A1A1] mb-6 flex-1 line-clamp-3">{t.description}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#444748]">
                    {t.voting_type === "roster" ? "Squad Vote" : "Open Vote"}
                  </span>
                  <Link
                    href={`/signup?next=/form/create?template=${t.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white group/btn bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Use Template
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Faux Product Mockup - Apple/Nothing style floating glass UI */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 relative w-full max-w-4xl mx-auto perspective-[2000px] pointer-events-none"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10 top-1/2" />
          
          <motion.div 
            animate={{ 
              y: [0, -15, 0],
              rotateX: [10, 12, 10],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-full max-w-lg mx-auto glass-panel rounded-[2rem] border border-[#262626] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative overflow-hidden bg-[#0A0A0A]/95"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Mockup Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center border border-[#262626]">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="h-3 w-32 bg-white/90 rounded-full mb-2" />
                  <div className="h-2 w-20 bg-white/40 rounded-full" />
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-[#34A853]/10 border border-[#34A853]/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] pulse-live" />
                <span className="text-[9px] font-bold text-[#34A853] uppercase tracking-wider">Live</span>
              </div>
            </div>

            {/* Mockup Body */}
            <div className="space-y-4 mb-8">
              <div className="h-4 w-48 bg-white/80 rounded-full mb-6" />
              {[
                { w: "w-[80%]", active: false }, 
                { w: "w-[60%]", active: true }, 
                { w: "w-[75%]", active: false }
              ].map((item, i) => (
                <div key={i} className={`h-14 w-full rounded-2xl border flex items-center px-5 justify-between transition-colors ${item.active ? 'bg-white border-white' : 'bg-[#050505] border-[#262626]'}`}>
                  <div className={`h-2.5 ${item.w} rounded-full ${item.active ? 'bg-black' : 'bg-[#333]'}`} />
                  <div className={`h-5 w-5 rounded-full border-[1.5px] ${item.active ? 'border-black bg-black' : 'border-[#333]'}`} />
                </div>
              ))}
            </div>

            {/* Mockup Footer */}
            <div className="h-14 w-full rounded-2xl bg-[#1A1A1A] flex items-center justify-center">
              <div className="h-2.5 w-24 bg-white/30 rounded-full" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ EDITORIAL STORY ══════════ */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-5 pb-32 md:pb-48 space-y-32 md:space-y-56 mt-20">
        
        {/* Story 1 */}
        <FadeUp>
          <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-center">
            <div className="flex-1 space-y-8 order-2 md:order-1">
              <div className="w-12 h-12 rounded-2xl border border-[#262626] bg-[#0A0A0A] flex items-center justify-center text-white shadow-xl">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]" style={{ fontFamily: "var(--font-display, var(--font-sans))" }}>
                Zero <br/> onboarding.
              </h2>
              <p className="text-[#A1A1A1] text-lg md:text-xl leading-relaxed max-w-md font-medium">
                Your friends don't want to create another account just to answer a question. With eZForms, they open a link, pick their name, and vote in seconds.
              </p>
            </div>
            <div className="flex-1 order-1 md:order-2 w-full">
              <div className="aspect-square rounded-[2.5rem] bg-gradient-to-br from-[#111] to-[#050505] border border-[#1A1A1A] p-8 md:p-12 flex flex-col justify-center shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
                <div className="space-y-4">
                  <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-[#262626]">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#222]" /><div className="w-24 h-2 bg-white/80 rounded-full" /></div>
                    <span className="text-xs font-medium px-2 py-1 bg-white text-black rounded-md">Voted</span>
                  </div>
                  <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-[#262626]">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#222]" /><div className="w-32 h-2 bg-white/80 rounded-full" /></div>
                    <span className="text-xs font-medium px-2 py-1 bg-[#1A1A1A] text-[#A1A1A1] rounded-md">Pending</span>
                  </div>
                  <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-[#262626]">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#222]" /><div className="w-20 h-2 bg-white/80 rounded-full" /></div>
                    <span className="text-xs font-medium px-2 py-1 bg-[#1A1A1A] text-[#A1A1A1] rounded-md">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Story 2 */}
        <FadeUp>
          <div className="flex flex-col md:flex-row-reverse gap-12 md:gap-24 items-center">
            <div className="flex-1 space-y-8 order-2 md:order-1">
              <div className="w-12 h-12 rounded-2xl border border-[#262626] bg-[#0A0A0A] flex items-center justify-center text-white shadow-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]" style={{ fontFamily: "var(--font-display, var(--font-sans))" }}>
                Results <br/> in real-time.
              </h2>
              <p className="text-[#A1A1A1] text-lg md:text-xl leading-relaxed max-w-md font-medium">
                Don't wait until the end to see who's winning. Watch the charts update instantly as every single vote drops into the database.
              </p>
            </div>
            <div className="flex-1 order-1 md:order-2 w-full">
              <div className="aspect-square rounded-[2.5rem] bg-gradient-to-tr from-[#050505] to-[#111] border border-[#1A1A1A] p-8 md:p-12 flex flex-col justify-end shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
                <div className="flex items-end justify-between gap-4 h-64 border-b border-[#222] pb-1">
                  {[40, 85, 30, 60, 20].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className={`w-full rounded-t-xl ${i === 1 ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-[#222]'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeUp>

      </section>

      {/* ══════════ BOTTOM CTA ══════════ */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-5 pb-32 md:pb-48">
        <FadeUp>
          <div className="glass-panel rounded-[2.5rem] p-12 md:p-20 flex flex-col items-center text-center relative overflow-hidden shadow-2xl">
            {/* Inner subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-white/5 blur-[80px] pointer-events-none" />
            
            <h2
              className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 relative z-10"
              style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
            >
              Start asking.
            </h2>
            <p className="text-[#A1A1A1] text-lg mb-10 max-w-md font-medium relative z-10">
              End the guesswork. Create your room and watch the answers roll in.
            </p>
            <Link
              href="/signup"
              className="btn-obsidian-primary inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-[15px] font-bold shadow-[0_0_40px_rgba(255,255,255,0.1)] relative z-10"
              style={{ transition: "transform 0.2s cubic-bezier(0.33,1,0.68,1), box-shadow 0.2s ease" }}
            >
              Create your room
            </Link>
          </div>
        </FadeUp>
      </section>

      <Footer />
    </div>
  );
}
