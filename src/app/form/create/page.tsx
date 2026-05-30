"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Check,
  FileText,
  Users,
  MessageSquare,
  Sparkles,
  Rocket,
  Copy,
  Globe,
  Lock,
  Settings,
  Clock,
  Unlock,
  ChevronRight,
  Search,
} from "lucide-react";
import type { FormStep } from "@/lib/types/database";
import { usePostHog } from 'posthog-js/react';
import { TEMPLATES } from "@/lib/templates";

const displayFont = { fontFamily: "var(--font-display, var(--font-sans))" };

const steps: { key: FormStep; label: string; icon: React.ElementType }[] = [
  { key: "details",      label: "Details",   icon: FileText },
  { key: "participants", label: "People",    icon: Users },
  { key: "questions",    label: "Questions", icon: MessageSquare },
  { key: "review",       label: "Launch",    icon: Rocket },
];

const ACCENT_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853", "#9C27B0", "#FF9800"];

function CreateFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const [currentStep, setCurrentStep] = useState<FormStep>("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdFormId, setCreatedFormId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  // Form state
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [isPublicResults, setIsPublicResults] = useState(false);
  const [votingType, setVotingType] = useState<"roster" | "general">("roster");
  const [timerDuration, setTimerDuration] = useState<number | null>(null);
  const [isTimerScrolledToEnd, setIsTimerScrolledToEnd] = useState(false);
  const [isPublicFeed, setIsPublicFeed] = useState(true);

  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [questionInput, setQuestionInput] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) setUser({ email: currentUser.email || "" });
    }
    getUser();

    // Template initialization
    const templateId = searchParams.get("template");
    if (templateId) {
      const template = TEMPLATES.find(t => t.id === templateId);
      if (template) {
        setTitle(template.title);
        setDescription(template.description);
        setVotingType(template.voting_type);
        setQuestions([...template.questions]);
      }
    }
  }, [searchParams]);

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
  const progressPct = (currentStepIndex / (steps.length - 1)) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case "details":      return title.trim().length > 0 && (votingType === "roster" ? password.trim().length > 0 : true);
      case "participants": return participants.length >= 2;
      case "questions":    return questions.length >= 1;
      case "review":       return true;
      default:             return false;
    }
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) setCurrentStep(steps[nextIndex].key);
  };
  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) setCurrentStep(steps[prevIndex].key);
  };

  const addParticipant = () => {
    const name = participantInput.trim();
    if (name && !participants.includes(name)) {
      setParticipants([...participants, name]);
      setParticipantInput("");
    }
  };
  const removeParticipant = (name: string) => setParticipants(participants.filter((p) => p !== name));

  const addQuestion = () => {
    const text = questionInput.trim();
    if (text && !questions.includes(text)) {
      setQuestions([...questions, text]);
      setQuestionInput("");
    }
  };
  const removeQuestion = (text: string) => setQuestions(questions.filter((q) => q !== text));

  const handlePublish = async () => {
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setError("You must be logged in to create a form."); return; }

      const { data: form, error: formError } = await supabase
        .from("forms")
        .insert({
          creator_id: authUser.id,
          title,
          description: description || null,
          is_active: true,
          is_public_results: isPublicResults,
          voting_type: votingType,
          is_public_feed: isPublicFeed,
          password: password.trim() || null,
          expires_at: timerDuration 
            ? new Date(Date.now() + timerDuration * 60 * 60 * 1000).toISOString() 
            : null,
        })
        .select()
        .single();

      if (formError || !form) { setError(formError?.message || "Failed to create form."); return; }

      const { error: partError } = await supabase.from("participants").insert(
        participants.map((name) => ({ form_id: form.id, name }))
      );
      if (partError) { setError("Failed to add participants: " + partError.message); return; }

      const { error: qError } = await supabase.from("questions").insert(
        questions.map((text, i) => ({ form_id: form.id, question_text: text, sort_order: i }))
      );
      if (qError) { setError("Failed to add questions: " + qError.message); return; }

      posthog?.capture('form_created', { 
        form_id: form.id, 
        voting_type: votingType, 
        participant_count: participants.length,
        question_count: questions.length 
      });

      setCreatedFormId(form.id);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    if (createdFormId) {
      navigator.clipboard.writeText(`${window.location.origin}/form/${createdFormId}/fill`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ── Success screen ── */
  if (createdFormId) {
    return (
      <div className="min-h-screen flex flex-col text-white">
        <Navbar user={user} />
        <main className="flex-1 flex items-center justify-center px-5 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-md w-full"
          >
            <motion.div
              className="w-20 h-20 rounded-full bg-[#34A853]/15 border border-[#34A853]/30 flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, delay: 0.15 }}
            >
              <Check className="w-9 h-9 text-[#34A853]" />
            </motion.div>

            <h1
              className="text-3xl font-extrabold tracking-tight mb-2"
              style={displayFont}
            >
              Form is live! 🎉
            </h1>
            <p className="text-[#A1A1A1] text-sm mb-8">
              Share this link with your friends and watch the votes roll in.
            </p>

            <div className="glass-panel rounded-xl p-4 flex items-center gap-3 mb-5">
              <code className="text-xs text-[#A1A1A1] flex-1 truncate">
                {window.location.origin}/form/{createdFormId}/fill
              </code>
              <button
                onClick={copyShareLink}
                className="shrink-0 p-2 rounded-lg border border-[#1A1A1A] hover:border-[#333] hover:bg-white/5 text-[#A1A1A1] hover:text-white transition-all duration-200"
              >
                {copied ? <Check className="w-4 h-4 text-[#34A853]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-3">
              <a
                href={`/form/${createdFormId}/results`}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center btn-obsidian-ghost"
              >
                View Results
              </a>
              <a
                href="/dashboard"
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center btn-obsidian-primary"
              >
                Dashboard
              </a>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  const selectedTemplate = TEMPLATES.find((t) => t.title === title);
  const filteredTemplates = TEMPLATES.filter(t => t.title.toLowerCase().includes(templateSearchQuery.toLowerCase()));

  /* ── Main form ── */
  return (
    <div className="min-h-screen flex flex-col text-white overflow-hidden relative">
      <Navbar user={user} />

      <main className="flex-1 pt-[100px] pb-16 px-5">
        <motion.div layout className="max-w-xl mx-auto w-full mb-10 relative">
          {/* Connecting line track */}
            <div className="absolute top-[22px] left-[10%] right-[10%] h-[2px] bg-[#1A1A1A] rounded-full z-0" />
            {/* Animated fill */}
            <motion.div
              className="absolute top-[22px] left-[10%] h-[2px] rounded-full z-0"
              style={{
                background: "#ffffff",
                boxShadow: "0 0 8px rgba(255,255,255,0.4)",
                width: `${progressPct * 0.8}%`,
              }}
              animate={{ width: `${progressPct * 0.8}%` }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />

            <div className="flex justify-between items-start relative z-10 px-[10%]">
              {steps.map((step, i) => {
                const isActive = i === currentStepIndex;
                const isCompleted = i < currentStepIndex;
                return (
                  <button
                    key={step.key}
                    onClick={() => { if (i < currentStepIndex) setCurrentStep(step.key); }}
                    className="flex flex-col items-center gap-2"
                  >
                    <motion.div
                      animate={{
                        backgroundColor: isCompleted
                          ? "#34A853"
                          : isActive
                          ? "#ffffff"
                          : "#0A0A0A",
                        borderColor: isCompleted
                          ? "#34A853"
                          : isActive
                          ? "#ffffff"
                          : "#1A1A1A",
                        color: isCompleted || isActive ? "#050505" : "#A1A1A1",
                      }}
                      transition={{ duration: 0.3 }}
                      className="w-11 h-11 rounded-xl border flex items-center justify-center"
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </motion.div>
                    <span
                      className={`text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                        isActive ? "text-white" : "text-[#444748]"
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
        </motion.div>

        <motion.div layout className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 items-start justify-center">
          <motion.div layout className="w-full max-w-xl shrink-0">
          {/* ── Step Content — horizontal slide ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel rounded-2xl p-7 sm:p-8"
            >

              {/* ── DETAILS ── */}
              {currentStep === "details" && (
                <div className="space-y-6">
                  <div className="mb-6 space-y-4 pb-6 border-b border-[#1A1A1A]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="text-sm font-medium text-white block">Start from a Template</label>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A1A1A1]" />
                        <input
                          type="text"
                          placeholder="Search templates..."
                          value={templateSearchQuery}
                          onChange={(e) => setTemplateSearchQuery(e.target.value)}
                          className="w-full bg-[#050505] border border-[#1A1A1A] rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#333] transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <button
                        onClick={() => {
                          setTitle("");
                          setDescription("");
                          setQuestions([]);
                        }}
                        className={`shrink-0 w-36 p-4 rounded-xl text-left border transition-all ${
                          !title && questions.length === 0
                            ? "bg-white text-black border-white shadow-md"
                            : "bg-[#050505] text-[#A1A1A1] border-[#1A1A1A] hover:border-[#333] hover:text-white"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center mb-3">
                           <Plus className={`w-4 h-4 ${!title && questions.length === 0 ? "text-white" : "text-[#A1A1A1]"}`} />
                        </div>
                        <h3 className="font-semibold text-sm mb-1">Blank</h3>
                        <p className={`text-xs ${!title && questions.length === 0 ? "text-[#444]" : "text-[#444748]"}`}>Start from scratch</p>
                      </button>
                      
                      {filteredTemplates.length === 0 ? (
                        <div className="shrink-0 w-44 p-4 rounded-xl border border-dashed border-[#1A1A1A] flex items-center justify-center text-center">
                          <p className="text-xs text-[#A1A1A1]">No templates found</p>
                        </div>
                      ) : (
                        filteredTemplates.map((t) => {
                          const isSelected = title === t.title;
                          return (
                            <button
                              key={t.id}
                              onClick={() => {
                                setTitle(t.title);
                                setDescription(t.description);
                                setVotingType(t.voting_type);
                                setQuestions([...t.questions]);
                              }}
                              className={`shrink-0 w-48 p-4 rounded-xl text-left border transition-all relative overflow-hidden group ${
                                isSelected
                                  ? "bg-[#1A1A1A] text-white border-[#333]"
                                  : "bg-[#050505] text-[#A1A1A1] border-[#1A1A1A] hover:border-[#333] hover:text-white"
                              }`}
                            >
                              <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] blur-xl rounded-full pointer-events-none transition-colors group-hover:bg-white/[0.05]" />
                              <div className="flex items-start justify-end mb-2">
                                <span className="text-[9px] uppercase tracking-wider font-bold text-[#444748]">
                                  {t.voting_type === "roster" ? "Squad" : "Open"}
                                </span>
                              </div>
                              <h3 className="font-semibold text-sm mb-1 truncate">{t.title}</h3>
                              <p className="text-xs truncate text-[#444748]">{t.questions.length} questions</p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight mb-1" style={displayFont}>
                      Create your form
                    </h2>
                    <p className="text-sm text-[#A1A1A1]">
                      Configure how your form works and give it a fun title.
                    </p>
                  </div>

                  <div className="space-y-3 mb-2">
                    <label className="text-sm font-medium text-white block mb-1">Voting Mode</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setVotingType("roster")}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          votingType === "roster"
                            ? "bg-white text-black border-white shadow-md"
                            : "bg-[#050505] text-[#A1A1A1] border-[#1A1A1A] hover:border-[#333] hover:text-white"
                        }`}
                      >
                        <Lock className="w-5 h-5 mb-3" />
                        <h3 className="font-semibold text-sm mb-1">Squad Vote</h3>
                        <p className={`text-xs ${votingType === "roster" ? "text-[#444]" : "text-[#444748]"}`}>
                          Voters pick their name from a roster.
                        </p>
                      </button>
                      <button
                        onClick={() => setVotingType("general")}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          votingType === "general"
                            ? "bg-white text-black border-white shadow-md"
                            : "bg-[#050505] text-[#A1A1A1] border-[#1A1A1A] hover:border-[#333] hover:text-white"
                        }`}
                      >
                        <Unlock className="w-5 h-5 mb-3" />
                        <h3 className="font-semibold text-sm mb-1">Open Vote</h3>
                        <p className={`text-xs ${votingType === "general" ? "text-[#444]" : "text-[#444748]"}`}>
                          Anyone with the link votes anonymously.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Settings based on Mode */}
                  {votingType === "roster" && (
                    <div className="flex items-center justify-between pb-2">
                      <div>
                        <label className="text-sm font-medium text-white block mb-0.5">List on Public Feed</label>
                        <p className="text-xs text-[#A1A1A1]">Allow anyone on the homepage to discover this form.</p>
                      </div>
                      <button
                        onClick={() => setIsPublicFeed(!isPublicFeed)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${isPublicFeed ? "bg-[#34A853]" : "bg-[#1A1A1A]"}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isPublicFeed ? "left-6" : "left-1"}`} />
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 pb-2">
                    <div>
                      <label className="text-sm font-medium text-white block mb-1">
                        {votingType === "roster" ? "Form Password" : "Password Protect (Optional)"}
                      </label>
                      <p className="text-xs text-[#A1A1A1] mb-2">
                        {votingType === "roster" 
                          ? "Required to access this squad form." 
                          : "Require a password to vote on this open form."}
                      </p>
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="e.g. secret123"
                        className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#333] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pb-2">
                    <label className="text-sm font-medium text-white block mb-1">Time Limit</label>
                    <div className="relative group">
                      <div 
                        className="flex overflow-x-auto snap-x gap-2 pb-3 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        onScroll={(e) => {
                          const target = e.currentTarget;
                          setIsTimerScrolledToEnd(target.scrollLeft + target.clientWidth >= target.scrollWidth - 10);
                        }}
                      >
                        {[
                          { label: "No Limit", value: null },
                          { label: "30m", value: 0.5 },
                          { label: "1h", value: 1 },
                          { label: "2h", value: 2 },
                          { label: "3h", value: 3 },
                          { label: "4h", value: 4 },
                          { label: "5h", value: 5 },
                          { label: "10h", value: 10 },
                          { label: "20h", value: 20 },
                          { label: "24h", value: 24 },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            onClick={() => setTimerDuration(opt.value)}
                            className={`snap-start shrink-0 px-6 py-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 min-w-[80px] ${
                              timerDuration === opt.value
                                ? "bg-white text-black border-white shadow-md"
                                : "bg-[#050505] text-[#A1A1A1] border-[#1A1A1A] hover:border-[#333] hover:text-white"
                            }`}
                          >
                            <span className="text-sm font-medium whitespace-nowrap">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                      
                      {/* Fade indicator for scrollability */}
                      <div className={`absolute right-0 top-0 bottom-3 w-16 bg-gradient-to-l from-[#050505] via-[#050505]/80 to-transparent pointer-events-none flex items-center justify-end pr-1 transition-opacity duration-300 ${isTimerScrolledToEnd ? "opacity-0" : "opacity-100"}`}>
                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 animate-[pulse_2s_ease-in-out_infinite]">
                          <ChevronRight className="w-4 h-4 ml-0.5" />
                        </div>
                      </div>
                    </div>
                    {timerDuration && (
                      <p className="text-xs text-[#A1A1A1] mt-1">
                        Voting will automatically lock after {timerDuration < 1 ? timerDuration * 60 + " minutes" : timerDuration + " hours"}.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Title</label>
                    <input
                      className="minimal-input w-full rounded-xl px-4 py-3 text-sm"
                      placeholder='e.g. "Squad Superlatives 2026"'
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      Description <span className="text-[#A1A1A1] font-normal">(optional)</span>
                    </label>
                    <textarea
                      className="minimal-input w-full rounded-xl px-4 py-3 text-sm resize-none h-20"
                      placeholder="What's this form about?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>



                  {/* Privacy toggle */}
                  <button
                    type="button"
                    onClick={() => setIsPublicResults(!isPublicResults)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-[#1A1A1A] hover:border-[#333] bg-[#050505] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {isPublicResults ? (
                        <Globe className="w-4 h-4 text-[#4285F4]" />
                      ) : (
                        <Lock className="w-4 h-4 text-[#A1A1A1]" />
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium text-white">
                          {isPublicResults ? "Public results" : "Private results"}
                        </p>
                        <p className="text-xs text-[#A1A1A1] mt-0.5">
                          {isPublicResults
                            ? "Voters can see the results after submitting"
                            : "Only you can see the results"}
                        </p>
                      </div>
                    </div>
                    {/* Toggle pill */}
                    <div
                      className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${
                        isPublicResults ? "bg-white" : "bg-[#1A1A1A]"
                      }`}
                    >
                      <motion.div
                        animate={{ x: isPublicResults ? 22 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 rounded-full shadow"
                        style={{ backgroundColor: isPublicResults ? "#050505" : "#ffffff" }}
                      />
                    </div>
                  </button>
                </div>
              )}

              {/* ── PARTICIPANTS ── */}
              {currentStep === "participants" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight mb-1" style={displayFont}>
                      {votingType === "roster" ? "Add your squad" : "Add your options"}
                    </h2>
                    <p className="text-sm text-[#A1A1A1]">
                      {votingType === "roster" 
                        ? "Add at least 2 people — they're both the voters and the answer options."
                        : "Add at least 2 options for people to vote on (e.g., fruits, places, movies)."}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      className="minimal-input flex-1 rounded-xl px-4 py-3 text-sm"
                      placeholder="Type a name and press Enter..."
                      value={participantInput}
                      onChange={(e) => setParticipantInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addParticipant(); } }}
                    />
                    <button
                      onClick={addParticipant}
                      disabled={!participantInput.trim()}
                      className="w-12 h-12 rounded-xl btn-obsidian-primary flex items-center justify-center disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    <AnimatePresence>
                      {participants.map((name, i) => (
                        <motion.div
                          key={name}
                          initial={{ opacity: 0, scale: 0.75 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.75 }}
                          layout
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1A1A1A] bg-[#050505] text-sm text-white"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: ACCENT_COLORS[i % ACCENT_COLORS.length] }}
                          />
                          {name}
                          <button
                            onClick={() => removeParticipant(name)}
                            className="text-[#444748] hover:text-[#EA4335] transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {participants.length > 0 && (
                    <p className="text-xs text-[#A1A1A1]">
                      {participants.length} participant{participants.length !== 1 ? "s" : ""} added
                      {participants.length < 2 && " — need at least 2"}
                    </p>
                  )}
                </div>
              )}

              {/* ── QUESTIONS ── */}
              {currentStep === "questions" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight mb-1" style={displayFont}>
                      Add questions
                    </h2>
                    <p className="text-sm text-[#A1A1A1]">
                      &ldquo;Who is most likely to...&rdquo; — go wild. Add at least one.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      className="minimal-input flex-1 rounded-xl px-4 py-3 text-sm"
                      placeholder='e.g. "Who gets angry first?"'
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addQuestion(); } }}
                    />
                    <button
                      onClick={addQuestion}
                      disabled={!questionInput.trim()}
                      className="w-12 h-12 rounded-xl btn-obsidian-primary flex items-center justify-center disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <AnimatePresence>
                      {questions.map((q, i) => (
                        <motion.div
                          key={q}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -16 }}
                          layout
                          className="flex items-center gap-3 p-4 rounded-xl border border-[#1A1A1A] bg-[#050505] group"
                        >
                          <span className="text-xs text-[#444748] w-5 text-center shrink-0">{i + 1}</span>
                          <span className="text-sm flex-1 text-white">{q}</span>
                          <button
                            onClick={() => removeQuestion(q)}
                            className="opacity-0 group-hover:opacity-100 text-[#444748] hover:text-[#EA4335] transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {questions.length === 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-[#444748] font-medium uppercase tracking-wider">Quick add:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Who gets angry first?",
                          "Who has the best music taste?",
                          "Who would survive a zombie apocalypse?",
                          "Who is always late?",
                          "Who tells the best jokes?",
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => { if (!questions.includes(suggestion)) setQuestions([...questions, suggestion]); }}
                            className="text-xs px-3 py-1.5 rounded-full border border-[#1A1A1A] hover:border-[#333] text-[#A1A1A1] hover:text-white bg-[#050505] transition-all duration-200"
                          >
                            + {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── REVIEW ── */}
              {currentStep === "review" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight mb-1" style={displayFont}>
                      Ready to launch? 🚀
                    </h2>
                    <p className="text-sm text-[#A1A1A1]">
                      Review everything before publishing. You can&apos;t edit after launch (yet).
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-[#1A1A1A] bg-[#050505]">
                      <p className="text-[10px] text-[#444748] uppercase tracking-widest font-semibold mb-1.5">Title</p>
                      <p className="text-white font-medium">{title}</p>
                      {description && <p className="text-sm text-[#A1A1A1] mt-1">{description}</p>}
                    </div>

                    <div className="p-4 rounded-xl border border-[#1A1A1A] bg-[#050505]">
                      <p className="text-[10px] text-[#444748] uppercase tracking-widest font-semibold mb-2">
                        Participants ({participants.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {participants.map((name, i) => (
                          <span
                            key={name}
                            className="px-2.5 py-1 rounded-lg text-xs border border-[#1A1A1A] text-white"
                            style={{ borderColor: ACCENT_COLORS[i % ACCENT_COLORS.length] + "40" }}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#1A1A1A] bg-[#050505]">
                      <p className="text-[10px] text-[#444748] uppercase tracking-widest font-semibold mb-2">
                        Questions ({questions.length})
                      </p>
                      <div className="space-y-1.5">
                        {questions.map((q, i) => (
                          <p key={i} className="text-sm text-white flex items-start gap-2">
                            <span className="text-[#444748] shrink-0">{i + 1}.</span>
                            {q}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-4 rounded-xl border border-[#1A1A1A] bg-[#050505]">
                        <p className="text-[10px] text-[#444748] uppercase tracking-widest font-semibold mb-1">Mode</p>
                        <p className="text-sm text-white font-medium">
                          {votingType === "roster" ? "Squad Vote" : "Open Vote"}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl border border-[#1A1A1A] bg-[#050505]">
                        <p className="text-[10px] text-[#444748] uppercase tracking-widest font-semibold mb-1">Time Limit</p>
                        <p className="text-sm text-white font-medium">
                          {timerDuration ? (timerDuration < 1 ? timerDuration * 60 + ' Mins' : timerDuration + (timerDuration === 1 ? ' Hour' : ' Hours')) : "No Limit"}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-[#1A1A1A] bg-[#050505] flex items-center gap-3">
                      {isPublicResults ? (
                        <Globe className="w-4 h-4 text-[#4285F4] shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-[#A1A1A1] shrink-0" />
                      )}
                      <p className="text-sm text-[#A1A1A1]">
                        Results are <span className="text-white font-medium">{isPublicResults ? "public" : "private"}</span>
                      </p>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-[#EA4335] bg-[#EA4335]/10 border border-[#EA4335]/20 rounded-xl px-4 py-3"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Navigation ── */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentStepIndex === 0
                  ? "opacity-0 pointer-events-none"
                  : "btn-obsidian-ghost"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep === "review" ? (
              <button
                onClick={handlePublish}
                disabled={loading}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-lg text-sm font-semibold btn-obsidian-primary disabled:opacity-60"
              >
                {loading ? (
                  <motion.div
                    className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Publish form
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-lg text-sm font-semibold btn-obsidian-primary disabled:opacity-40"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Template Preview Card ── */}
        <AnimatePresence>
          {selectedTemplate && currentStep === "details" && (
            <motion.div
              layout
              initial={{ opacity: 0, x: 20, width: "auto" }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, width: 0, overflow: "hidden" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0"
            >
              <div className="glass-panel rounded-2xl p-6 lg:sticky lg:top-[120px] w-full lg:w-[360px]">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-bold text-white tracking-tight">Template Preview</h3>
                </div>
                
                <h4 className="text-lg font-bold text-white mb-1 leading-tight">{selectedTemplate?.title}</h4>
                <p className="text-xs text-[#A1A1A1] mb-5">{selectedTemplate?.description}</p>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#444748] mb-2 block">Settings</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#A1A1A1] bg-[#0A0A0A] px-2 py-1 rounded border border-[#1A1A1A] flex items-center gap-1.5">
                        {selectedTemplate?.voting_type === "roster" ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {selectedTemplate?.voting_type === "roster" ? "Squad Vote" : "Open Vote"}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#444748] mb-2 block">Questions ({selectedTemplate?.questions?.length || 0})</span>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#333] [&::-webkit-scrollbar-thumb]:rounded-full">
                      {(selectedTemplate?.questions || []).map((q, i) => (
                        <div key={i} className="text-sm text-white flex items-start gap-2 p-3 rounded-xl border border-[#1A1A1A] bg-[#050505]">
                          <span className="text-[#444748] shrink-0 text-xs mt-0.5">{i + 1}.</span>
                          <span className="leading-snug">{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}

export default function CreateFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white"><motion.div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} /></div>}>
      <CreateFormContent />
    </Suspense>
  );
}
