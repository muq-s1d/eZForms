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
    // Check for prior submission
    const submissionKey = `ezforms-submitted-${formId}`;
    if (typeof window !== "undefined" && localStorage.getItem(submissionKey)) {
      setStage("already-submitted");
      return;
    }

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

      localStorage.setItem(`ezforms-submitted-${formId}`, "true");
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

  // ===== ALREADY SUBMITTED =====
  if (stage === "already-submitted") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <FadeInUp>
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-xl font-bold mb-2">Already voted!</h1>
            <p className="text-sm text-muted-foreground">
              You&apos;ve already submitted your responses for this form. Thanks for voting!
            </p>
          </div>
        </FadeInUp>
      </div>
    );
  }

  // ===== PASSWORD GATE =====
  if (stage === "password") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background relative">
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground px-4 py-2 rounded-full border border-border/50 shadow-sm transition-all z-10 hover:shadow-md hover:border-border">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <div className="w-full max-w-sm">
          <FadeInUp>
            <div className="glass rounded-xl p-8 border border-border">
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
                    className="text-center bg-secondary/50 h-12"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive text-center">{passwordError}</p>
                  )}
                  <Button type="submit" className="w-full h-12">
                    Unlock Form
                  </Button>
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
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <FadeInUp>
          <div className="text-center max-w-sm">
            <motion.div
              className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <PartyPopper className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Vote submitted!</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Your anonymous votes have been recorded.
            </p>
            <Button variant="outline" render={<Link href={`/form/${formId}/results`} />}>
              View Results
            </Button>
          </div>
        </FadeInUp>
      </div>
    );
  }

  // ===== IDENTITY SELECTION =====
  if (stage === "identity") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-md">
          <FadeInUp>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold mb-1">{form?.title}</h1>
              {form?.description && (
                <p className="text-sm text-muted-foreground">{form.description}</p>
              )}
            </div>
          </FadeInUp>

          <FadeInUp delay={0.1}>
            <div className="glass rounded-xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-foreground" />
                <h2 className="font-semibold text-sm">Who are you?</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Pick your name below. You won&apos;t be able to vote for yourself.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {participants.map((p) => (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIdentity(p.name)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 text-left border ${
                      identity === p.name
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-border hover:border-primary/30"
                    }`}
                  >
                    {p.name}
                  </motion.button>
                ))}
              </div>

              {identity && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <Button
                    onClick={() => {
                      setStage("voting");
                      setCurrentQ(0);
                    }}
                    className="w-full h-11"
                  >
                    Start voting
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>
              Question {currentQ + 1} of {questions.length}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Voting as {identity}
            </Badge>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
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
            className="glass rounded-xl p-6 border border-border"
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
                    className={`w-full p-4 rounded-lg text-left text-sm font-medium transition-all duration-200 flex items-center justify-between border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-border hover:border-primary/30"
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
          <Button
            variant="ghost"
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="px-8"
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
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQ(currentQ + 1)}
              disabled={!selectedAnswer}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
