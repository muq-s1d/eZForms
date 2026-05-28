"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Users, Lock, BarChart3, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

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
  // Removed mouse-tracking mesh gradient as requested
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  useMagnet(primaryBtnRef);

  return (
    <div className="flex flex-col min-h-screen text-white overflow-x-hidden">

      <Navbar />

      {/* ══════════ HERO ══════════ */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-5 pt-44 pb-32 max-w-5xl mx-auto w-full">
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <Link
            href="/home"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1A1A1A] bg-[#0A0A0A]/70 backdrop-blur-sm hover:border-[#333] transition-colors duration-300"
          >
            <span className="w-2 h-2 rounded-full bg-[#34A853] pulse-live inline-block" />
            <span className="text-xs font-medium text-[#A1A1A1] tracking-wide">
              Live forms happening right now
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#A1A1A1]" />
          </Link>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl lg:text-[76px] font-extrabold tracking-[-0.04em] leading-[1.08] mb-6"
          style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
        >
          Opinions,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#A1A1A1]">
            elevated.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg text-[#A1A1A1] max-w-xl leading-relaxed mb-10"
        >
          Anonymous &ldquo;most likely to&rdquo; voting for your friend group.
          Create a form, set a password, share the link. No accounts needed for voters.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <button
            ref={primaryBtnRef}
            className="glowing-pill inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold"
            onClick={() => window.location.href = "/signup"}
            style={{ transition: "transform 0.2s cubic-bezier(0.33,1,0.68,1)" }}
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            href="/home"
            className="btn-obsidian-ghost inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-medium"
          >
            Explore live forms
          </Link>
        </motion.div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-5 pb-28">
        <FadeUp className="mb-12 text-center">
          <p className="text-xs font-semibold tracking-widest text-[#444748] uppercase mb-3">
            Built for friend groups
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white"
            style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
          >
            Everything you need, nothing you don&apos;t
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.08}>
              <div className="glass-panel rounded-xl p-6 group hover:border-[#333] transition-colors duration-300 relative overflow-hidden">
                {/* Ambient bloom on hover */}
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/0 group-hover:bg-white/[0.03] blur-2xl transition-colors duration-500 pointer-events-none" />
                <div className="w-9 h-9 rounded-lg border border-[#1A1A1A] bg-[#050505] flex items-center justify-center text-[#A1A1A1] mb-4 group-hover:text-white group-hover:border-[#333] transition-colors duration-200">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white text-[15px] mb-2">{f.title}</h3>
                <p className="text-sm text-[#A1A1A1] leading-relaxed">{f.body}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ══════════ BOTTOM CTA ══════════ */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-5 pb-32">
        <FadeUp>
          <div className="glass-panel rounded-2xl p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(66,133,244,0.05)_0%,_transparent_70%)] pointer-events-none" />
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white mb-4 relative z-10"
              style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
            >
              Ready to find out what your friends really think?
            </h2>
            <p className="text-[#A1A1A1] mb-8 relative z-10">
              Free to use. No card required. Takes 2 minutes to set up.
            </p>
            <Link
              href="/signup"
              className="glowing-pill inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold relative z-10"
            >
              Create your first form
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeUp>
      </section>

      <Footer />
    </div>
  );
}
