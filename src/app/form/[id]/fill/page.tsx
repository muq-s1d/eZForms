"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { FadeInUp } from "@/components/animations/motion-wrapper";
import {
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  PartyPopper,
  User,
  Lock,
} from "lucide-react";
import type { Form, Participant, Question } from "@/lib/types/database";
import Link from "next/link";

type FillStage = "loading" | "password" | "identity" | "voting" | "submitted" | "already-submitted" | "error";

export default function FillFormPage() {
  const params = useParams();
  const formId = params.id as string;

  const [stage, setStage] = useState<FillStage>("loading");
  const [error, setError] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [identity, setIdentity] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); 
  const [submitting, setSubmitting] = useState(false);
  
  // Password state
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const loadForm = useCallback(async () => {

    const supabase = createClient();

    const [formRes, partRes, qRes] = await Promise.all([
      supabase.from("forms").select("*").eq("id", formId).single(),
      supabase.from("participants").select("*").eq("form_id", formId),
      supabase
        .from("questions")
        .select("*")
        .eq("form_id", formId)
        .order("sort_order"),
    ]);

    if (formRes.error || !formRes.data) {
      setError("Form not found.");
      setStage("error");
      return;
    }

    if (!formRes.data.is_active) {
      setError("This form is no longer accepting responses.");
      setStage("error");
      return;
    }

    setForm(formRes.data);
    setParticipants(partRes.data || []);
    setQuestions(qRes.data || []);

    // Check if password protected
    if (formRes.data.password && formRes.data.password.trim() !== "") {
      const storedAuth = sessionStorage.getItem(`ezforms-auth-${formId}`);
      if (storedAuth === "true") {
        setStage("identity");
      } else {
        setStage("password");
      }
    } else {
      setStage("identity");
    }
  }, [formId]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (passwordInput === form?.password) {
      sessionStorage.setItem(`ezforms-auth-${formId}`, "true");
      setStage("identity");
    } else {
      setPasswordInput("");
      setPasswordError("Incorrect password");
    }
  };

  const answerOptions = participants.filter((p) => p.name !== identity);

  const selectAnswer = (questionId: string, participantId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: participantId }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const supabase = createClient();

      const { data: response, error: respError } = await supabase
        .from("responses")
        .insert({
          form_id: formId,
          responder_name: identity!,
        })
        .select()
        .single();

      if (respError || !response) {
        setError("Failed to submit. Please try again.");
        setSubmitting(false);
        return;
      }

      const answerInserts = Object.entries(answers).map(
        ([questionId, participantId]) => ({
          response_id: response.id,
          question_id: questionId,
          selected_participant_id: participantId,
        })
      );

      const { error: ansError } = await supabase
        .from("answers")
        .insert(answerInserts);

      if (ansError) {
        setError("Failed to save answers. Please try again.");
        setSubmitting(false);
        return;
      }

      // Mark the participant as having voted
      const participantId = participants.find(p => p.name === identity)?.id;
      if (participantId) {
        await supabase
          .from("participants")
          .update({ has_voted: true })
          .eq("id", participantId);
      }

      setStage("submitted");
    } catch {
      setError("Something went wrong.");
      setSubmitting(false);
    }
  };

  // ===== LOADING =====
  if (stage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"
        />
      </div>
    );
  }

  // ===== ERROR =====
  if (stage === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <FadeInUp>
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold mb-2">Oops</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-6" render={<Link href="/" />}>
              Go home
            </Button>
          </div>
        </FadeInUp>
      </div>
    );
  }



  // ===== PASSWORD GATE =====
  if (stage === "password") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative text-white">
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-[#1A1A1A] transition-all z-10 hover:border-[#333]">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <div className="w-full max-w-sm">
          <FadeInUp>
            <div className="glass-panel rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-6">
                <Lock className="w-6 h-6 text-foreground" />
              </div>
              <h1 className="text-xl font-bold text-center mb-2">{form?.title}</h1>
              <p className="text-sm text-center text-muted-foreground mb-6">
                This form is password protected.
              </p>
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4">
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="minimal-input w-full rounded-xl px-4 py-3 text-sm text-center h-12"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-sm text-[#EA4335] text-center">{passwordError}</p>
                  )}
                  <button type="submit" className="w-full h-12 rounded-xl text-sm font-semibold btn-obsidian-primary">
                    Unlock Form
                  </button>
                </div>
              </form>
            </div>
          </FadeInUp>
        </div>
      </div>
    );
  }

  // ===== SUBMITTED SUCCESS =====
  if (stage === "submitted") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 text-white">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel rounded-2xl p-10 text-center max-w-md w-full mx-auto relative overflow-hidden"
        >
          {/* Ambient glow in the background of the card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-white/[0.03] blur-3xl pointer-events-none" />
          
          <motion.div
            className="w-16 h-16 rounded-2xl border border-[#1A1A1A] bg-[#050505] flex items-center justify-center mx-auto mb-6 relative z-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          >
            <Check className="w-8 h-8 text-[#34A853]" />
          </motion.div>
          
          <h1 className="text-2xl font-bold mb-3 tracking-tight" style={{ fontFamily: "var(--font-display, var(--font-sans))" }}>
            Vote submitted
          </h1>
          <p className="text-sm text-[#A1A1A1] mb-8">
            Your votes have been recorded anonymously. 
            Now it's your turn to start a room.
          </p>
          
          <div className="flex flex-col gap-3 relative z-10">
            <Link
              href="/signup"
              className="w-full py-3.5 rounded-xl text-sm font-semibold btn-obsidian-primary"
            >
              Create your own form
            </Link>
            <Link
              href={`/form/${formId}/results`}
              className="w-full py-3.5 rounded-xl text-sm font-semibold btn-obsidian-ghost"
            >
              View live results
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===== IDENTITY SELECTION =====
  if (stage === "identity") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 text-white">
        <div className="w-full max-w-md">
          <FadeInUp>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl border border-[#1A1A1A] bg-[#050505] flex items-center justify-center mx-auto mb-4">
                <Zap className="w-5 h-5 text-[#A1A1A1]" />
              </div>
              <h1 className="text-2xl font-bold mb-2 tracking-tight" style={{ fontFamily: "var(--font-display, var(--font-sans))" }}>{form?.title}</h1>
              {form?.description && (
                <p className="text-sm text-[#A1A1A1]">{form.description}</p>
              )}
            </div>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-white" />
                <h2 className="font-semibold text-sm">Who are you?</h2>
              </div>
              <p className="text-xs text-[#A1A1A1] mb-5">
                Pick your name below. You won&apos;t be able to vote for yourself.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {participants.map((p) => (
                  <motion.button
                    key={p.id}
                    whileHover={!p.has_voted ? { scale: 1.02 } : {}}
                    whileTap={!p.has_voted ? { scale: 0.98 } : {}}
                    onClick={() => { if (!p.has_voted) setIdentity(p.name); }}
                    disabled={p.has_voted}
                    className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 text-left border ${
                      p.has_voted
                        ? "bg-[#0A0A0A] text-[#444748] border-[#1A1A1A] cursor-not-allowed opacity-60"
                        : identity === p.name
                        ? "bg-white text-black border-white"
                        : "bg-[#050505] text-[#A1A1A1] border-[#1A1A1A] hover:border-[#333] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{p.name}</span>
                      {p.has_voted && <Lock className="w-3.5 h-3.5 shrink-0 opacity-50" />}
                    </div>
                  </motion.button>
                ))}
              </div>

              {identity && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <button
                    onClick={() => {
                      setStage("voting");
                      setCurrentQ(0);
                    }}
                    className="w-full h-11 rounded-xl text-sm font-semibold btn-obsidian-primary flex items-center justify-center"
                  >
                    Start voting
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </motion.div>
              )}
            </div>
          </FadeInUp>
        </div>
      </div>
    );
  }

  // ===== VOTING =====
  const currentQuestion = questions[currentQ];
  const isLastQuestion = currentQ === questions.length - 1;
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const allAnswered = questions.every((q) => answers[q.id]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 text-white">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-[#A1A1A1] mb-3">
            <span>
              Question {currentQ + 1} of {questions.length}
            </span>
            <span className="px-2 py-1 rounded-md bg-[#1A1A1A] text-[10px] text-white">
              Voting as {identity}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[#1A1A1A] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white"
              animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="glass-panel rounded-2xl p-8"
          >
            <h2 className="text-lg font-bold mb-6">{currentQuestion?.question_text}</h2>

            {/* Answer Options (self excluded) */}
            <div className="space-y-2">
              {answerOptions.map((p) => {
                const isSelected = selectedAnswer === p.id;
                return (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => currentQuestion && selectAnswer(currentQuestion.id, p.id)}
                    className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all duration-200 flex items-center justify-between border ${
                      isSelected
                        ? "bg-white text-black border-white"
                        : "bg-[#050505] text-[#A1A1A1] border-[#1A1A1A] hover:border-[#333] hover:text-white"
                    }`}
                  >
                    <span>{p.name}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </motion.button>
                );
              })}
            </div>

            {error && (
              <p className="text-sm text-destructive mt-3">{error}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              currentQ === 0 ? "text-[#444748] cursor-not-allowed" : "text-[#A1A1A1] hover:text-white"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                !allAnswered || submitting ? "bg-[#1A1A1A] text-[#444748] cursor-not-allowed" : "btn-obsidian-primary"
              }`}
            >
              {submitting ? (
                <motion.div
                  className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"
                />
              ) : (
                <>
                  Submit votes
                  <Check className="w-4 h-4 ml-2" />
                </>
              )}
              </button>
          ) : (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              disabled={!selectedAnswer}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                !selectedAnswer ? "bg-[#1A1A1A] text-[#444748] cursor-not-allowed" : "btn-obsidian-ghost"
              }`}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
