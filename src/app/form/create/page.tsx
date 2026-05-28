"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { FadeInUp } from "@/components/animations/motion-wrapper";
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
} from "lucide-react";
import type { FormStep } from "@/lib/types/database";

const steps: { key: FormStep; label: string; icon: React.ElementType }[] = [
  { key: "details", label: "Details", icon: FileText },
  { key: "participants", label: "People", icon: Users },
  { key: "questions", label: "Questions", icon: MessageSquare },
  { key: "review", label: "Launch", icon: Rocket },
];

export default function CreateFormPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdFormId, setCreatedFormId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser({ email: currentUser.email || "" });
      }
    }
    getUser();
  }, []);

  // Form data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [isPublicResults, setIsPublicResults] = useState(false);
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [questionInput, setQuestionInput] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case "details":
        return title.trim().length > 0 && password.trim().length > 0;
      case "participants":
        return participants.length >= 2;
      case "questions":
        return questions.length >= 1;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const addParticipant = () => {
    const name = participantInput.trim();
    if (name && !participants.includes(name)) {
      setParticipants([...participants, name]);
      setParticipantInput("");
    }
  };

  const removeParticipant = (name: string) => {
    setParticipants(participants.filter((p) => p !== name));
  };

  const addQuestion = () => {
    const text = questionInput.trim();
    if (text && !questions.includes(text)) {
      setQuestions([...questions, text]);
      setQuestionInput("");
    }
  };

  const removeQuestion = (text: string) => {
    setQuestions(questions.filter((q) => q !== text));
  };

  const handlePublish = async () => {
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to create a form.");
        return;
      }

      // 1. Create the form
      const { data: form, error: formError } = await supabase
        .from("forms")
        .insert({
          creator_id: user.id,
          title,
          description: description || null,
          password: password.trim(),
          is_active: true,
          is_public_results: isPublicResults,
        })
        .select()
        .single();

      if (formError || !form) {
        setError(formError?.message || "Failed to create form.");
        return;
      }

      // 2. Add participants
      const participantInserts = participants.map((name) => ({
        form_id: form.id,
        name,
      }));

      const { error: partError } = await supabase
        .from("participants")
        .insert(participantInserts);

      if (partError) {
        setError("Failed to add participants: " + partError.message);
        return;
      }

      // 3. Add questions
      const questionInserts = questions.map((text, i) => ({
        form_id: form.id,
        question_text: text,
        sort_order: i,
      }));

      const { error: qError } = await supabase
        .from("questions")
        .insert(questionInserts);

      if (qError) {
        setError("Failed to add questions: " + qError.message);
        return;
      }

      setCreatedFormId(form.id);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    if (createdFormId) {
      const url = `${window.location.origin}/form/${createdFormId}/fill`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ===== SUCCESS SCREEN =====
  if (createdFormId) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar user={user} />
        <main className="flex-1 flex items-center justify-center px-4 pt-16">
          <FadeInUp>
            <div className="text-center max-w-md">
              <motion.div
                className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>

              <h1 className="text-2xl font-bold mb-2">Form is live! 🎉</h1>
              <p className="text-muted-foreground text-sm mb-6">
                Share this link with your friends and watch the votes roll in.
              </p>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border mb-4">
                <code className="text-xs text-muted-foreground flex-1 truncate">
                  {window.location.origin}/form/{createdFormId}/fill
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyShareLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-border hover:border-primary/50"
                  render={<a href={`/form/${createdFormId}/results`} />}
                >
                  View Results
                </Button>
                <Button
                  className="flex-1 gradient-bg text-white border-0 hover:opacity-90"
                  render={<a href="/dashboard" />}
                >
                  Dashboard
                </Button>
              </div>
            </div>
          </FadeInUp>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar user={user} />

      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Step Indicator */}
          <FadeInUp>
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, i) => {
                const isActive = i === currentStepIndex;
                const isCompleted = i < currentStepIndex;

                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? "gradient-bg text-white glow-gradient"
                            : isCompleted
                            ? "bg-success/20 text-success"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <step.icon className="w-4 h-4" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] mt-1.5 font-medium ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className={`flex-1 h-px mx-2 mt-[-18px] transition-colors ${
                          isCompleted ? "bg-success/40" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </FadeInUp>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="glass rounded-2xl p-6 sm:p-8"
            >
              {/* ===== DETAILS STEP ===== */}
              {currentStep === "details" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Name your form</h2>
                    <p className="text-sm text-muted-foreground">
                      Give it a fun title your friends will recognize.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder='e.g. "Squad Superlatives 2026"'
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11 bg-input border-border focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="What's this form about?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[80px] bg-input border-border focus:border-primary/50 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Form Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Required to access the form"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 bg-input border-border focus:border-primary/50"
                    />
                  </div>

                  {/* Results Visibility Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsPublicResults(!isPublicResults)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      isPublicResults
                        ? "bg-primary/10 border-primary/40 text-foreground"
                        : "bg-secondary/50 border-border text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isPublicResults ? (
                        <Globe className="w-4 h-4 text-primary" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium">
                          {isPublicResults ? "Public results" : "Private results"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isPublicResults
                            ? "Voters can see the results after submitting"
                            : "Only you can see the results"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-10 h-5.5 rounded-full transition-all duration-200 relative ${
                        isPublicResults ? "bg-primary" : "bg-secondary border border-border"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                          isPublicResults ? "left-5.5" : "left-0.5"
                        }`}
                      />
                    </div>
                  </button>
                </div>
              )}

              {/* ===== PARTICIPANTS STEP ===== */}
              {currentStep === "participants" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Add your squad</h2>
                    <p className="text-sm text-muted-foreground">
                      Add at least 2 people. These are both the voters and the answer options.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a name..."
                      value={participantInput}
                      onChange={(e) => setParticipantInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addParticipant();
                        }
                      }}
                      className="h-11 bg-input border-border focus:border-primary/50"
                    />
                    <Button
                      onClick={addParticipant}
                      disabled={!participantInput.trim()}
                      className="gradient-bg text-white border-0 hover:opacity-90 h-11 px-4"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Participant tags */}
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    <AnimatePresence>
                      {participants.map((name) => (
                        <motion.div
                          key={name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          layout
                        >
                          <Badge
                            variant="secondary"
                            className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-1 bg-secondary border-border"
                          >
                            {name}
                            <button
                              onClick={() => removeParticipant(name)}
                              className="ml-1 p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {participants.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {participants.length} participant{participants.length !== 1 ? "s" : ""} added
                      {participants.length < 2 && " — need at least 2"}
                    </p>
                  )}
                </div>
              )}

              {/* ===== QUESTIONS STEP ===== */}
              {currentStep === "questions" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Add questions</h2>
                    <p className="text-sm text-muted-foreground">
                      &quot;Who is most likely to...&quot; — go wild. Add at least one.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder='e.g. "Who gets angry first?"'
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addQuestion();
                        }
                      }}
                      className="h-11 bg-input border-border focus:border-primary/50"
                    />
                    <Button
                      onClick={addQuestion}
                      disabled={!questionInput.trim()}
                      className="gradient-bg text-white border-0 hover:opacity-90 h-11 px-4"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Questions list */}
                  <div className="space-y-2">
                    <AnimatePresence>
                      {questions.map((q, i) => (
                        <motion.div
                          key={q}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          layout
                          className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border group"
                        >
                          <span className="text-xs font-mono text-muted-foreground w-6 text-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm flex-1">{q}</span>
                          <button
                            onClick={() => removeQuestion(q)}
                            className="p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Quick suggestions */}
                  {questions.length === 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">Quick add:</p>
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
                            onClick={() => {
                              if (!questions.includes(suggestion)) {
                                setQuestions([...questions, suggestion]);
                              }
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-card border border-border hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                          >
                            + {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== REVIEW STEP ===== */}
              {currentStep === "review" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Ready to launch? 🚀</h2>
                    <p className="text-sm text-muted-foreground">
                      Review everything before publishing. You can&apos;t edit after launch (yet).
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Title</p>
                      <p className="font-semibold">{title}</p>
                      {description && (
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                        Participants ({participants.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {participants.map((name) => (
                          <Badge key={name} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                        Questions ({questions.length})
                      </p>
                      <div className="space-y-1.5">
                        {questions.map((q, i) => (
                          <p key={i} className="text-sm flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{i + 1}.</span>
                            {q}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep === "review" ? (
              <Button
                onClick={handlePublish}
                disabled={loading}
                className="gradient-bg text-white border-0 hover:opacity-90 px-8"
              >
                {loading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Publish form
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="gradient-bg text-white border-0 hover:opacity-90 disabled:opacity-50"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
