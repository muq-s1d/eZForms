"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePostHog } from "posthog-js/react";

interface SuggestTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SuggestTemplateModal({ isOpen, onClose }: SuggestTemplateModalProps) {
  const posthog = usePostHog();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleAddQuestion = () => {
    if (questions.length >= 10) return;
    setQuestions([...questions, ""]);
  };
  
  const handleQuestionChange = (index: number, value: string) => {
    const newQ = [...questions];
    newQ[index] = value;
    setQuestions(newQ);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQ = [...questions];
      newQ.splice(index, 1);
      setQuestions(newQ);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError("Title is required.");
    const validQuestions = questions.filter(q => q.trim() !== "");
    if (validQuestions.length < 3) return setError("Please provide at least 3 questions.");

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertError } = await supabase
        .from("template_suggestions")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          questions: validQuestions,
          suggester_id: user?.id || null,
        });

      if (insertError) throw insertError;

      posthog?.capture("template_suggested", { title: title.trim(), question_count: validQuestions.length });
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setTimeout(() => {
          setSuccess(false);
          setTitle("");
          setDescription("");
          setQuestions([""]);
        }, 500);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit suggestion.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[101] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-lg rounded-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#1A1A1A]">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-display, var(--font-sans))" }}>
                    Suggest a Template
                  </h2>
                </div>
                <button onClick={onClose} className="p-2 text-[#A1A1A1] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-12 text-center flex flex-col items-center"
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-[#34A853] blur-xl opacity-30 rounded-full animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight" style={{ fontFamily: "var(--font-display, var(--font-sans))" }}>Suggestion Submitted!</h3>
                  <p className="text-[#A1A1A1] text-sm">Thank you for contributing. We'll review your template soon.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#A1A1A1] uppercase tracking-wider">Template Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Anime Watch Party Superlatives"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="minimal-input w-full rounded-xl px-4 py-3 text-sm text-white"
                        required
                        maxLength={50}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#A1A1A1] uppercase tracking-wider">Description (Optional)</label>
                      <textarea
                        placeholder="What is this template best used for?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="minimal-input w-full rounded-xl px-4 py-3 text-sm text-white resize-none h-20"
                        maxLength={150}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-[#A1A1A1] uppercase tracking-wider flex items-center justify-between">
                      <span>Questions</span>
                      <span>{questions.length} / 10</span>
                    </label>
                    
                    <div className="space-y-2">
                      {questions.map((q, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Question ${idx + 1}...`}
                            value={q}
                            onChange={(e) => handleQuestionChange(idx, e.target.value)}
                            className="minimal-input flex-1 rounded-xl px-4 py-2.5 text-sm text-white"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            disabled={questions.length <= 1}
                            className="p-2.5 rounded-xl text-[#444748] hover:text-[#EA4335] hover:bg-[#EA4335]/10 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {questions.length < 10 && (
                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="w-full py-2.5 rounded-xl text-sm font-medium border border-dashed border-[#262626] text-[#A1A1A1] hover:text-white hover:border-[#444] transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add another question
                      </button>
                    )}
                  </div>

                  {error && (
                    <p className="text-sm text-[#EA4335] bg-[#EA4335]/10 border border-[#EA4335]/20 p-3 rounded-lg text-center">
                      {error}
                    </p>
                  )}

                  <div className="pt-2 pb-1 border-t border-[#1A1A1A]">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-xl text-sm font-semibold btn-obsidian-primary disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit Suggestion"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
