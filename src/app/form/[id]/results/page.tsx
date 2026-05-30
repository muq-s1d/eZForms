"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/navbar";
import {
  BarChart3,
  Users,
  Trophy,
  Copy,
  Check,
  ArrowLeft,
  Lock,
  PieChart as PieChartIcon,
  Share2,
  Zap,
} from "lucide-react";
import type { Form, Participant, Question } from "@/lib/types/database";
import Link from "next/link";
import { DonutChart } from "@/components/ui/donut-chart";
import { usePostHog } from 'posthog-js/react';

interface VoteCount {
  participant_id: string;
  participant_name: string;
  count: number;
}

interface QuestionResults {
  question: Question;
  votes: VoteCount[];
  total: number;
}

type Stage = "loading" | "private" | "password" | "results" | "error";

const displayFont = { fontFamily: "var(--font-display, var(--font-sans))" };

const ACCENT_COLORS = [
  "#4285F4",
  "#EA4335",
  "#FBBC05",
  "#34A853",
  "#9C27B0",
  "#FF9800",
  "#00BCD4",
  "#E91E63",
];

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const posthog = usePostHog();

  const [stage, setStage] = useState<Stage>("loading");
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questionResults, setQuestionResults] = useState<QuestionResults[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [copied, setCopied] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchResults = useCallback(async () => {
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) setUser({ id: currentUser.id, email: currentUser.email || "" });

    const { data: formData } = await supabase.from("forms").select("*").eq("id", formId).single();
    if (!formData) { setError("Form not found."); setStage("error"); return; }
    setForm(formData);

    const isCreator = currentUser && currentUser.id === formData.creator_id;
    if (!isCreator) {
      if (!formData.is_public_results) { setStage("private"); return; }
      if (formData.password) {
        const storedAuth = localStorage.getItem(`ezforms-auth-${formId}`);
        if (storedAuth !== "true") { setStage("password"); return; }
      }
    }

    const { data: parts } = await supabase.from("participants").select("*").eq("form_id", formId);
    setParticipants(parts || []);

    const { data: questions } = await supabase
      .from("questions").select("*").eq("form_id", formId).order("sort_order");

    const { count: respCount } = await supabase
      .from("responses").select("id", { count: "exact", head: true }).eq("form_id", formId);
    setTotalResponses(respCount || 0);

    const { data: answers } = await supabase
      .from("answers")
      .select("question_id, selected_participant_id")
      .in("question_id", (questions || []).map((q: Question) => q.id));

    const results: QuestionResults[] = (questions || []).map((q: Question) => {
      const qAnswers = (answers || []).filter(
        (a: { question_id: string; selected_participant_id: string }) => a.question_id === q.id
      );
      const voteCounts = new Map<string, number>();
      qAnswers.forEach((a: { question_id: string; selected_participant_id: string }) => {
        voteCounts.set(a.selected_participant_id, (voteCounts.get(a.selected_participant_id) || 0) + 1);
      });
      const votes: VoteCount[] = (parts || [])
        .map((p: Participant) => ({
          participant_id: p.id,
          participant_name: p.name,
          count: voteCounts.get(p.id) || 0,
        }))
        .sort((a: VoteCount, b: VoteCount) => b.count - a.count);
      return { question: q, votes, total: qAnswers.length };
    });

    setQuestionResults(results);
    setStage("results");
  }, [formId]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  useEffect(() => {
    if (stage === "results" && form) {
      posthog?.capture('results_viewed', { 
        form_id: form.id, 
        form_title: form.title, 
        voting_type: form.voting_type 
      });
    }
  }, [stage, form, posthog]);

  useEffect(() => {
    if (stage !== "results") return;
    const supabase = createClient();
    const channel = supabase
      .channel(`results-${formId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "responses", filter: `form_id=eq.${formId}` }, () => fetchResults())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "answers" }, () => fetchResults())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [formId, fetchResults, stage]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (passwordInput === form?.password) {
      localStorage.setItem(`ezforms-auth-${formId}`, "true");
      fetchResults();
    } else {
      setPasswordError("Incorrect password");
      setPasswordInput("");
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/form/${formId}/fill`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Loading ── */
  if (stage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Error ── */
  if (stage === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white px-5">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4">Form not found</h1>
          <Link href="/dashboard" className="btn-obsidian-ghost px-5 py-2.5 rounded-lg text-sm inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ── Private ── */
  if (stage === "private") {
    return (
      <div className="min-h-screen flex flex-col text-white">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-1 flex items-center justify-center px-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel rounded-2xl p-10 text-center max-w-sm w-full"
          >
            <div className="w-12 h-12 rounded-xl border border-[#1A1A1A] bg-[#050505] flex items-center justify-center mx-auto mb-5">
              <Lock className="w-5 h-5 text-[#A1A1A1]" />
            </div>
            <h1 className="text-xl font-bold mb-2">Results are private</h1>
            <p className="text-sm text-[#A1A1A1] mb-7">
              The creator of this form has kept the results private.
            </p>
            <Link href="/" className="btn-obsidian-ghost px-5 py-2.5 rounded-lg text-sm inline-block">
              Go home
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  /* ── Password gate ── */
  if (stage === "password") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel rounded-2xl p-8 w-full max-w-sm"
        >
          <div className="w-12 h-12 rounded-xl border border-[#1A1A1A] bg-[#050505] flex items-center justify-center mx-auto mb-5">
            <Lock className="w-5 h-5 text-[#A1A1A1]" />
          </div>
          <h1 className="text-xl font-bold text-center mb-1">{form?.title}</h1>
          <p className="text-sm text-center text-[#A1A1A1] mb-7">
            Enter the password to view results.
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="minimal-input w-full rounded-xl px-4 py-3 text-sm text-center"
              autoFocus
            />
            {passwordError && (
              <p className="text-sm text-[#EA4335] text-center">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-semibold btn-obsidian-primary"
            >
              Unlock Results
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  /* ── Results ── */
  return (
    <div className="min-h-screen flex flex-col text-white">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-1 pt-[100px] pb-16 px-5 max-w-4xl mx-auto w-full">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 pb-6 border-b border-[#1A1A1A]"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-[#A1A1A1] hover:text-white transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div>
              <h1
                className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-white mb-3"
                style={displayFont}
              >
                {form?.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#A1A1A1]">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {participants.length} participants
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4" />
                  {totalResponses} responses
                </span>
                {form?.is_active ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border bg-[#34A853]/10 text-[#34A853] border-[#34A853]/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] pulse-live" />
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border bg-white/5 text-[#A1A1A1] border-[#1A1A1A]">
                    Finished
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Chart type toggle */}
              <div className="flex items-center p-1 rounded-lg border border-[#1A1A1A] bg-[#0A0A0A]">
                <button
                  onClick={() => setChartType("bar")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    chartType === "bar"
                      ? "bg-[#1A1A1A] text-white"
                      : "text-[#A1A1A1] hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartType("pie")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    chartType === "pie"
                      ? "bg-[#1A1A1A] text-white"
                      : "text-[#A1A1A1] hover:text-white"
                  }`}
                >
                  <PieChartIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Share */}
              <button
                onClick={copyShareLink}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1A1A1A] text-sm text-[#A1A1A1] hover:text-white hover:border-[#333] hover:bg-white/5 transition-all duration-200"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-[#34A853]" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── No votes ── */}
        {totalResponses === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-panel rounded-2xl p-12 text-center"
          >
            <div className="w-14 h-14 rounded-xl border border-[#1A1A1A] bg-[#050505] flex items-center justify-center mx-auto mb-5">
              <BarChart3 className="w-6 h-6 text-[#A1A1A1]" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No votes yet</h2>
            <p className="text-sm text-[#A1A1A1] mb-7 max-w-xs mx-auto">
              Share the link with your friends to start collecting votes.
            </p>
            <button
              onClick={copyShareLink}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold btn-obsidian-primary"
            >
              <Copy className="w-4 h-4" />
              Copy share link
            </button>
          </motion.div>
        ) : (
          <div className="space-y-5">
            {questionResults.map((qr, qi) => {
              const winner = qr.votes[0];
              const hasWinner = winner && winner.count > 0;
              const winnerColor = ACCENT_COLORS[0];

              return (
                <motion.div
                  key={qr.question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: qi * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="glass-panel rounded-xl p-6 sm:p-8"
                >
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <h2
                      className="font-semibold text-[17px] text-white leading-snug"
                      style={displayFont}
                    >
                      {qr.question.question_text}
                    </h2>
                    <span className="text-xs text-[#A1A1A1] shrink-0 mt-0.5">
                      {qr.total} vote{qr.total !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Leading badge */}
                  {hasWinner && (
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#1A1A1A] bg-[#050505] mb-6"
                    >
                      <Trophy className="w-3.5 h-3.5" style={{ color: winnerColor }} />
                      <span className="text-xs font-semibold tracking-wide" style={{ color: winnerColor }}>
                        {winner.participant_name} is leading
                      </span>
                    </div>
                  )}

                  {/* Chart */}
                  {chartType === "bar" ? (
                    <div className="space-y-4">
                      {qr.votes.map((vote, vi) => {
                        const pct = qr.total > 0 ? Math.round((vote.count / qr.total) * 100) : 0;
                        const isWinner = vi === 0 && vote.count > 0;
                        const color = ACCENT_COLORS[vi % ACCENT_COLORS.length];

                        return (
                          <div key={vote.participant_id}>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="flex items-center gap-2 font-medium text-white">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: color,
                                    opacity: vote.count === 0 ? 0.3 : 1,
                                  }}
                                />
                                {vote.participant_name}
                              </span>
                              <span className="text-[#A1A1A1] text-xs">
                                {pct}% ({vote.count})
                              </span>
                            </div>
                            <div className="h-4 rounded-sm bg-[#0A0A0A] border border-[#1A1A1A] overflow-hidden relative">
                              <motion.div
                                className="h-full rounded-sm relative"
                                style={{
                                  backgroundColor: color,
                                  opacity: vote.count === 0 ? 0.15 : 1,
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{
                                  duration: 0.85,
                                  delay: qi * 0.1 + vi * 0.06,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                              />
                              {isWinner && vote.count > 0 && (
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-black uppercase tracking-widest">
                                  Winner
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="w-full mt-2">
                      <DonutChart
                        data={qr.votes.filter(v => v.count > 0).map((v, i) => ({
                          name: v.participant_name,
                          value: v.count,
                          color: ACCENT_COLORS[i % ACCENT_COLORS.length],
                        }))}
                        total={qr.total}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Viral Conversion CTA for non-creators */}
        {user?.id !== form?.creator_id && (
          <div className="mt-12 mb-16 text-center w-full max-w-3xl mx-auto">
            <button 
              onClick={() => {
                posthog?.capture('viral_conversion_clicked', {
                  source_form_id: form?.id,
                  cta_location: 'results_bottom'
                });
                setTimeout(() => router.push("/signup"), 400);
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl btn-obsidian-primary text-sm font-semibold shadow-2xl shadow-[#34A853]/10 border border-[#34A853]/20 hover:border-[#34A853]/40 transition-colors"
            >
              <Zap className="w-4 h-4 text-[#34A853]" />
              Create your own form — It's free
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
